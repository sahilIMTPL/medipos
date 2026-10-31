"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { useShift } from "@/context/ShiftContext";
import { useStore } from "@/context/StoreContext";
import { DoorOpen, IndianRupee, Loader2, X, AlertCircle } from "lucide-react";

export default function OpenShiftModal() {
  const { currentStore } = useStore();
  const { isOpenShiftModalOpen, setIsOpenShiftModalOpen, refreshShift } = useShift();

  const [openingFloat, setOpeningFloat] = useState<number>(2000);
  const [openingNotes, setOpeningNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpenShiftModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (openingFloat < 0) {
      setError("Opening cash float cannot be negative.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.openShift({
        storeId: currentStore?.id,
        openingCashFloat: Number(openingFloat),
        openingNotes: openingNotes.trim() || undefined,
      });

      await refreshShift();
      setIsOpenShiftModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to open shift.");
    } finally {
      setLoading(false);
    }
  };

  const quickFloats = [1000, 2000, 3000, 5000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Open Register Shift</h3>
              <p className="text-xs text-slate-500">
                {currentStore?.name || "Medical Store"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpenShiftModalOpen(false)}
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Opening Cash Float in Drawer (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={openingFloat}
                onChange={(e) => setOpeningFloat(Number(e.target.value))}
                placeholder="2000"
                className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Physical change cash available in the drawer before starting sales.
            </p>
          </div>

          {/* Quick Select Buttons */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">Quick Select Float:</span>
            <div className="grid grid-cols-4 gap-2">
              {quickFloats.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setOpeningFloat(amt)}
                  className={`py-1 text-xs font-bold rounded-lg border transition ${
                    openingFloat === amt
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Opening Notes (Optional)
            </label>
            <input
              type="text"
              value={openingNotes}
              onChange={(e) => setOpeningNotes(e.target.value)}
              placeholder="e.g. Morning Shift Float verified by Cashier"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsOpenShiftModalOpen(false)}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? "Opening Shift..." : "Start Shift & Open Drawer"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
