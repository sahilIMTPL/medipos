"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Edit,
  SlidersHorizontal,
  X,
  AlertCircle,
  Lock,
  Unlock,
} from "lucide-react";
import { api, BatchItem } from "@/lib/api";
import { TableSkeleton, EmptyState } from "./common";
import { useStore } from "@/context/StoreContext";

export default function BatchesExpiryView() {
  const { currentStore } = useStore();
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState<"ALL" | "CRITICAL_30" | "NEAR_90" | "EXPIRED" | "GOOD">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Adjustment Modal
  const [adjustingBatch, setAdjustingBatch] = useState<BatchItem | null>(null);
  const [newQty, setNewQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState("Damaged / expired disposal");
  const [savingAdjust, setSavingAdjust] = useState(false);
  const [adjustError, setAdjustError] = useState("");

  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await api.getBatches({
        filter: activeTab !== "ALL" ? activeTab : undefined,
        q: searchQuery || undefined,
        storeId: currentStore?.id || undefined,
      });
      if (data.batches) {
        setBatches(data.batches);
      }
    } catch (err) {
      console.error("Failed to load batches", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, [activeTab, currentStore?.id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadBatches();
  };

  // Quarantine / Release action
  const handleToggleQuarantine = async (batch: BatchItem) => {
    const action = batch.status === "QUARANTINED" ? "release from quarantine" : "quarantine";
    if (!confirm(`Are you sure you want to ${action} batch "${batch.batchNumber}"?`)) {
      return;
    }

    try {
      await api.quarantineBatch(batch.id);
      await loadBatches();
    } catch (err: any) {
      alert(err.message || "Could not change batch quarantine status");
    }
  };

  // Adjust stock
  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingBatch) return;

    setSavingAdjust(true);
    setAdjustError("");

    try {
      await api.adjustBatchStock(adjustingBatch.id, {
        adjustedQty: Number(newQty),
        reason: adjustReason.trim(),
      });

      setAdjustingBatch(null);
      await loadBatches();
    } catch (err: any) {
      setAdjustError(err.message || "Failed to adjust stock");
    } finally {
      setSavingAdjust(false);
    }
  };

  // Counts summary
  const totalCount = batches.length;
  const expiredCount = batches.filter((b) => b.expiryCategory === "EXPIRED").length;
  const criticalCount = batches.filter((b) => b.expiryCategory === "CRITICAL").length;
  const warningCount = batches.filter((b) => b.expiryCategory === "WARNING").length;

  return (
    <div className="p-4 max-w-[1600px] mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Expiry Alerts &amp; Batches
            </h1>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700">
              {batches.length} batches
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitor medicine expiry dates and batch stock
          </p>
        </div>

        <button
          onClick={loadBatches}
          className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 shadow-2xs transition self-start sm:self-auto cursor-pointer"
          title="Refresh Batches"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("EXPIRED")}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            activeTab === "EXPIRED"
              ? "bg-rose-50 border-rose-300 ring-2 ring-rose-500"
              : "bg-white border-slate-200 hover:bg-slate-50 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Already Expired</span>
            <XCircle className="h-4 w-4" />
          </div>
          <div className="text-xl font-bold text-rose-600">{expiredCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("CRITICAL_30")}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            activeTab === "CRITICAL_30"
              ? "bg-amber-50 border-amber-300 ring-2 ring-amber-500"
              : "bg-white border-slate-200 hover:bg-slate-50 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Critical (&lt; 30 Days)</span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="text-xl font-bold text-amber-600">{criticalCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("NEAR_90")}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            activeTab === "NEAR_90"
              ? "bg-amber-50/50 border-amber-200 ring-2 ring-amber-400"
              : "bg-white border-slate-200 hover:bg-slate-50 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Near Expiry (&lt; 90 Days)</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="text-xl font-bold text-amber-800">{warningCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("GOOD")}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            activeTab === "GOOD"
              ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500"
              : "bg-white border-slate-200 hover:bg-slate-50 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Healthy Batches</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="text-xl font-bold text-emerald-600">
            {totalCount - (expiredCount + criticalCount + warningCount)}
          </div>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "ALL"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Batches
          </button>
          <button
            onClick={() => setActiveTab("CRITICAL_30")}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "CRITICAL_30"
                ? "bg-amber-500 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            &lt; 30 Days Alert
          </button>
          <button
            onClick={() => setActiveTab("NEAR_90")}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "NEAR_90"
                ? "bg-amber-600 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            &lt; 90 Days Warning
          </button>
          <button
            onClick={() => setActiveTab("EXPIRED")}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "EXPIRED"
                ? "bg-rose-600 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Expired
          </button>
          <button
            onClick={() => setActiveTab("GOOD")}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "GOOD"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Healthy (&gt; 90 Days)
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search medicine, batch, supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
          />
        </form>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs min-w-[1300px] whitespace-nowrap">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4 min-w-[130px]">Batch Number</th>
                <th className="py-3 px-4 min-w-[220px]">Medicine / Product</th>
                <th className="py-3 px-4 min-w-[130px]">Category</th>
                <th className="py-3 px-4 min-w-[120px]">Expiry Date</th>
                <th className="py-3 px-4 text-center min-w-[130px]">Remaining Days</th>
                <th className="py-3 px-4 text-right min-w-[120px]">Available Stock</th>
                <th className="py-3 px-4 text-right min-w-[110px]">MRP</th>
                <th className="py-3 px-4 min-w-[190px]">Distributor</th>
                <th className="py-3 px-4 text-center min-w-[120px]">Status</th>
                <th className="py-3 px-4 text-center min-w-[110px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton columns={10} rows={6} />
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8">
                    <EmptyState
                      icon={Calendar}
                      title="No Batches Found"
                      description="No medicine batches match the selected expiry filter."
                    />
                  </td>
                </tr>
              ) : (
                batches.map((batch) => {
                  const isExp = batch.expiryCategory === "EXPIRED";
                  const isCrit = batch.expiryCategory === "CRITICAL";
                  const isWarn = batch.expiryCategory === "WARNING";
                  const isQuarantined = batch.status === "QUARANTINED";

                  return (
                    <tr
                      key={batch.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isExp ? "bg-rose-50/30" : isQuarantined ? "bg-amber-50/20" : ""
                      }`}
                    >
                      {/* Batch Number */}
                      <td className="px-3 py-2 font-mono font-bold text-slate-900">
                        {batch.batchNumber}
                      </td>

                      {/* Medicine */}
                      <td className="px-3 py-2">
                        <div className="font-bold text-slate-900">{batch.productName}</div>
                        <div className="text-[11px] text-slate-500 font-normal">
                          {batch.genericName || batch.packDescription}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-3 py-2 text-slate-600">
                        <span className="inline-block px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">
                          {batch.categoryName}
                        </span>
                      </td>

                      {/* Expiry Date */}
                      <td className="px-3 py-2 font-semibold text-slate-900 text-[11px]">
                        {batch.expiryDate}
                      </td>

                      {/* Days Remaining Pill */}
                      <td className="px-3 py-2 text-center">
                        {isExp ? (
                          <span className="inline-block px-2 py-1 rounded bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[10px]">
                            Expired ({Math.abs(batch.daysRemaining)}d ago)
                          </span>
                        ) : isCrit ? (
                          <span className="inline-block px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
                            {batch.daysRemaining}d left
                          </span>
                        ) : isWarn ? (
                          <span className="inline-block px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                            {batch.daysRemaining}d left
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                            {batch.daysRemaining}d left
                          </span>
                        )}
                      </td>

                      {/* Stock Quantity */}
                      <td className="px-3 py-2 text-right">
                        <div className="font-bold text-slate-900">
                          {batch.availablePacks} {batch.saleUnit}s
                        </div>
                        <div className="text-[10px] text-slate-400">
                          ({batch.availableQty} {batch.baseUnit}s)
                        </div>
                      </td>

                      {/* Unit MRP */}
                      <td className="px-3 py-2 text-right font-medium text-slate-700">
                        ₹{batch.mrp.toFixed(2)}
                      </td>

                      {/* Supplier */}
                      <td className="px-3 py-2 text-slate-600 truncate max-w-xs text-[11px]">
                        {batch.supplierName}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2 text-center">
                        {isQuarantined ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-300">
                            <Lock className="h-3 w-3" /> Quarantined
                          </span>
                        ) : isExp ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-100 text-rose-800 font-bold text-[10px] border border-rose-300">
                            <XCircle className="h-3 w-3" /> Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setAdjustingBatch(batch);
                              setNewQty(batch.availableQty);
                              setAdjustReason(
                                isExp
                                  ? "Write-off expired batch stock"
                                  : "Physical stock audit correction"
                              );
                            }}
                            className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[11px] flex items-center gap-1 border border-indigo-200 transition shadow-xs cursor-pointer"
                            title="Directly adjust physical stock quantity for this batch"
                          >
                            <SlidersHorizontal className="h-3 w-3" />
                            Adjust Stock
                          </button>

                          <button
                            onClick={() => handleToggleQuarantine(batch)}
                            className={`p-1 rounded transition border ${
                              isQuarantined
                                ? "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
                                : "text-slate-400 hover:text-amber-600 hover:bg-amber-50 border-transparent"
                            }`}
                            title={
                              isQuarantined
                                ? "Release from quarantine"
                                : "Quarantine batch (prohibit POS billing)"
                            }
                          >
                            {isQuarantined ? (
                              <Unlock className="h-4 w-4" />
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-white text-slate-900 flex items-center justify-between border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Adjust Batch Stock</h3>
                <p className="text-xs text-slate-500">
                  {adjustingBatch.productName} ({adjustingBatch.batchNumber})
                </p>
              </div>
              <button
                onClick={() => setAdjustingBatch(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-5 space-y-4 text-xs">
              {adjustError && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-700">
                  {adjustError}
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
                <span className="text-slate-500">Current Recorded Quantity:</span>
                <span className="font-bold text-slate-900">
                  {adjustingBatch.availableQty} {adjustingBatch.baseUnit}s
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Corrected Stock Quantity ({adjustingBatch.baseUnit}s) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newQty}
                  onChange={(e) => setNewQty(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Set to 0 to write off expired/damaged batch
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Reason for Adjustment *
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Write-off expired batch stock">Write-off expired batch stock</option>
                  <option value="Damaged / broken container">Damaged / broken container</option>
                  <option value="Physical audit count correction">Physical audit count correction</option>
                  <option value="Returned to supplier">Returned to supplier claim</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustingBatch(null)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAdjust}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-lg shadow-sm shadow-indigo-950/20 transition cursor-pointer"
                >
                  {savingAdjust ? "Adjusting..." : "Save Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
