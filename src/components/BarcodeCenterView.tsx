"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Barcode,
  QrCode,
  Printer,
  Camera,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ShoppingCart,
  Package,
  Layers,
  Sliders,
  Volume2,
  Zap,
  Sparkles,
  Upload,
  Download,
  Share2,
  Save,
  Loader2,
  MessageCircle,
} from "lucide-react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { api, ProductItem } from "@/lib/api";
import CameraBarcodeScannerModal from "./CameraBarcodeScannerModal";

interface BarcodeCenterViewProps {
  onNavigateToPos?: () => void;
  onNavigateToInventory?: () => void;
}

// 1. Genuine Scannable Code 128 Barcode Component
function RealBarcodeSvg({
  value,
  height = 36,
  width = 1.8,
}: {
  value: string;
  height?: number;
  width?: number;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          width,
          height,
          displayValue: true,
          fontSize: 10,
          font: "monospace",
          textMargin: 2,
          margin: 0,
        });
      } catch (err) {
        console.warn("JsBarcode formatting error", err);
      }
    }
  }, [value, height, width]);

  return <svg ref={svgRef} className="max-w-[240px] w-full" />;
}

// 2. Genuine Scannable 2D QR Code Component
function RealQrSvg({ value, size = 64 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    if (value) {
      QRCode.toDataURL(value, {
        width: size,
        margin: 0,
        errorCorrectionLevel: "M",
      })
        .then((url) => setDataUrl(url))
        .catch(() => {});
    }
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="bg-slate-200 animate-pulse rounded"
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt="QR Code"
      style={{ width: size, height: size }}
      className="object-contain"
    />
  );
}

