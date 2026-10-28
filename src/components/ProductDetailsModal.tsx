"use client";

import React from "react";
import {
  X,
  Pill,
  Calendar,
  AlertTriangle,
  Barcode,
  Edit,
  PackageCheck,
  Clock,
} from "lucide-react";
import { ProductItem } from "@/lib/api";

interface ProductDetailsModalProps {
  product: ProductItem | null;
  onClose: () => void;
  onEdit: (product: ProductItem) => void;
  onPrintBarcode: (product: ProductItem) => void;
}

export default function ProductDetailsModal({
  product,
  onClose,
  onEdit,
  onPrintBarcode,
}: ProductDetailsModalProps) {
  if (!product) return null;

  const totalPacks = product.totalPacks || 0;
  const isOutOfStock = totalPacks <= 0;
  const isLowStock = totalPacks > 0 && totalPacks <= product.reorderLevel;

  const activeBatches = product.batches || [];

  const getDaysToExpiry = (expiryStr: string) => {
    const today = new Date();
    const exp = new Date(expiryStr);
    const diffTime = exp.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg text-slate-900 leading-tight">
                  {product.name}
                </h2>
                {product.isPrescriptionRequired && (
                  <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-1 rounded border border-rose-200">
                    Rx
                  </span>
                )}
                {product.isActive ? (
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-1 rounded border border-emerald-200">
                    Active
                  </span>
                ) : (
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-semibold px-2 py-1 rounded border border-slate-200">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {product.categoryName || "General"} • {product.dosageForm || "Tablet"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Total Stock</span>
              <div className="text-xl font-bold text-slate-900">
                {product.totalPacks} {product.saleUnit}s
              </div>
              <div className="text-xs mt-1">
                {isOutOfStock ? (
                  <span className="text-rose-600 font-semibold">Out of Stock</span>
                ) : isLowStock ? (
                  <span className="text-amber-600 font-semibold">Low Stock Alert</span>
                ) : (
                  <span className="text-emerald-600 font-semibold">In Stock</span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Selling Price (MRP)</span>
              <div className="text-xl font-bold text-slate-900">
                ₹{product.mrp.toFixed(2)}
              </div>
              <div className="text-xs text-slate-400 mt-1">per {product.packDescription || "pack"}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Cost Price</span>
              <div className="text-xl font-bold text-slate-900">
                ₹{product.defaultPurchasePrice.toFixed(2)}
              </div>
              <div className="text-xs text-slate-400 mt-1">Purchase rate</div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-xs text-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-slate-400 block font-medium">Pack Size</span>
              <span className="font-semibold text-slate-900">{product.packDescription || "1 Pack"}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Barcode</span>
              <span className="font-semibold text-slate-900 font-mono">{product.barcode || "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Type</span>
              <span className="font-semibold text-slate-900">{product.dosageForm || "Tablet"}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Low Stock Alert</span>
              <span className="font-semibold text-slate-900">Below {product.reorderLevel} units</span>
            </div>
          </div>

          {/* Batches Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm">Batches</h3>
              <span className="text-xs text-slate-500">
                {activeBatches.length} {activeBatches.length === 1 ? "batch" : "batches"}
              </span>
            </div>

            {activeBatches.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200/80 text-slate-400 text-xs">
                No active batches recorded for this medicine
              </div>
            ) : (
              <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left text-xs min-w-[500px] whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200/80 font-semibold">
                      <tr>
                        <th className="px-4 py-2 min-w-[120px]">Batch</th>
                        <th className="px-4 py-2 min-w-[120px]">Expiry Date</th>
                        <th className="px-4 py-2 text-right min-w-[90px]">Stock</th>
                        <th className="px-4 py-2 text-right min-w-[90px]">Price</th>
                        <th className="px-4 py-2 text-center min-w-[100px]">Status</th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {activeBatches.map((b) => {
                      const days = getDaysToExpiry(b.expiryDate);
                      const isExpired = days <= 0;
                      const isNearExpiry = days > 0 && days <= 90;

                      return (
                        <tr key={b.id} className="hover:bg-slate-50/60 transition">
                          <td className="px-4 py-2 font-semibold text-slate-900">
                            {b.batchNumber}
                          </td>
                          <td className="px-4 py-2 text-slate-600">
                            {b.expiryDate}
                          </td>
                          <td className="px-4 py-2 text-right font-bold text-slate-900">
                            {b.availableQty}
                          </td>
                          <td className="px-4 py-2 text-right text-slate-800">
                            ₹{b.mrp.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {isExpired ? (
                              <span className="inline-block px-2 py-1 rounded bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                                Expired
                              </span>
                            ) : isNearExpiry ? (
                              <span className="inline-block px-2 py-1 rounded bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                                {days} days left
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200">
                                Valid
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPrintBarcode(product)}
              className="px-3 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs flex items-center gap-2 transition cursor-pointer"
            >
              <Barcode className="h-4 w-4" />
              <span>Barcode</span>
            </button>
            <button
              type="button"
              onClick={() => onEdit(product)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-indigo-600/20 flex items-center gap-2 transition cursor-pointer"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
