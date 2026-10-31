"use client";

import React, { useState } from "react";
import { api, CashMovementType } from "@/lib/api";
import { useShift } from "@/context/ShiftContext";
import { useStore } from "@/context/StoreContext";
import { ArrowDownRight, ArrowUpRight, Landmark, Loader2, X, AlertCircle } from "lucide-react";

export default function CashMovementModal() {
  const { currentStore } = useStore();
  const {
    currentShift,
    isCashMovementModalOpen,
    setIsCashMovementModalOpen,
    refreshShift,
  } = useShift();

  const [type, setType] = useState<CashMovementType>("CASH_OUT");
  const [amount, setAmount] = useState<number>(100);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isCashMovementModalOpen || !currentShift) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }
    if (!reason.trim()) {
      setError("Please specify a reason for this cash movement.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.recordCashMovement({
        shiftId: currentShift.shiftId,
        storeId: currentStore?.id,
        type,
        amount: Number(amount),
        reason: reason.trim(),
      });

      await refreshShift();
      setIsCashMovementModalOpen(false);
      setReason("");
      setAmount(100);
    } catch (err: any) {
      setError(err.message || "Failed to record cash movement.");
    } finally {
      setSubmitting(false);
    }
  };

  const quickReasons = {
    CASH_OUT: ["Tea / Staff Refreshment", "Cleaning Supplies", "Courier / Delivery Boy", "Urgent Local Purchase"],
    CASH_IN: ["Added Change Float", "Loan from Owner", "Drawer Top-up"],
    BANK_DROP: ["Mid-day Bank Deposit Drop", "Transferred to Vault", "Cash Pickup"],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Cash Drawer Movement</h3>
            <p className="text-xs text-slate-500">
              Shift #{currentShift.shiftNumber} • Current Drawer: ₹{currentShift.expectedCash.toFixed(2)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCashMovementModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Movement Type Radio Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Movement Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType("CASH_OUT")}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                  type === "CASH_OUT"
                    ? "bg-rose-50 border-rose-400 text-rose-800 font-bold shadow-2xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                <span className="text-xs">Cash Out</span>
                <span className="text-[10px] text-slate-400">Petty Expense</span>
              </button>

              <button
                type="button"
                onClick={() => setType("CASH_IN")}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                  type === "CASH_IN"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-800 font-bold shadow-2xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                <span className="text-xs">Cash In</span>
                <span className="text-[10px] text-slate-400">Add Float</span>
              </button>

              <button
                type="button"
                onClick={() => setType("BANK_DROP")}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                  type === "BANK_DROP"
                    ? "bg-indigo-50 border-indigo-400 text-indigo-800 font-bold shadow-2xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Landmark className="w-4 h-4 text-indigo-600" />
                <span className="text-xs">Bank Drop</span>
                <span className="text-[10px] text-slate-400">To Bank/Safe</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="100"
                className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reason / Memo
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Courier charges or staff snacks"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Quick Reasons Chips */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">Quick Select Reason:</span>
            <div className="flex flex-wrap gap-2">
              {quickReasons[type].map((qr) => (
                <button
                  key={qr}
                  type="button"
                  onClick={() => setReason(qr)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition cursor-pointer"
                >
                  {qr}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCashMovementModalOpen(false)}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{submitting ? "Saving..." : "Confirm Movement"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
