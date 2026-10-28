"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Pill,
  Sparkles,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  ShoppingCart,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  Search,
} from "lucide-react";
import { api, ProductItem } from "@/lib/api";

interface GenericSubstituteModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProduct: ProductItem | null;
  onSelectSubstitute: (substituteProduct: any) => void;
}

export default function GenericSubstituteModal({
  isOpen,
  onClose,
  targetProduct,
  onSelectSubstitute,
}: GenericSubstituteModalProps) {
  const [loading, setLoading] = useState(false);
  const [substitutes, setSubstitutes] = useState<any[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen && targetProduct?.id) {
      setLoading(true);
      setErrorMsg("");
      setSearchFilter("");
      api.getSubstitutes(targetProduct.id)
        .then((res) => {
          if (res.success && res.substitutes) {
            setSubstitutes(res.substitutes);
            if (res.substitutes.length === 0 && res.message) {
              setErrorMsg(res.message);
            }
          } else {
            setErrorMsg(res.message || "No substitutes found");
          }
        })
        .catch((err) => {
          console.error("Failed to load substitutes:", err);
          setErrorMsg(err.message || "Failed to search substitutes");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setSubstitutes([]);
    }
  }, [isOpen, targetProduct]);

  if (!isOpen || !targetProduct) return null;

  const filteredSubs = substitutes.filter((s) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.brandName && s.brandName.toLowerCase().includes(q)) ||
      (s.manufacturer && s.manufacturer.toLowerCase().includes(q))
    );
  });

  const targetMrp = Number(targetProduct.mrp || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 flex items-start justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center ring-1 ring-white/30">
              <Pill className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Generic Salt Substitute Finder</h2>
                <span className="bg-emerald-500/40 text-emerald-100 text-[10px] font-black uppercase px-2 py-1 rounded-full border border-emerald-300/30">
                  Jan Aushadhi / FDA Formula
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-1">
                Matches identical active salt & strength for seamless brand substitution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            aria-label="Close Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Target Medicine Reference Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                Prescribed / Target Medicine:
              </span>
              <span className="font-extrabold text-slate-900 text-sm">{targetProduct.name}</span>
              {targetProduct.isPrescriptionRequired && (
                <span className="bg-rose-100 text-rose-700 font-black text-[9px] px-2 py-1 rounded border border-rose-200">
                  Rx
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                Salt: {targetProduct.genericName || "Unspecified Salt"}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 font-medium">{targetProduct.manufacturer || "Generic"}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Target MRP</span>
            <span className="text-base font-black text-slate-800">₹{targetMrp.toFixed(2)}</span>
            <div className="mt-1">
              {targetProduct.totalBaseStock <= 0 ? (
                <span className="inline-block text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-200">
                  Out of Stock
                </span>
              ) : (
                <span className="inline-block text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                  {targetProduct.totalPacks} {targetProduct.saleUnit}s in Stock
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Filter Input */}
        {substitutes.length > 3 && (
          <div className="px-5 pt-3 pb-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter substitutes by brand or manufacturer..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 outline-none transition"
              />
            </div>
          </div>
        )}

        {/* Substitutes List Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent" />
              <p className="text-xs font-semibold text-slate-600">
                Scanning pharmacy database for in-stock generic salt equivalents...
              </p>
            </div>
          ) : errorMsg && substitutes.length === 0 ? (
            <div className="py-12 text-center px-6">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-200">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">No Generic Substitutes Found</h3>
              <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto leading-relaxed">
                {errorMsg || `No active medicines in stock matching the composition "${targetProduct.genericName}".`}
              </p>
              <div className="mt-4 p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 inline-block border border-slate-200 text-left">
                <span className="font-bold text-slate-700 block mb-1">Pharmacist Recommendation:</span>
                • Verify the active salt composition in Products Master.<br />
                • Check therapeutic drug category for alternative therapeutic formulations.<br />
                • Inquire with suppliers for stock replenishment of this salt.
              </div>
            </div>
          ) : filteredSubs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="font-medium text-xs">No substitutes match your search query &quot;{searchFilter}&quot;.</p>
            </div>
          ) : (
            filteredSubs.map((sub) => {
              const subMrp = Number(sub.mrp || 0);
              const savings = targetMrp - subMrp;
              const savingsPercent = targetMrp > 0 ? Math.round((savings / targetMrp) * 100) : 0;
              const isInStock = sub.totalBaseStock > 0 || sub.inStock;
              const earliestBatch = sub.batches && sub.batches.length > 0 ? sub.batches[0] : null;

              return (
                <div
                  key={sub.id}
                  className={`border rounded-2xl p-4 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isInStock
                      ? "bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md"
                      : "bg-slate-50/60 border-slate-200 opacity-60"
                  }`}
                >
                  {/* Left: Medicine details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-sm hover:text-emerald-700 transition">
                        {sub.name}
                      </span>
                      {sub.brandName && sub.brandName !== sub.name && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          ({sub.brandName})
                        </span>
                      )}
                      {isInStock && (
                        <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>In Stock</span>
                        </span>
                      )}
                      {savings > 0 && (
                        <span className="bg-teal-50 text-teal-800 font-black text-[10px] px-2 py-1 rounded-full border border-teal-200 flex items-center gap-1">
                          <TrendingDown className="h-3 w-3" />
                          <span>Save ₹{savings.toFixed(2)} ({savingsPercent}%)</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                      <span className="text-slate-700 font-medium">{sub.genericName}</span>
                      <span>•</span>
                      <span>{sub.dosageForm || "Tablet"}</span>
                      <span>•</span>
                      <span className="text-slate-400">{sub.packDescription || "Standard"}</span>
                    </p>

                    <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-slate-400" />
                        <span className="truncate max-w-[150px]">{sub.manufacturer || "Generic Pharma"}</span>
                      </span>

                      {earliestBatch && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>Exp: {earliestBatch.expiryDate}</span>
                        </span>
                      )}

                      <span className="flex items-center gap-1 text-indigo-700 font-bold">
                        <Layers className="h-3 w-3" />
                        <span>{sub.totalPacks} {sub.saleUnit}s available</span>
                      </span>
                    </div>
                  </div>

                  {/* Right: Pricing & Add Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-base font-black text-slate-900">
                        ₹{subMrp.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        per {sub.saleUnit || "Strip"}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!isInStock}
                      onClick={() => {
                        onSelectSubstitute(sub);
                        onClose();
                      }}
                      className={`px-4 py-2 font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-xs cursor-pointer ${
                        isInStock
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>Select Substitute</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>DPCO & Pharmacy Council of India salt equivalence guidelines verified</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
