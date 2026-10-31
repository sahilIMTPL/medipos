"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Banknote,
  Coins,
  Lock,
  LockOpen,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  User,
  Store,
  DollarSign,
  TrendingUp,
  Receipt,
  Printer,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { api, ShiftHistoryItem } from "@/lib/api";
import { useStore } from "@/context/StoreContext";
import { useShift } from "@/context/ShiftContext";

export default function ShiftsManagementView() {
  const { currentStore } = useStore();
  const {
    currentShift,
    isShiftOpen,
    isRealtimeConnected,
    isLoading: isShiftLoading,
    refreshShift,
    setIsOpenShiftModalOpen,
    setIsCloseShiftModalOpen,
    setIsCashMovementModalOpen,
    setZReportModalShiftId,
  } = useShift();

  const [history, setHistory] = useState<ShiftHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "CLOSED">("ALL");

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await api.getShiftHistory(currentStore?.id, 50);
      if (res.success && Array.isArray(res.shifts)) {
        setHistory(res.shifts);
      }
    } catch (err) {
      console.error("Failed to fetch shift history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [currentStore?.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Listen to shift updates
  useEffect(() => {
    const handleShiftUpdated = () => {
      refreshShift();
      loadHistory();
    };
    window.addEventListener("medipos_shift_updated", handleShiftUpdated);
    return () => window.removeEventListener("medipos_shift_updated", handleShiftUpdated);
  }, [refreshShift, loadHistory]);

  const filteredHistory = history.filter((s) => {
    if (statusFilter === "ALL") return true;
    return s.status === statusFilter;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Cash Register & Daily Shifts
            </h1>
            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-lg border border-indigo-200 flex items-center gap-1">
              <Store className="w-3 h-3" />
              <span>{currentStore?.name || "Store"}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track opening floats, real-time drawer balance, supplier payouts, and end-of-day reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              refreshShift();
              loadHistory();
            }}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition shadow-2xs cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {isShiftOpen && (
            <button
              type="button"
              onClick={() => setIsCashMovementModalOpen(true)}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl shadow-2xs transition flex items-center gap-2 cursor-pointer"
            >
              <Coins className="w-4 h-4 text-indigo-600" />
              <span>Cash In / Out</span>
            </button>
          )}

          {isShiftOpen && currentShift ? (
            <button
              type="button"
              onClick={() => setIsCloseShiftModalOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Close Shift #{currentShift.shiftNumber}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsOpenShiftModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <LockOpen className="w-4 h-4" />
              <span>Open New Shift</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Shift Banner / Overview Card */}
      {isShiftOpen && currentShift ? (
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-emerald-800/40 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                <Banknote className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black tracking-tight text-white">
                    Shift #{currentShift.shiftNumber} is In Progress
                  </h2>
                  <span className="px-2 py-1 bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Live Active {isRealtimeConnected ? "(WebSocket)" : ""}</span>
                  </span>
                </div>
                <p className="text-xs text-emerald-200/80 mt-1 flex items-center gap-2">
                  <span>Opened at {new Date(currentShift.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  <span>•</span>
                  <span>Cashier: {currentShift.openedBy.fullName}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZReportModalShiftId(currentShift.shiftId)}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/10 transition flex items-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                <span>Interim Z-Report</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCloseShiftModalOpen(true)}
                className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Lock className="w-4 h-4" />
                <span>Count & Close Shift</span>
              </button>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <span className="text-[11px] font-medium text-emerald-200 block">Expected Cash Drawer</span>
              <p className="text-xl sm:text-2xl font-black text-white mt-1">
                ₹{currentShift.expectedCash.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-emerald-300/70 block mt-1">
                Float ₹{currentShift.openingCashFloat.toFixed(2)} + Net Cash Flow
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <span className="text-[11px] font-medium text-emerald-200 block">Shift Net Cash Sales</span>
              <p className="text-xl sm:text-2xl font-black text-emerald-300 mt-1">
                ₹{currentShift.totalCashSales.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-emerald-300/70 block mt-1">
                From {currentShift.invoiceCount} invoices
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <span className="text-[11px] font-medium text-emerald-200 block">Digital Sales (UPI + Card)</span>
              <p className="text-xl sm:text-2xl font-black text-indigo-300 mt-1">
                ₹{(currentShift.totalUpiSales + currentShift.totalCardSales).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-emerald-300/70 block mt-1">
                UPI: ₹{currentShift.totalUpiSales.toFixed(2)} | Card: ₹{currentShift.totalCardSales.toFixed(2)}
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <span className="text-[11px] font-medium text-emerald-200 block">Gross Revenue</span>
              <p className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
                ₹{currentShift.totalSalesRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-emerald-300/70 block mt-1">
                Total collection this shift
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-6 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Register Shift is Currently Closed</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Start your shift by recording the opening physical cash float in the drawer. All POS transactions will automatically link to the active shift.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpenShiftModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-2 cursor-pointer"
          >
            <LockOpen className="w-4 h-4" />
            <span>Open Register Shift Now</span>
          </button>
        </div>
      )}

      {/* Historical Shifts Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Shift Reconciliation Records</h3>
            <p className="text-xs text-slate-500">
              Audit log of previous daily shifts, opening floats, closing counts, and discrepancy checks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  statusFilter === "ALL"
                    ? "bg-white text-indigo-700 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({history.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("CLOSED")}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  statusFilter === "CLOSED"
                    ? "bg-white text-indigo-700 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Closed
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("OPEN")}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  statusFilter === "OPEN"
                    ? "bg-white text-indigo-700 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Open
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Shift #</th>
                <th className="py-3 px-4">Opened / Closed</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4 text-right">Opening Float</th>
                <th className="py-3 px-4 text-right">Cash Sales</th>
                <th className="py-3 px-4 text-right">Expected Drawer</th>
                <th className="py-3 px-4 text-right">Actual Counted</th>
                <th className="py-3 px-4 text-center">Variance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loadingHistory ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Loading shift records...</span>
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No shift records found</p>
                    <p className="text-[11px] text-slate-400 mt-1">Open your first register shift above to begin tracking.</p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((s) => {
                  const isClosed = s.status === "CLOSED";
                  const variance = s.cashVariance || 0;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        Shift #{s.shiftNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-slate-800">
                            {new Date(s.openedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {new Date(s.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {s.closedAt && ` - ${new Date(s.closedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">{s.openedBy}</p>
                        {s.closedBy && s.closedBy !== s.openedBy && (
                          <p className="text-[10px] text-slate-400">Closed by: {s.closedBy}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700">
                        ₹{s.openingCashFloat.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                        +₹{s.totalCashSales.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        ₹{s.expectedClosingCash.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {isClosed ? `₹${s.actualClosingCash.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {!isClosed ? (
                          <span className="text-[11px] text-slate-400 font-medium">—</span>
                        ) : variance === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Balanced</span>
                          </span>
                        ) : variance > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 font-bold text-[10px] rounded-full border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            <span>+₹{variance.toFixed(2)}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 text-rose-700 font-bold text-[10px] rounded-full border border-rose-200">
                            <AlertCircle className="w-3 h-3" />
                            <span>-₹{Math.abs(variance).toFixed(2)}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {s.status === "OPEN" ? (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-800 font-black text-[10px] rounded-full uppercase">
                            Open
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 font-bold text-[10px] rounded-full uppercase">
                            Closed
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setZReportModalShiftId(s.id)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Z-Report</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