export default function BarcodeCenterView({
  onNavigateToPos,
  onNavigateToInventory,
}: BarcodeCenterViewProps) {
  const [activeTab, setActiveTab] = useState<"GENERATOR" | "SCANNER">("GENERATOR");

  // Products Master
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedBatchIndex, setSelectedBatchIndex] = useState(0);

  // Generator Options
  const [labelSize, setLabelSize] = useState<"50x25" | "38x25" | "A4_24" | "A4_40">("50x25");
  const [codeType, setCodeType] = useState<"CODE128" | "QR" | "HYBRID">("CODE128");
  const [labelCount, setLabelCount] = useState(12);
  const [showStoreName, setShowStoreName] = useState(true);
  const [showGeneric, setShowGeneric] = useState(true);
  const [showBatch, setShowBatch] = useState(true);
  const [showExpiry, setShowExpiry] = useState(true);
  const [showMrp, setShowMrp] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  // Save & Assign Barcode State
  const [isSavingBarcode, setIsSavingBarcode] = useState(false);
  const [saveBarcodeMessage, setSaveBarcodeMessage] = useState("");
  const [assignTargetProductId, setAssignTargetProductId] = useState("");
  const [isAssigningBarcode, setIsAssigningBarcode] = useState(false);
  const [assignMessage, setAssignMessage] = useState("");
  const [downloadingSticker, setDownloadingSticker] = useState(false);

  // Scanner State
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [scanQuery, setScanQuery] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<{
    matchType: "PRODUCT" | "BATCH";
    matchedBatch?: {
      id: string;
      batchNumber: string;
      expiryDate: string;
      availableQty: number;
      mrp: number;
      purchasePrice: number;
    };
    product: any;
  } | null>(null);
  const [scanError, setScanError] = useState("");

  const barcodeBufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  // Load Products for Generator
  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.getProducts();
      if (res.products && res.products.length > 0) {
        setProducts(res.products);
        setSelectedProductId(res.products[0].id);
      }
    } catch (err) {
      console.error("Failed to load products for barcode center", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Selected Product & Batch
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0] || null;
  const currentBatch =
    selectedProduct?.batches && selectedProduct.batches.length > 0
      ? selectedProduct.batches[selectedBatchIndex] || selectedProduct.batches[0]
      : null;

  const barcodeValue =
    selectedProduct?.barcode ||
    (selectedProduct?.sku ? `890${selectedProduct.sku.replace(/\D/g, "").padEnd(9, "0")}` : "8901111000101");
  const batchNo = currentBatch?.batchNumber || "BCH-2026-001";
  const expDate = currentBatch?.expiryDate || "2027-12-31";
  const mrpVal = (currentBatch?.mrp || selectedProduct?.mrp || 0).toFixed(2);

  // Sound Effect for successful barcode scan
  const playScanBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1850, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  };

  // Hardware USB & Wireless Barcode Scanner Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const isInput =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.isContentEditable);

      // If user is focused inside an input, let the input handle keystrokes natively
      if (isInput) {
        return;
      }

      const currentTime = Date.now();
      const timeSinceLastKey = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Scanners type fast (<60ms). 250ms threshold accommodates wireless/Bluetooth barcode scanners.
      if (timeSinceLastKey > 250) {
        barcodeBufferRef.current = "";
      }

      if (e.key === "Enter") {
        if (barcodeBufferRef.current.length >= 3) {
          e.preventDefault();
          const scannedCode = barcodeBufferRef.current;
          barcodeBufferRef.current = "";
          handleExecuteScan(scannedCode);
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [products]);

  // Execute Fast Lookup for a scanned code
  const handleExecuteScan = async (code: string) => {
    const clean = code.trim();
    if (!clean) return;

    setScanQuery(clean);
    setScanning(true);
    setScanError("");

    // Normalization candidates (Indian GS1 EAN-13 890 vs UPC-A 12-digit 90 vs 99, 11-digit and 10-digit)
    const candidates = new Set<string>();
    [clean, clean.replace(/[\s-_]/g, "")].forEach((tok) => {
      if (!tok) return;
      const t = tok.toLowerCase();
      candidates.add(t);

      // 13-digit standard EAN-13 (890...)
      if (t.length === 13 && t.startsWith("890")) {
        candidates.add(t.slice(1));
        candidates.add("99" + t.slice(3));
        candidates.add(t.slice(3));
      }
      if (t.length === 13 && t.startsWith("0")) {
        candidates.add(t.slice(1));
      }

      // 12-digit scans
      if (t.length === 12) {
        candidates.add("0" + t);
        if (t.startsWith("90")) {
          candidates.add("8" + t);
          candidates.add("99" + t.slice(2));
          candidates.add(t.slice(2));
        }
        if (t.startsWith("99")) {
          candidates.add("90" + t.slice(2));
          candidates.add("890" + t.slice(2));
          candidates.add(t.slice(2));
        }
      }

      // 11-digit scans (leading 2 digits dropped by scanner buffer)
      if (t.length === 11) {
        candidates.add("89" + t);
        if (t.startsWith("0")) {
          candidates.add("89" + t);
          candidates.add("9" + t);
        }
        if (t.startsWith("90")) {
          candidates.add("8" + t);
        }
        candidates.add("890" + t.slice(1));
      }

      // 10-digit core scans
      if (t.length === 10) {
        candidates.add("890" + t);
        candidates.add("90" + t);
        candidates.add("99" + t);
        candidates.add("0" + t);
      }
    });

    // 1. Instant In-Memory Lookup (0.1ms)
    const localMatch = products.find((p) => {
      const pBarcode = (p.barcode || "").toLowerCase();
      const pSku = (p.sku || "").toLowerCase();
      const pName = (p.name || "").toLowerCase();
      for (const cand of candidates) {
        if (pBarcode === cand || pSku === cand || pName === cand) return true;
      }
      return false;
    });

    if (localMatch) {
      playScanBeep();
      setScannedResult({
        matchType: "PRODUCT",
        product: localMatch,
      });
      setScanning(false);
      return;
    }

    // 2. High-speed Database Lookup (<30ms)
    try {
      const data = await api.lookupBarcode(clean);
      if (data.success) {
        playScanBeep();
        setScannedResult(data);
      }
    } catch (err: any) {
      setScanError(err.message || `No medicine found for barcode "${clean}"`);
      setScannedResult(null);
    } finally {
      setScanning(false);
    }
  };

  // Trigger browser print
  const handlePrintLabels = () => {
    window.print();
  };

  // Copy Barcode to Clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(barcodeValue);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // 1. Download Standalone Barcode PNG
  const handleDownloadBarcode = () => {
    try {
      const canvas = document.createElement("canvas");
      JsBarcode(canvas, barcodeValue, {
        format: "CODE128",
        width: 2.5,
        height: 80,
        displayValue: true,
        fontSize: 14,
        font: "monospace",
        textMargin: 6,
        margin: 12,
        background: "#ffffff",
        lineColor: "#000000",
      });
      const a = document.createElement("a");
      a.download = `barcode-${barcodeValue}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    } catch (err) {
      console.error("Barcode download error", err);
    }
  };

  // 2. Download Standalone QR Code PNG
  const handleDownloadQr = () => {
    try {
      QRCode.toDataURL(`${barcodeValue}|${batchNo}|${expDate}|${mrpVal}`, {
        width: 600,
        margin: 2,
        errorCorrectionLevel: "H",
      }).then((url) => {
        const a = document.createElement("a");
        a.download = `qrcode-${barcodeValue}.png`;
        a.href = url;
        a.click();
      });
    } catch (err) {
      console.error("QR download error", err);
    }
  };

  // 3. Download Full Label Sticker PNG
  const handleDownloadSticker = async () => {
    setDownloadingSticker(true);
    try {
      const scale = 2;
      const width = (labelSize === "50x25" ? 300 : 250) * scale;
      const height = 180 * scale;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clean white background & black border
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3 * scale;
      ctx.strokeRect(4 * scale, 4 * scale, width - 8 * scale, height - 8 * scale);

      let currentY = 16 * scale;

      // Store Name
      if (showStoreName) {
        ctx.fillStyle = "#000000";
        ctx.font = `bold ${10 * scale}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("CITY MEDICAL STORE", width / 2, currentY);
        currentY += 4 * scale;
        ctx.beginPath();
        ctx.moveTo(8 * scale, currentY);
        ctx.lineTo(width - 8 * scale, currentY);
        ctx.lineWidth = 1 * scale;
        ctx.strokeStyle = "#000000";
        ctx.stroke();
        currentY += 12 * scale;
      }

      // Medicine Name
      ctx.textAlign = "left";
      ctx.fillStyle = "#000000";
      ctx.font = `bold ${11 * scale}px sans-serif`;
      const medName = selectedProduct?.name || "Medicine Name";
      ctx.fillText(medName.slice(0, 32), 10 * scale, currentY);
      currentY += 12 * scale;

      // Generic Name
      if (showGeneric && selectedProduct?.genericName) {
        ctx.font = `${9 * scale}px sans-serif`;
        ctx.fillStyle = "#4b5563";
        ctx.fillText(selectedProduct.genericName.slice(0, 38), 10 * scale, currentY);
        currentY += 12 * scale;
      }

      // Barcode / QR Middle Area
      if (codeType === "CODE128") {
        const barcodeCanvas = document.createElement("canvas");
        JsBarcode(barcodeCanvas, barcodeValue, {
          format: "CODE128",
          width: 1.8 * scale,
          height: 38 * scale,
          displayValue: true,
          fontSize: 9 * scale,
          font: "monospace",
          textMargin: 2 * scale,
          margin: 0,
        });
        const bcWidth = barcodeCanvas.width;
        const bcX = (width - bcWidth) / 2;
        ctx.drawImage(barcodeCanvas, Math.max(10 * scale, bcX), currentY, Math.min(width - 20 * scale, bcWidth), 45 * scale);
        currentY += 48 * scale;
      } else if (codeType === "QR") {
        const qrUrl = await QRCode.toDataURL(`${barcodeValue}|${batchNo}|${expDate}|${mrpVal}`, {
          width: 64 * scale,
          margin: 0,
          errorCorrectionLevel: "M",
        });
        const qrImg = new Image();
        await new Promise((res) => {
          qrImg.onload = res;
          qrImg.src = qrUrl;
        });
        const qrX = (width - 64 * scale) / 2;
        ctx.drawImage(qrImg, qrX, currentY, 64 * scale, 64 * scale);
        currentY += 66 * scale;
        ctx.font = `bold ${9 * scale}px monospace`;
        ctx.textAlign = "center";
        ctx.fillStyle = "#000000";
        ctx.fillText(barcodeValue, width / 2, currentY);
        currentY += 6 * scale;
      } else {
        // HYBRID
        const barcodeCanvas = document.createElement("canvas");
        JsBarcode(barcodeCanvas, barcodeValue, {
          format: "CODE128",
          width: 1.3 * scale,
          height: 32 * scale,
          displayValue: true,
          fontSize: 8 * scale,
          font: "monospace",
          textMargin: 2 * scale,
          margin: 0,
        });
        const qrUrl = await QRCode.toDataURL(`${barcodeValue}|${batchNo}|${expDate}|${mrpVal}`, {
          width: 48 * scale,
          margin: 0,
        });
        const qrImg = new Image();
        await new Promise((res) => {
          qrImg.onload = res;
          qrImg.src = qrUrl;
        });
        ctx.drawImage(barcodeCanvas, 10 * scale, currentY, width - 75 * scale, 40 * scale);
        ctx.drawImage(qrImg, width - 60 * scale, currentY, 48 * scale, 48 * scale);
        currentY += 46 * scale;
      }

      // Footer Divider
      ctx.beginPath();
      ctx.moveTo(8 * scale, height - 28 * scale);
      ctx.lineTo(width - 8 * scale, height - 28 * scale);
      ctx.lineWidth = 1 * scale;
      ctx.strokeStyle = "#000000";
      ctx.stroke();

      // Footer Details: Batch, Expiry, MRP
      ctx.textAlign = "left";
      ctx.fillStyle = "#000000";
      ctx.font = `bold ${9 * scale}px sans-serif`;
      if (showBatch) {
        ctx.fillText(`B.No: ${batchNo}`, 10 * scale, height - 16 * scale);
      }
      if (showExpiry) {
        ctx.fillText(`EXP: ${expDate}`, 10 * scale, height - 6 * scale);
      }

      if (showMrp) {
        ctx.textAlign = "right";
        ctx.font = `${8 * scale}px sans-serif`;
        ctx.fillText("MRP (Incl. Taxes)", width - 10 * scale, height - 16 * scale);
        ctx.font = `bold ${12 * scale}px sans-serif`;
        ctx.fillText(`₹${mrpVal}`, width - 10 * scale, height - 5 * scale);
      }

      const link = document.createElement("a");
      const safeName = (selectedProduct?.name || "medicine").replace(/[^a-zA-Z0-9_-]/g, "_");
      link.download = `label-${safeName}-${barcodeValue}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Sticker download error", err);
    } finally {
      setDownloadingSticker(false);
    }
  };

  // 5. Save generated barcode to the medicine master
  const handleSaveBarcodeToMedicine = async () => {
    if (!selectedProduct) return;
    setIsSavingBarcode(true);
    setSaveBarcodeMessage("");
    try {
      await api.assignBarcode(selectedProduct.id, barcodeValue);
      setSaveBarcodeMessage(`Saved barcode "${barcodeValue}" to ${selectedProduct.name}!`);
      // Update local product list
      setProducts((prev) =>
        prev.map((p) => (p.id === selectedProduct.id ? { ...p, barcode: barcodeValue } : p))
      );
      setTimeout(() => setSaveBarcodeMessage(""), 4000);
    } catch (err: any) {
      setSaveBarcodeMessage(err.message || "Failed to save barcode.");
    } finally {
      setIsSavingBarcode(false);
    }
  };

  // 6. Assign scanned unknown barcode to a medicine
  const handleAssignScannedBarcode = async () => {
    if (!assignTargetProductId || !scanQuery.trim()) return;
    setIsAssigningBarcode(true);
    setAssignMessage("");
    try {
      const res = await api.assignBarcode(assignTargetProductId, scanQuery.trim());
      setAssignMessage(res.message || "Barcode assigned successfully!");
      // Update local products
      setProducts((prev) =>
        prev.map((p) => (p.id === assignTargetProductId ? { ...p, barcode: scanQuery.trim() } : p))
      );
      // Re-scan immediately
      setTimeout(() => {
        handleExecuteScan(scanQuery.trim());
      }, 500);
    } catch (err: any) {
      setAssignMessage(err.message || "Failed to assign barcode.");
    } finally {
      setIsAssigningBarcode(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Barcode & Labels
              </h1>
              <p className="text-xs text-slate-500">
                Generate and print barcode stickers for medicines
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => setActiveTab("GENERATOR")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "GENERATOR"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Printer className="h-4 w-4" />
            <span>Generate & Print Labels</span>
          </button>
          <button
            onClick={() => setActiveTab("SCANNER")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "SCANNER"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>Interactive Scanner</span>
          </button>
        </div>
      </div>

      {/* TAB 1: GENERATE & PRINT LABELS */}
      {activeTab === "GENERATOR" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Sliders className="h-4 w-4 text-indigo-600" />
                <span>Label Configuration</span>
              </h3>
            </div>

            {/* Select Medicine */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Select Medicine
              </label>
              {loadingProducts ? (
                <div className="text-xs text-slate-500 flex items-center gap-2 py-2">
                  <RefreshCw className="h-3 w-3 animate-spin text-indigo-600" />
                  <span>Loading medicines...</span>
                </div>
              ) : (
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    setSelectedBatchIndex(0);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.strength ? `(${p.strength})` : ""} — SKU: {p.sku}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Select Batch */}
            {selectedProduct && selectedProduct.batches && selectedProduct.batches.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Select Batch & Expiry
                </label>
                <select
                  value={selectedBatchIndex}
                  onChange={(e) => setSelectedBatchIndex(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {selectedProduct.batches.map((b, idx) => (
                    <option key={b.id || idx} value={idx}>
                      Batch: {b.batchNumber} | Exp: {b.expiryDate} | MRP: ₹{b.mrp}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Label Layout Dimension */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Sticker Sheet Layout
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLabelSize("50x25")}
                  className={`px-3 py-2 border rounded-lg text-xs font-semibold text-center transition cursor-pointer ${
                    labelSize === "50x25"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  50mm × 25mm (Thermal)
                </button>
                <button
                  type="button"
                  onClick={() => setLabelSize("38x25")}
                  className={`px-3 py-2 border rounded-lg text-xs font-semibold text-center transition cursor-pointer ${
                    labelSize === "38x25"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  38mm × 25mm (Compact)
                </button>
                <button
                  type="button"
                  onClick={() => setLabelSize("A4_24")}
                  className={`px-3 py-2 border rounded-lg text-xs font-semibold text-center transition cursor-pointer ${
                    labelSize === "A4_24"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  A4 Sheet (24 Labels)
                </button>
                <button
                  type="button"
                  onClick={() => setLabelSize("A4_40")}
                  className={`px-3 py-2 border rounded-lg text-xs font-semibold text-center transition cursor-pointer ${
                    labelSize === "A4_40"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  A4 Sheet (40 Labels)
                </button>
              </div>
            </div>

            {/* Symbology Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Barcode Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCodeType("CODE128")}
                  className={`px-3 py-2 border rounded-lg text-xs font-semibold text-center transition cursor-pointer ${
                    codeType === "CODE128"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  1D Barcode
                </button>
                <button
                  type="button"
                  onClick={() => setCodeType("QR")}
                  className={`px-3 py-2 border rounded-lg text-xs font-semibold text-center transition cursor-pointer ${
                    codeType === "QR"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  2D QR Code
                </button>
                <button
                  type="button"
                  onClick={() => setCodeType("HYBRID")}
                  className={`px-3 py-2 border rounded-lg text-xs font-semibold text-center transition cursor-pointer ${
                    codeType === "HYBRID"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Dual (1D + QR)
                </button>
              </div>
            </div>

            {/* Label Content Inclusions */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Fields to Include on Sticker
              </label>
              <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showStoreName}
                    onChange={(e) => setShowStoreName(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span>Store Name (City Medical Store)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showGeneric}
                    onChange={(e) => setShowGeneric(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span>Generic Composition</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBatch}
                    onChange={(e) => setShowBatch(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span>Batch Number ({batchNo})</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showExpiry}
                    onChange={(e) => setShowExpiry(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span>Expiry Date ({expDate})</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showMrp}
                    onChange={(e) => setShowMrp(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span>MRP (₹{mrpVal})</span>
                </label>
              </div>
            </div>

            {/* Label Print Quantity */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Quantity to Print
                </label>
                <span className="text-[11px] text-slate-500">Total stickers to output</span>
              </div>
              <input
                type="number"
                min={1}
                max={500}
                value={labelCount}
                onChange={(e) => setLabelCount(Math.max(1, Number(e.target.value)))}
                className="w-20 px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Print Action */}
            <button
              onClick={handlePrintLabels}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print {labelCount} Barcode Label(s)</span>
            </button>
          </div>

          {/* Live Preview Column (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-6 gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Live Sticker Preview ({labelSize})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Standard printable barcode &amp; QR code preview
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadSticker}
                    disabled={downloadingSticker}
                    className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                    title="Download high-resolution sticker PNG image"
                  >
                    {downloadingSticker ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Download className="h-3 w-3" />
                    )}
                    <span>Download Label (PNG)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
                    title="Copy barcode to clipboard"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Centered Sticker Container */}
              <div className="flex items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <div
                  style={{
                    width: labelSize === "50x25" ? "280px" : "240px",
                    minHeight: "150px",
                  }}
                  className="bg-white border-2 border-black p-3 rounded-lg shadow-md text-black flex flex-col justify-between select-none"
                >
                  {/* Store Name Header */}
                  {showStoreName && (
                    <div className="text-center border-b border-black pb-1 mb-1">
                      <span className="text-[11px] font-black uppercase tracking-wider block">
                        CITY MEDICAL STORE
                      </span>
                    </div>
                  )}

                  {/* Medicine Name */}
                  <div className="leading-tight mb-1">
                    <span className="text-xs font-black block truncate">
                      {selectedProduct?.name || "Medicine Name"}
                    </span>
                    {showGeneric && selectedProduct?.genericName && (
                      <span className="text-[10px] text-gray-700 block truncate">
                        {selectedProduct.genericName}
                      </span>
                    )}
                  </div>

                  {/* Barcode / QR Middle Area */}
                  <div className="my-1 flex items-center justify-center">
                    {codeType === "CODE128" && (
                      <RealBarcodeSvg value={barcodeValue} height={38} width={1.8} />
                    )}

                    {codeType === "QR" && (
                      <div className="flex flex-col items-center">
                        <RealQrSvg
                          value={`${barcodeValue}|${batchNo}|${expDate}|${mrpVal}`}
                          size={64}
                        />
                        <span className="text-[9px] font-mono font-bold mt-1 tracking-wider">
                          {barcodeValue}
                        </span>
                      </div>
                    )}

                    {codeType === "HYBRID" && (
                      <div className="flex items-center justify-between w-full gap-2">
                        <div className="flex-1 overflow-hidden">
                          <RealBarcodeSvg value={barcodeValue} height={32} width={1.4} />
                        </div>
                        <div className="flex-shrink-0">
                          <RealQrSvg
                            value={`${barcodeValue}|${batchNo}|${expDate}|${mrpVal}`}
                            size={48}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Batch, Expiry, MRP Footer */}
                  <div className="border-t border-black pt-1 mt-1 text-[10px] font-bold flex items-center justify-between">
                    <div>
                      {showBatch && <div>B.No: {batchNo}</div>}
                      {showExpiry && <div>EXP: {expDate}</div>}
                    </div>
                    {showMrp && (
                      <div className="text-right">
                        <span className="text-xs font-black">MRP ₹{mrpVal}</span>
                        <div className="text-[8px] text-gray-600 font-normal">Incl. Taxes</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sticker Download & Share Suite */}
              <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Download className="h-4 w-4 text-indigo-600" />
                    <span>Download &amp; Export Options</span>
                  </span>
                  <span className="text-[11px] text-slate-500">Print Quality PNG</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Download Full Sticker */}
                  <button
                    type="button"
                    onClick={handleDownloadSticker}
                    disabled={downloadingSticker}
                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {downloadingSticker ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span>Download Sticker</span>
                  </button>

                  {/* Download Barcode Only */}
                  <button
                    type="button"
                    onClick={handleDownloadBarcode}
                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 transition gap-1 cursor-pointer shadow-xs"
                  >
                    <Barcode className="h-4 w-4 text-indigo-600" />
                    <span>Download Barcode</span>
                  </button>

                  {/* Download QR Code Only */}
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 transition gap-1 cursor-pointer shadow-xs"
                  >
                    <QrCode className="h-4 w-4 text-emerald-600" />
                    <span>Download QR</span>
                  </button>
                </div>

                {/* Save Barcode to Medicine Master */}
                <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="text-xs">
                    <span className="text-slate-500">Current Medicine: </span>
                    <span className="font-bold text-slate-900">{selectedProduct?.name} </span>
                    <span className="text-slate-400 font-mono">
                      ({selectedProduct?.barcode ? `Linked: ${selectedProduct.barcode}` : "No Barcode Linked"})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveBarcodeToMedicine}
                    disabled={isSavingBarcode}
                    className="px-3 py-1 rounded-lg bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
                  >
                    {isSavingBarcode ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    <span>Save to Medicine Master</span>
                  </button>
                </div>

                {saveBarcodeMessage && (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span>{saveBarcodeMessage}</span>
                  </div>
                )}
              </div>

              {/* Barcode Info Metadata */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Barcode / EAN</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{barcodeValue}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">SKU Code</span>
                  <span className="font-mono font-bold text-indigo-700 text-sm">
                    {selectedProduct?.sku || "N/A"}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Active Batch</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">{batchNo}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-800 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600 flex-shrink-0" />
              <span>
                Labels ready to print on standard thermal sticker rolls or A4 sticker sheets.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE BARCODE SCANNER */}
      {activeTab === "SCANNER" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Scanner Controls Column (6 cols) */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Camera className="h-4 w-4 text-emerald-600" />
                <span>Barcode Scanner</span>
              </h3>
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                <Zap className="h-3 w-3" />
                <span>Hardware Gun Ready</span>
              </div>
            </div>

            {/* Launch Camera Barcode Scanner Action Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Camera className="h-7 w-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Camera Barcode Scanner</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Point camera at any printed medicine label or box to inspect batch and stock details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsScannerModalOpen(true)}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition flex items-center gap-2 mx-auto shadow-xs cursor-pointer"
              >
                <Camera className="h-4 w-4" />
                <span>Open Camera Scanner</span>
              </button>
            </div>

            {/* Manual Barcode Search / Scanner Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Scan with USB Gun or Enter Barcode / SKU
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const targetInput = e.currentTarget.querySelector("input") as HTMLInputElement | null;
                  const val = targetInput?.value.trim() || scanQuery.trim();
                  if (val) handleExecuteScan(val);
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Scan barcode gun or type code (e.g. 8901111000105)..."
                    value={scanQuery}
                    onChange={(e) => setScanQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim() || scanQuery.trim();
                        if (val) handleExecuteScan(val);
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono shadow-xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={scanning || !scanQuery.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  {scanning ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span>Lookup</span>
                </button>
              </form>
            </div>

            {/* Quick Simulation Chips */}
            <div>
              <span className="text-xs text-slate-500 block mb-2 font-medium">
                Quick Barcode Test Simulations:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setScanQuery("8901111000105");
                    handleExecuteScan("8901111000105");
                  }}
                  className="px-3 py-1 bg-white hover:bg-slate-50 text-xs text-slate-700 rounded-lg border border-slate-200 font-mono transition shadow-xs cursor-pointer"
                >
                  8901111000105 (Amoxicillin)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScanQuery("8901111000103");
                    handleExecuteScan("8901111000103");
                  }}
                  className="px-3 py-1 bg-white hover:bg-slate-50 text-xs text-slate-700 rounded-lg border border-slate-200 font-mono transition shadow-xs cursor-pointer"
                >
                  8901111000103 (Azithromycin)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScanQuery("8901111000102");
                    handleExecuteScan("8901111000102");
                  }}
                  className="px-3 py-1 bg-white hover:bg-slate-50 text-xs text-slate-700 rounded-lg border border-slate-200 font-mono transition shadow-xs cursor-pointer"
                >
                  8901111000102 (Crocin 650)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScanQuery("MED-AMOX-500");
                    handleExecuteScan("MED-AMOX-500");
                  }}
                  className="px-3 py-1 bg-white hover:bg-slate-50 text-xs text-slate-700 rounded-lg border border-slate-200 font-mono transition shadow-xs cursor-pointer"
                >
                  MED-AMOX-500 (SKU)
                </button>
              </div>
            </div>

            {/* Audio Feedback Reminder */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-xs text-slate-500">
              <Volume2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>
                Scanner Audio: Beep sound plays automatically upon successful barcode match.
              </span>
            </div>
          </div>

          {/* Scanned Result Card Column (6 cols) */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-bold text-slate-900 text-base">
                  Medicine Inspector Result
                </h3>
                {scannedResult && (
                  <span className="text-xs px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-medium">
                    Matched via {scannedResult.matchType === "PRODUCT" ? "Product Barcode / SKU" : "Batch #"}
                  </span>
                )}
              </div>

              {scanError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-100 text-rose-600 rounded-lg flex-shrink-0">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Barcode Not Linked: &quot;{scanQuery || "Scanned Code"}&quot;
                      </h4>
                      <p className="text-xs text-rose-700 mt-1">
                        {scanError}
                      </p>
                    </div>
                  </div>

                  {/* Quick Assign Drawer */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 shadow-xs">
                    <span className="text-xs font-bold text-slate-800 block">
                      Quick Link &amp; Assign &quot;{scanQuery}&quot; to a Medicine:
                    </span>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <select
                        value={assignTargetProductId}
                        onChange={(e) => setAssignTargetProductId(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="">-- Select medicine to assign this barcode --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku}) {p.barcode ? `[Existing: ${p.barcode}]` : "[No Barcode]"}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={!assignTargetProductId || isAssigningBarcode}
                        onClick={handleAssignScannedBarcode}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 shadow-xs"
                      >
                        {isAssigningBarcode ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        <span>Assign &amp; Re-Scan</span>
                      </button>
                    </div>

                    {assignMessage && (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        <span>{assignMessage}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!scannedResult && !scanError && (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <Barcode className="h-12 w-12 mx-auto stroke-2 text-slate-400" />
                  <p className="text-sm font-medium text-slate-600">Awaiting Barcode Scan</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Click &quot;Open Camera Scanner&quot; above, use a USB barcode gun, or click one of the quick test simulations.
                  </p>
                </div>
              )}

              {scannedResult && (
                <div className="space-y-4">
                  {/* Medicine Master Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-slate-900">
                          {scannedResult.product.name}
                        </h4>
                        <div className="text-xs text-slate-500">
                          {scannedResult.product.genericName}
                        </div>
                        <div className="text-xs text-indigo-700 mt-1 font-medium">
                          Category: {scannedResult.product.categoryName} • Packaging: {scannedResult.product.packDescription}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Retail MRP</span>
                        <span className="text-xl font-bold text-emerald-700 font-mono">
                          ₹{scannedResult.product.mrp}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Barcode</span>
                        <span className="font-mono font-bold text-slate-900">
                          {scannedResult.product.barcode || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">SKU</span>
                        <span className="font-mono font-bold text-slate-900">{scannedResult.product.sku}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Base Unit</span>
                        <span className="font-bold text-slate-800">{scannedResult.product.baseUnit}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Total Stock</span>
                        <span className="font-bold text-purple-700 font-mono">
                          {scannedResult.product.totalBaseStock} {scannedResult.product.baseUnit}s
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active Batches Table */}
                  <div>
                    <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Active Batches in Stock ({scannedResult.product.batches?.length || 0})
                    </h5>
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                      <div className="overflow-x-auto scrollbar-thin">
                        <table className="w-full text-left text-xs text-slate-700 min-w-[500px] whitespace-nowrap">
                          <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="py-3 px-3 min-w-[130px]">Batch Number</th>
                              <th className="py-3 px-3 min-w-[110px]">Expiry</th>
                              <th className="py-3 px-3 text-right min-w-[120px]">Available Qty</th>
                              <th className="py-3 px-3 text-right min-w-[110px]">Batch MRP</th>
                            </tr>
                          </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {scannedResult.product.batches && scannedResult.product.batches.length > 0 ? (
                            scannedResult.product.batches.map((b: any) => (
                              <tr key={b.id} className="hover:bg-slate-50">
                                <td className="py-2 px-3 font-mono font-bold text-slate-900">{b.batchNumber}</td>
                                <td className="py-2 px-3 text-slate-600">{b.expiryDate}</td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-purple-700">
                                  {b.availableQty}
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-emerald-700 font-semibold">
                                  ₹{b.mrp}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="py-3 text-center text-slate-400">
                                No active batches currently in stock.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Navigation Buttons */}
            {scannedResult && (
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-3">
                {onNavigateToPos && (
                  <button
                    onClick={onNavigateToPos}
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Dispense in POS Sale</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedProductId(scannedResult.product.id);
                    setActiveTab("GENERATOR");
                  }}
                  className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Generate Labels</span>
                </button>

                {onNavigateToInventory && (
                  <button
                    onClick={onNavigateToInventory}
                    className="py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Layers className="h-4 w-4" />
                    <span>View Stock Ledger</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Camera Barcode Scanner Modal Integration */}
      <CameraBarcodeScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        title="Interactive Camera Barcode Scanner"
        subtitle="Point camera at printed medicine barcode or QR code to inspect batch & stock"
        closeOnScan={true}
        onScan={(code) => {
          handleExecuteScan(code);
          setIsScannerModalOpen(false);
        }}
        recentScans={scannedResult ? [scannedResult.product.name] : []}
      />

      {/* Hidden Print Sheet: Formatted specifically for @media print */}
      <div id="barcode-print-sheet" className="hidden print:block print:w-full print:p-0">
        <style
          dangerouslySetInnerHTML={{
            __html: `
            @media print {
              body * { visibility: hidden; }
              #barcode-print-sheet, #barcode-print-sheet * { visibility: visible; }
              #barcode-print-sheet {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: white;
                color: black;
              }
              .sticker-item {
                page-break-inside: avoid;
                break-inside: avoid;
              }
            }
          `,
          }}
        />

        <div
          className={
            labelSize === "50x25" || labelSize === "38x25"
              ? "flex flex-col items-center gap-2"
              : labelSize === "A4_24"
              ? "grid grid-cols-3 gap-2"
              : "grid grid-cols-4 gap-2"
          }
        >
          {Array.from({ length: labelCount }).map((_, idx) => (
            <div
              key={idx}
              style={{
                width: labelSize === "50x25" ? "50mm" : labelSize === "38x25" ? "38mm" : "auto",
                minHeight: "25mm",
              }}
              className="sticker-item border border-black p-1 text-black flex flex-col justify-between font-sans text-[8px] bg-white"
            >
              {showStoreName && (
                <div className="text-center font-bold text-[8px] uppercase tracking-wider border-b border-black">
                  City Medical Store
                </div>
              )}
              <div className="font-bold truncate text-[9px]">{selectedProduct?.name}</div>
              <div className="flex items-center justify-center my-1">
                <RealBarcodeSvg value={barcodeValue} height={26} width={1.4} />
              </div>
              <div className="flex items-center justify-between font-bold text-[7px] border-t border-black pt-1">
                <span>
                  B:{batchNo} E:{expDate}
                </span>
                <span>MRP ₹{mrpVal}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
