"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Printer, Barcode, Check, Copy } from "lucide-react";
import { triggerPrint } from "@/lib/print";
import JsBarcode from "jsbarcode";
import { ProductItem } from "@/lib/api";

interface BarcodeLabelsModalProps {
  product: ProductItem | null;
  onClose: () => void;
}

function RealBarcodeSvg({ value, height = 36 }: { value: string; height?: number }) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          width: 1.8,
          height: height,
          displayValue: true,
          fontSize: 10,
          font: "monospace",
          textMargin: 2,
          margin: 0,
        });
      } catch (e) {
        console.warn("JsBarcode error", e);
      }
    }
  }, [value, height]);

  return <svg ref={svgRef} className="max-w-[190px] w-full" />;
}

export default function BarcodeLabelsModal({ product, onClose }: BarcodeLabelsModalProps) {
  const [selectedBatchIndex, setSelectedBatchIndex] = useState(0);
  const [labelCount, setLabelCount] = useState(12);
  const [labelSize, setLabelSize] = useState<"50x25" | "38x25">("50x25");
  const [showStoreName, setShowStoreName] = useState(true);
  const [showExpiry, setShowExpiry] = useState(true);
  const [showBatch, setShowBatch] = useState(true);
  const [showMrp, setShowMrp] = useState(true);

  if (!product) return null;

  const currentBatch = product.batches && product.batches.length > 0
    ? product.batches[selectedBatchIndex] || product.batches[0]
    : null;

  const barcodeValue = product.barcode || `890${product.sku.replace(/\D/g, "").padEnd(9, "0")}`;
  const batchNo = currentBatch?.batchNumber || "BCH-2026";
  const expDate = currentBatch?.expiryDate || "12/2026";
  const mrpVal = (currentBatch?.mrp || product.mrp || 0).toFixed(2);

  const handlePrint = () => {
    triggerPrint("printable-area");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white text-slate-900 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Barcode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight text-slate-900">Barcode &amp; Price Labels</h2>
              <p className="text-xs text-slate-500">
                {product.name} • {product.packDescription}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Controls Column (5 cols) */}
          <div className="md:col-span-5 space-y-4 text-sm">
            {/* Batch Selector */}
            {product.batches && product.batches.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Select Batch
                </label>
                <select
                  value={selectedBatchIndex}
                  onChange={(e) => setSelectedBatchIndex(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 font-medium text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {product.batches.map((b, idx) => (
                    <option key={b.id || idx} value={idx}>
                      {b.batchNumber} (Exp: {b.expiryDate} • MRP ₹{b.mrp})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Label Size */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Label Dimension
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLabelSize("50x25")}
                  className={`px-3 py-2 border rounded-lg text-xs font-semibold text-center transition ${
                    labelSize === "50x25"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  50mm × 25mm (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => setLabelSize("38x25")}
                  className={`px-3 py-2 border rounded-lg text-xs font-semibold text-center transition ${
                    labelSize === "38x25"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  38mm × 25mm (Compact)
                </button>
              </div>
            </div>

            {/* Label Content Options */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Label Inclusions
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
                  <span>MRP (₹{mrpVal} Incl. Taxes)</span>
                </label>
              </div>
            </div>

            {/* Quantity to print */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Quantity of Labels
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={labelCount}
                  onChange={(e) => setLabelCount(Math.max(1, Number(e.target.value)))}
                  className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <span className="text-xs text-slate-500">Stickers to generate</span>
              </div>
            </div>

            {/* Barcode digits */}
            <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100 flex items-center justify-between text-xs">
              <span className="text-indigo-950 font-medium">Barcode / SKU:</span>
              <span className="font-mono font-bold text-indigo-900 bg-white px-2 py-1 rounded border border-indigo-200">
                {barcodeValue}
              </span>
            </div>
          </div>

          {/* Label Live Preview Column (7 cols) */}
          <div className="md:col-span-7 flex flex-col items-center justify-between bg-slate-100 p-6 rounded-xl border border-slate-200">
            <div className="w-full text-center mb-3">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
                Live Thermal Sticker Preview ({labelSize}mm)
              </span>
            </div>

            {/* Sticker Graphic Container */}
            <div id="printable-area" className="p-4 bg-white rounded-lg border-2 border-dashed border-slate-300 shadow-md flex items-center justify-center print:border-none print:shadow-none print:p-0">
              <div
                style={{
                  width: labelSize === "50x25" ? "240px" : "190px",
                  minHeight: "125px",
                }}
                className="bg-white border border-slate-900/80 p-2 rounded shadow-sm text-black flex flex-col justify-between font-sans select-none"
              >
                {/* Store Branding */}
                {showStoreName && (
                  <div className="text-[10px] font-bold tracking-tight text-center uppercase border-b border-black pb-1 leading-none">
                    City Medical Store
                  </div>
                )}

                {/* Medicine Title & Strength */}
                <div className="text-center mt-1">
                  <div className="font-extrabold text-[12px] leading-tight truncate">
                    {product.name}
                  </div>
                  <div className="text-[9px] text-slate-700 truncate">
                    {product.genericName || product.dosageForm} • {product.packDescription}
                  </div>
                </div>

                {/* Scannable Barcode SVG */}
                <div className="my-1 flex justify-center">
                  <RealBarcodeSvg value={barcodeValue} />
                </div>

                {/* Batch & Expiry & MRP */}
                <div className="flex items-center justify-between text-[9px] font-semibold pt-1 border-t border-black leading-none">
                  {showBatch && <span>B:{batchNo}</span>}
                  {showExpiry && <span>EXP:{expDate}</span>}
                  {showMrp && <span className="font-bold">MRP:₹{mrpVal}</span>}
                </div>
              </div>
            </div>

            {/* Sheet Summary */}
            <div className="w-full mt-4 text-center text-xs text-slate-500">
              Ready to print {labelCount} labels on standard thermal sticker roll or sheet printer.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm shadow-indigo-950/20 flex items-center gap-2 transition cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Print {labelCount} Labels
          </button>
        </div>
      </div>
    </div>
  );
}
