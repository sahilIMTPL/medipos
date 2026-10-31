"use client";

import React, { useState, useEffect } from "react";
import { api, ShiftSummary } from "@/lib/api";
import { useShift } from "@/context/ShiftContext";
import { useStore } from "@/context/StoreContext";
import {
  Lock,
  IndianRupee,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calculator,
} from "lucide-react";

export default function CloseShiftModal() {
  const { currentStore } = useStore();
  const {
    currentShift,
    isCloseShiftModalOpen,
    setIsCloseShiftModalOpen,
    refreshShift,
    setZReportModalShiftId,
  } = useShift();

  const [liveSummary, setLiveSummary] = useState<ShiftSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Denominations counter
  const [denominations, setDenominations] = useState<{ [key: string]: number }>({
    "500": 0,
    "200": 0,
    "100": 0,
    "50": 0,
    "20": 0,
    "10": 0,
    "coins": 0,
  });

  const [manualCountedCash, setManualCountedCash] = useState<number>(0);
  const [useDenominations, setUseDenominations] = useState<boolean>(true);
  const [closingNotes, setClosingNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch live summary when modal opens
  useEffect(() => {
    if (isCloseShiftModalOpen && currentShift?.shiftId) {
      setLoadingSummary(true);
      setError(null);
      api.getShiftSummary(currentShift.shiftId)
        .then((res) => {
          if (res.success && res.summary) {
            setLiveSummary(res.summary);
            setManualCountedCash(res.summary.expectedCash);
          }
        })
        .catch((err) => {
          console.error("Failed to load shift live summary:", err);
          setError("Failed to load live shift calculations.");
        })
        .finally(() => setLoadingSummary(false));
    }
  }, [isCloseShiftModalOpen, currentShift?.shiftId]);

  if (!isCloseShiftModalOpen || !currentShift) return null;

  // Calculate total from denominations
  const totalFromDenominations =
    (denominations["500"] || 0) * 500 +
    (denominations["200"] || 0) * 200 +
    (denominations["100"] || 0) * 100 +
    (denominations["50"] || 0) * 50 +
    (denominations["20"] || 0) * 20 +
    (denominations["10"] || 0) * 10 +
    (denominations["coins"] || 0);

  const effectiveCountedCash = useDenominations ? totalFromDenominations : manualCountedCash;
  const expectedCash = liveSummary ? liveSummary.expectedCash : currentShift.expectedCash;
  const variance = Number((effectiveCountedCash - expectedCash).toFixed(2));

  const handleDenominationChange = (key: string, count: number) => {
    setDenominations((prev) => ({
      ...prev,
      [key]: Math.max(0, count || 0),
    }));
  };

  const handleCloseShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.closeShift({
        shiftId: currentShift.shiftId,
        storeId: currentStore?.id,
        actualClosingCash: effectiveCountedCash,
        denominations: useDenominations ? denominations : undefined,
        closingNotes: closingNotes.trim() || undefined,
      });

      const closedId = currentShift.shiftId;
      await refreshShift();
      setIsCloseShiftModalOpen(false);
      // Trigger printable Z-Report modal
      setZReportModalShiftId(closedId);
    } catch (err: any) {
      setError(err.message || "Failed to close shift.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Close Register Shift #{currentShift.shiftNumber}</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                  Active
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Opened at {new Date(currentShift.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} by {currentShift.openedBy.fullName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCloseShiftModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Dual Balance Summary Cards (Cash Drawer & Bank Digital) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cash Drawer Card */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                  <span>💵 Cash Drawer Expected</span>
                </span>
                <span className="text-lg font-black text-emerald-700">
                  ₹{expectedCash.toFixed(2)}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-emerald-100">
                <div className="flex justify-between">
                  <span>Opening Cash Float:</span>
                  <span className="font-semibold text-slate-800">₹{(liveSummary?.openingCashFloat ?? currentShift.openingCashFloat).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>+ Cash Sales ({liveSummary?.invoiceCount || 0} bills):</span>
                  <span className="font-semibold text-emerald-700">+₹{(liveSummary?.totalCashSales || 0).toFixed(2)}</span>
                </div>
                {(liveSummary?.totalCashIn || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>+ Cash In (Float additions):</span>
                    <span className="font-semibold text-emerald-700">+₹{(liveSummary?.totalCashIn || 0).toFixed(2)}</span>
                  </div>
                )}
                {(liveSummary?.totalSupplierPaidCash || 0) > 0 && (
                  <div className="flex justify-between text-rose-700">
                    <span>- Vendor Paid (Cash):</span>
                    <span className="font-semibold">-₹{(liveSummary?.totalSupplierPaidCash || 0).toFixed(2)}</span>
                  </div>
                )}
                {(liveSummary?.totalCashOut || 0) > 0 && (
                  <div className="flex justify-between text-rose-700">
                    <span>- Petty Expenses (Cash Out):</span>
                    <span className="font-semibold">-₹{(liveSummary?.totalCashOut || 0).toFixed(2)}</span>
                  </div>
                )}
                {(liveSummary?.totalCashRefunds || 0) > 0 && (
                  <div className="flex justify-between text-rose-700">
                    <span>- Customer Refunds:</span>
                    <span className="font-semibold">-₹{(liveSummary?.totalCashRefunds || 0).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bank & Digital Card */}
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                  <span>💳 Bank & Digital Net</span>
                </span>
                <span className="text-lg font-black text-indigo-700">
                  ₹{((liveSummary?.expectedBank) ?? currentShift.expectedBank).toFixed(2)}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-indigo-100">
                <div className="flex justify-between">
                  <span>UPI Sales (PhonePe/GPay):</span>
                  <span className="font-semibold text-slate-800">₹{(liveSummary?.totalUpiSales || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Card POS Terminal:</span>
                  <span className="font-semibold text-slate-800">₹{(liveSummary?.totalCardSales || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Store Credit (Udhar):</span>
                  <span className="font-semibold text-amber-700">₹{(liveSummary?.totalCreditSales || 0).toFixed(2)}</span>
                </div>
                {(liveSummary?.totalSupplierPaidBank || 0) > 0 && (
                  <div className="flex justify-between text-rose-700">
                    <span>- Vendor Paid (Bank/UPI):</span>
                    <span className="font-semibold">-₹{(liveSummary?.totalSupplierPaidBank || 0).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cash Counting Section */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Physical Cash Drawer Count
                </h4>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setUseDenominations(true)}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    useDenominations
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  By Denominations
                </button>
                <button
                  type="button"
                  onClick={() => setUseDenominations(false)}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    !useDenominations
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  Total Direct
                </button>
              </div>
            </div>

            {useDenominations ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "₹500 Notes", key: "500", mult: 500 },
                  { label: "₹200 Notes", key: "200", mult: 200 },
                  { label: "₹100 Notes", key: "100", mult: 100 },
                  { label: "₹50 Notes", key: "50", mult: 50 },
                  { label: "₹20 Notes", key: "20", mult: 20 },
                  { label: "₹10 Notes", key: "10", mult: 10 },
                  { label: "Coins / Misc", key: "coins", mult: 1 },
                ].map((item) => (
                  <div key={item.key} className="bg-white p-2 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[11px] font-bold text-slate-600 block">{item.label}</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={denominations[item.key] || ""}
                      onChange={(e) => handleDenominationChange(item.key, Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-2 py-1 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400 font-medium block text-right">
                      = ₹{((denominations[item.key] || 0) * item.mult).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Total Counted Cash in Hand (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualCountedCash}
                  onChange={(e) => setManualCountedCash(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Reconciliation Comparison Card */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Total Counted Cash:</span>
                <span className="text-base font-black text-slate-900">
                  ₹{effectiveCountedCash.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Variance:</span>
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${
                    variance === 0
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : variance > 0
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-rose-100 text-rose-800 border border-rose-200"
                  }`}
                >
                  {variance === 0 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Balanced (₹0.00)</span>
                    </>
                  ) : variance > 0 ? (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      <span>Surplus (+₹{variance.toFixed(2)})</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span>Shortage (-₹{Math.abs(variance).toFixed(2)})</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Closing Remarks / Manager Memo (Optional)
            </label>
            <input
              type="text"
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              placeholder="e.g. Verified by Store Manager, drawer balanced"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsCloseShiftModalOpen(false)}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCloseShiftSubmit}
            disabled={submitting || loadingSummary}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <FileText className="w-4 h-4" />
            <span>{submitting ? "Closing Shift..." : "Close Shift & Print Z-Report"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
