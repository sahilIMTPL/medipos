"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import {
  Camera,
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Upload,
  Barcode,
  Search,
  Eye,
} from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { api } from "@/lib/api";

interface CameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  title?: string;
  subtitle?: string;
  recentScans?: string[];
  closeOnScan?: boolean;
}

const FORMATS = [
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.QR_CODE,
];

// Each decode runs on the main thread when BarcodeDetector isn't available,
// so keep the frame rate modest. 8 fps still feels instant for barcodes.
const SCAN_FPS = 8;

export default function CameraBarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
  title = "POS Barcode Scanner",
  subtitle = "Point camera at medicine barcode (Code 128 / EAN / QR) to add directly to sale",
  recentScans = [],
  closeOnScan = true,
}: CameraBarcodeScannerModalProps) {
  const [activeMode, setActiveMode] = useState<"CAMERA" | "FILE" | "MANUAL">("CAMERA");
  const [cameraError, setCameraError] = useState("");
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [fileScanning, setFileScanning] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStatus, setCaptureStatus] = useState<string | null>(null);

  // Scanner lifecycle
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const wantCameraRef = useRef(false);
  const lastScannedTimeRef = useRef(0);

  // Always call the latest props from long-lived scanner callbacks
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);
  const closeOnScanRef = useRef(closeOnScan);
  onScanRef.current = onScan;
  onCloseRef.current = onClose;
  closeOnScanRef.current = closeOnScan;

  // Reused heavy objects
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ocrWorkerRef = useRef<Promise<any> | null>(null);

  const reactId = useId();
  const safeId = reactId.replace(/[^a-zA-Z0-9_-]/g, "");
  const scannerContainerId = `scanner-viewport-${safeId}`;
  const fileScannerId = `file-scanner-${safeId}`;

  // ---------- Audio / haptics ----------
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        // One shared context: creating a new one per scan leaks and hits browser limits
        if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1850, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      }
    } catch (e) { }

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(100);
      } catch (e) { }
    }
  };

  // ---------- Scan result handling (debounced) ----------
  const handleScanSuccess = (decodedText: string) => {
    const clean = decodedText.trim();
    if (!clean) return;

    const now = Date.now();
    if (now - lastScannedTimeRef.current < 800) return;
    lastScannedTimeRef.current = now;

    playBeep();
    setScannedFeedback(`${clean} — Scanned successfully!`);
    onScanRef.current(clean);

    if (closeOnScanRef.current) {
      setTimeout(() => {
        stopCamera();
        onCloseRef.current();
      }, 300);
    } else {
      setTimeout(() => setScannedFeedback(null), 1500);
    }
  };

  // ---------- Camera start / stop ----------
  // Start and stop are queued so they can never overlap (the old isStarting /
  // isStopping flags could drop a start request and leave the camera dead).
  const enqueue = (task: () => Promise<void>) => {
    queueRef.current = queueRef.current.then(task).catch(() => { });
    return queueRef.current;
  };

  const teardown = async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
    } catch (e) { }
    try {
      scanner.clear();
    } catch (e) { }
  };

  const startCamera = () => {
    wantCameraRef.current = true;
    setCameraError("");

    return enqueue(async () => {
      if (!wantCameraRef.current) return;
      await teardown();
      if (!wantCameraRef.current) return;
      if (!document.getElementById(scannerContainerId)) return;

      try {
        const scanner = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: FORMATS,
          verbose: false,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: SCAN_FPS,
            // Without this, every frame that has no barcode is decoded twice
            // (normal + mirrored). Halves the per-frame cost.
            disableFlip: true,
            // Wide, short scan zone: fewer pixels to decode than before,
            // and it suits 1D barcodes.
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => ({
              width: Math.floor(Math.min(viewfinderWidth - 20, Math.max(220, viewfinderWidth * 0.75))),
              height: Math.floor(Math.min(viewfinderHeight - 20, Math.max(110, viewfinderHeight * 0.45))),
            }),
            videoConstraints: {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          (decodedText) => handleScanSuccess(decodedText),
          () => { }
        );

        if (!wantCameraRef.current) {
          await teardown();
          return;
        }
        setIsCameraRunning(true);
      } catch (err: any) {
        await teardown();
        if (
          err?.name === "AbortError" ||
          err?.message?.includes("interrupted") ||
          err?.message?.includes("play()")
        ) {
          return;
        }
        console.error("Camera scanner start failed", err);
        setCameraError(
          err?.message || "Failed to access webcam. Please check camera permissions in your browser."
        );
        setIsCameraRunning(false);
      }
    });
  };

  const stopCamera = () => {
    wantCameraRef.current = false;
    setIsCameraRunning(false);
    return enqueue(teardown);
  };

  useEffect(() => {
    if (!(isOpen && activeMode === "CAMERA")) {
      stopCamera();
      return;
    }
    const timer = setTimeout(startCamera, 200);
    return () => {
      clearTimeout(timer);
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeMode]);

  // ---------- OCR worker (created once, reused, freed on close) ----------
  const terminateOcrWorker = () => {
    const pending = ocrWorkerRef.current;
    ocrWorkerRef.current = null;
    pending?.then((w) => w.terminate()).catch(() => { });
  };

  const runOcr = async (image: HTMLCanvasElement | File): Promise<string> => {
    try {
      if (!ocrWorkerRef.current) {
        ocrWorkerRef.current = import("tesseract.js").then(({ createWorker }) => createWorker("eng"));
      }
      const worker = await ocrWorkerRef.current;
      const ret = await worker.recognize(image);
      return ret?.data?.text || "";
    } catch (e) {
      ocrWorkerRef.current = null;
      return "";
    }
  };

  useEffect(() => {
    if (!isOpen) terminateOcrWorker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    return () => {
      terminateOcrWorker();
      audioCtxRef.current?.close().catch(() => { });
      audioCtxRef.current = null;
    };
  }, []);

  // ---------- Still-image barcode decode ----------
  // html5-qrcode refuses scanFile() while the live camera is scanning, so use
  // a separate instance bound to an always-present hidden element.
  const scanImageFile = async (file: File): Promise<string | null> => {
    const scanner = new Html5Qrcode(fileScannerId, { formatsToSupport: FORMATS, verbose: false });
    try {
      return (await scanner.scanFile(file, false)) || null;
    } catch (e) {
      return null;
    } finally {
      try {
        scanner.clear();
      } catch (e) { }
    }
  };

  // ---------- Instant snapshot ----------
  const handleInstantCapture = async () => {
    if (isCapturing) return;
    const video = document.getElementById(scannerContainerId)?.querySelector("video");
    if (!video || !video.videoWidth) return;

    setIsCapturing(true);
    setCaptureStatus("Analyzing frame...");

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);

      // 1. Barcode decode on the snapshot
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92)
      );
      if (blob) {
        const decoded = await scanImageFile(new File([blob], "snapshot.jpg", { type: "image/jpeg" }));
        if (decoded) {
          setCaptureStatus(null);
          handleScanSuccess(decoded);
          return;
        }
      }

      // 2. OCR on the snapshot
      const text = await runOcr(canvas);

      const codeMatch = text.match(/\b(890\d{10}|\d{8,14}|MED-[A-Z0-9-]+)\b/i);
      if (codeMatch?.[1]) {
        setCaptureStatus(null);
        handleScanSuccess(codeMatch[1]);
        return;
      }

      const batchMatch = text.match(/\b(?:B:?|BAT:?|BATCH:?)?([A-Z0-9]+-[A-Z0-9-]+)\b/i);
      if (batchMatch?.[1]) {
        setCaptureStatus(null);
        handleScanSuccess(batchMatch[1]);
        return;
      }

      const medMatch = text.match(/\b(Amoxicillin|Paracetamol|Crocin|Azithromycin|Pantoprazole)\b/i);
      if (medMatch?.[1]) {
        setCaptureStatus(null);
        handleScanSuccess(medMatch[1]);
        return;
      }

      // 3. Server-side matching as a last resort
      if (text.trim().length > 2) {
        try {
          const serverRes = await api.decodeServer(text);
          if (serverRes && serverRes.product) {
            setCaptureStatus(null);
            handleScanSuccess(serverRes.product.barcode || serverRes.product.name);
            return;
          }
        } catch (e) { }
      }

      setCaptureStatus("No clear barcode or number detected. Hold the label closer and try again.");
      setTimeout(() => setCaptureStatus(null), 3000);
    } catch (err) {
      setCaptureStatus("Could not analyze the frame. Please try again.");
      setTimeout(() => setCaptureStatus(null), 3000);
    } finally {
      setIsCapturing(false);
    }
  };

  // ---------- Photo / screenshot upload ----------
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;

    setFileScanning(true);
    setCameraError("");
    try {
      const decoded = await scanImageFile(file);
      if (decoded) {
        handleScanSuccess(decoded);
        return;
      }

      const text = await runOcr(file);
      const codeMatch = text.match(/\b(890\d{10}|\d{12,14}|MED-[A-Z0-9-]+|BCH-[A-Z0-9-]+|EXP-[A-Z0-9-]+)\b/i);
      if (codeMatch?.[1]) {
        handleScanSuccess(codeMatch[1]);
        return;
      }

      setCameraError("No recognizable 1D barcode or number found in this photo. Try another image.");
    } catch (err) {
      setCameraError("Failed to process image file.");
    } finally {
      setFileScanning(false);
      input.value = "";
    }
  };

  if (!isOpen) return null;

  const closeModal = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Always mounted so still-image decoding works from any tab */}
        <div id={fileScannerId} className="hidden" />

        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">{title}</h3>
              <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-5 pt-3 flex items-center gap-2 border-b border-slate-100 bg-white">
          <button
            type="button"
            onClick={() => setActiveMode("CAMERA")}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${activeMode === "CAMERA"
              ? "border-emerald-600 text-emerald-700 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
          >
            <Camera className="h-4 w-4" />
            <span>Live Camera Scanner</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("FILE")}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${activeMode === "FILE"
              ? "border-emerald-600 text-emerald-700 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
          >
            <Upload className="h-4 w-4" />
            <span>Scan Photo / Image</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("MANUAL")}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${activeMode === "MANUAL"
              ? "border-emerald-600 text-emerald-700 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
          >
            <Barcode className="h-4 w-4" />
            <span>Manual Entry</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Success Flash Feedback */}
          {scannedFeedback && (
            <div className="p-3 bg-emerald-950/90 border border-emerald-600 rounded-xl text-xs text-emerald-200 font-bold flex items-center justify-between shadow-lg animate-pulse">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>
                  Match Found: <strong className="font-mono text-white text-sm ml-1">{scannedFeedback}</strong>
                </span>
              </div>
              <span className="text-[11px] text-emerald-300 bg-emerald-900 px-2 py-1 rounded">Added!</span>
            </div>
          )}

          {/* MODE 1: Camera Scanner */}
          {activeMode === "CAMERA" && (
            <div className="space-y-3">
              <div className="relative bg-black rounded-xl overflow-hidden aspect-video border border-slate-800 flex items-center justify-center">
                <div id={scannerContainerId} className="w-full h-full" />

                {/* Targeting guide with corner brackets */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                  <div className="w-full h-full max-w-sm max-h-48 border border-emerald-500/30 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br" />
                    <div className="absolute left-0 right-0 h-1 bg-emerald-400/40 shadow-[0_0_8px_#10b981] animate-pulse top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {!isCameraRunning && !cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/90">
                    <RefreshCw className="h-6 w-6 animate-spin text-emerald-400" />
                    <span className="text-xs text-slate-300">Starting HD camera stream...</span>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-1" />
                  <div>
                    <span className="font-semibold block">Camera Access Issue</span>
                    <span>{cameraError}</span>
                  </div>
                </div>
              )}

              {captureStatus && (
                <p className="text-xs text-slate-300 text-center" role="status">
                  {captureStatus}
                </p>
              )}

              {/* Instant Capture Action Bar */}
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleInstantCapture}
                  disabled={!isCameraRunning || isCapturing}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                  title="Capture sharp frame and analyze both barcode and printed numbers"
                >
                  {isCapturing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span>{isCapturing ? "Analyzing..." : "Instant Frame Capture & Scan"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setTimeout(startCamera, 200);
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
                  title="Restart camera stream"
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* MODE 2: File Upload Scanner */}
          {activeMode === "FILE" && (
            <div className="space-y-4 py-2">
              <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-emerald-50/30 transition group">
                <Upload className="h-10 w-10 text-slate-400 group-hover:text-emerald-600 mb-2 transition" />
                <span className="text-sm font-bold text-slate-900 mb-1">
                  Click to Upload or Drop Barcode Photo
                </span>
                <span className="text-xs text-slate-500 text-center max-w-xs">
                  Upload a photo of your printed sticker or a screenshot. The scanner will identify the barcode or printed numbers automatically.
                </span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>

              {fileScanning && (
                <div className="text-center text-xs text-emerald-700 flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Scanning image for barcode symbols and numbers...</span>
                </div>
              )}

              {cameraError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>
          )}

          {/* MODE 3: Manual Input */}
          {activeMode === "MANUAL" && (
            <div className="space-y-4 py-1">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualCode.trim()) {
                    handleScanSuccess(manualCode.trim());
                    setManualCode("");
                  }
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Enter barcode or SKU number..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono shadow-xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Search className="h-4 w-4" />
                  <span>Scan</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition cursor-pointer shadow-xs"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
}