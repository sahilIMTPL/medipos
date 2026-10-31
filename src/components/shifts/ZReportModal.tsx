"use client";

import React, { useState, useEffect } from "react";
import { api, ZReportData } from "@/lib/api";
import { useShift } from "@/context/ShiftContext";
import { Printer, X, Loader2, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";

export default function ZReportModal() {
  const { zReportModalShiftId, setZReportModalShiftId } = useShift();
  const [report, setReport] = useState<ZReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (zReportModalShiftId) {
      setLoading(true);
      setError(null);
      api.getShiftZReport(zReportModalShiftId)
        .then((res) => {
          if (res.success && res.zReport) {
            setReport(res.zReport);
          }
        })
        .catch((err) => {
          setError(err.message || "Failed to generate Z-Report.");
        })
        .finally(() => setLoading(false));
    }
  }, [zReportModalShiftId]);

  if (!zReportModalShiftId) return null;

  const handlePrint = () => {
    window.print();
  };

  const variance = report ? Number(report.summary.cashVariance || 0) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50 flex-shrink-0 no-print">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span>Shift End-of-Day Z-Report</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={loading || !report}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={() => setZReportModalShiftId(null)}
              className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Container */}
        <div className="p-6 overflow-y-auto bg-slate-50 flex justify-center">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">Generating official Z-Report...</span>
            </div>
          ) : error || !report ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs text-center">
              {error || "Could not load report."}
            </div>
          ) : (
            /* 80mm ESC/POS Thermal Receipt Paper Simulation */
            <div
              id="printable-z-report"
              className="w-full max-w-[340px] bg-white p-5 border border-slate-200 shadow-sm rounded-lg text-slate-800 text-xs font-mono space-y-3 leading-tight"
            >
              {/* Store Brand Header */}
              <div className="text-center space-y-1 pb-2 border-b border-dashed border-slate-300">
                <h2 className="font-bold text-sm tracking-tight text-slate-900 uppercase">
                  {report.store.name}
                </h2>
                <p className="text-[10px] text-slate-500">{report.store.address}, {report.store.city}</p>
                {report.store.phone && <p className="text-[10px] text-slate-500">Ph: {report.store.phone}</p>}
                {report.store.gstin && <p className="text-[10px] text-slate-500">GSTIN: {report.store.gstin}</p>}
                {report.store.drugLicenseNo && <p className="text-[10px] text-slate-500">DL: {report.store.drugLicenseNo}</p>}
                <div className="pt-1">
                  <span className="inline-block px-2 py-1 bg-slate-100 rounded text-[11px] font-bold text-slate-900 border border-slate-200">
                    REGISTER SHIFT #{report.shiftNumber} (Z-REPORT)
                  </span>
                </div>
              </div>

              {/* Shift Timing & Staff */}
              <div className="text-[11px] space-y-1 pb-2 border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Opened:</span>
                  <span className="font-semibold">{new Date(report.openedAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</span>
                </div>
                {report.closedAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Closed:</span>
                    <span className="font-semibold">{new Date(report.closedAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Cashier Opened:</span>
                  <span className="font-semibold">{report.cashierOpened}</span>
                </div>
                {report.cashierClosed && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cashier Closed:</span>
                    <span className="font-semibold">{report.cashierClosed}</span>
                  </div>
                )}
              </div>

              {/* Sales & Tender Breakdown */}
              <div className="space-y-1 pb-2 border-b border-dashed border-slate-300">
                <div className="font-bold text-[11px] uppercase tracking-wider text-slate-900 pb-1">
                  1. SALES BREAKDOWN
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Total Invoices Count:</span>
                  <span className="font-bold">{report.summary.invoiceCount}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Gross Sales Volume:</span>
                  <span className="font-bold">₹{report.summary.totalSalesRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>• Cash Sales (Net):</span>
                  <span className="font-bold">₹{report.summary.totalCashSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>• UPI Sales (QR):</span>
                  <span className="font-bold">₹{report.summary.totalUpiSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>• Card POS Sales:</span>
                  <span className="font-bold">₹{report.summary.totalCardSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>• Store Credit (Udhar):</span>
                  <span className="font-bold">₹{report.summary.totalCreditSales.toFixed(2)}</span>
                </div>
              </div>

              {/* Cash Drawer Reconciliation */}
              <div className="space-y-1 pb-2 border-b border-dashed border-slate-300">
                <div className="font-bold text-[11px] uppercase tracking-wider text-slate-900 pb-1">
                  2. CASH DRAWER AUDIT
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Opening Cash Float:</span>
                  <span className="font-semibold">₹{report.summary.openingCashFloat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>+ Cash Sales:</span>
                  <span className="font-semibold text-emerald-700">+₹{report.summary.totalCashSales.toFixed(2)}</span>
                </div>
                {report.summary.totalCashIn > 0 && (
                  <div className="flex justify-between text-[11px]">
                    <span>+ Cash In (Float Added):</span>
                    <span className="font-semibold text-emerald-700">+₹{report.summary.totalCashIn.toFixed(2)}</span>
                  </div>
                )}
                {report.summary.totalSupplierPaidCash > 0 && (
                  <div className="flex justify-between text-[11px] text-rose-700">
                    <span>- Vendor Paid (Cash):</span>
                    <span className="font-semibold">-₹{report.summary.totalSupplierPaidCash.toFixed(2)}</span>
                  </div>
                )}
                {report.summary.totalCashOut > 0 && (
                  <div className="flex justify-between text-[11px] text-rose-700">
                    <span>- Petty Expenses (Cash Out):</span>
                    <span className="font-semibold">-₹{report.summary.totalCashOut.toFixed(2)}</span>
                  </div>
                )}
                {report.summary.totalCashRefunds > 0 && (
                  <div className="flex justify-between text-[11px] text-rose-700">
                    <span>- Sales Refunds:</span>
                    <span className="font-semibold">-₹{report.summary.totalCashRefunds.toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-1 border-t border-slate-200 flex justify-between font-bold text-xs text-slate-900">
                  <span>Expected Drawer Cash:</span>
                  <span>₹{report.summary.expectedCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-xs text-slate-900">
                  <span>Actual Counted Cash:</span>
                  <span>₹{(report.summary.actualClosingCash ?? report.summary.expectedCash).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-xs pt-1">
                  <span>Cash Variance:</span>
                  <span
                    className={
                      variance === 0
                        ? "text-emerald-700"
                        : variance > 0
                        ? "text-amber-700"
                        : "text-rose-700"
                    }
                  >
                    {variance === 0
                      ? "₹0.00 (EXACT)"
                      : variance > 0
                      ? `+₹${variance.toFixed(2)} (SURPLUS)`
                      : `-₹${Math.abs(variance).toFixed(2)} (SHORTAGE)`}
                  </span>
                </div>
              </div>

              {/* Bank & Digital Reconciliation */}
              <div className="space-y-1 pb-2 border-b border-dashed border-slate-300">
                <div className="font-bold text-[11px] uppercase tracking-wider text-slate-900 pb-1">
                  3. BANK & DIGITAL RECONCILIATION
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Expected Bank/UPI Inflow:</span>
                  <span className="font-bold text-indigo-700">₹{report.summary.expectedBank.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Verify against UPI QR merchant statement and POS Card settlement slip.
                </p>
              </div>

              {/* Denominations table if available */}
              {report.denominations && Object.keys(report.denominations).length > 0 && (
                <div className="space-y-1 pb-2 border-b border-dashed border-slate-300">
                  <div className="font-bold text-[10px] uppercase text-slate-700">
                    DENOMINATION AUDIT
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    {Object.entries(report.denominations)
                      .filter(([_, count]) => Number(count) > 0)
                      .map(([key, count]) => (
                        <div key={key} className="flex justify-between">
                          <span>{key === "coins" ? "Coins:" : `₹${key} x ${count}:`}</span>
                          <span className="font-semibold">
                            ₹{(key === "coins" ? Number(count) : Number(key) * Number(count)).toFixed(0)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Signatures */}
              <div className="pt-4 text-center space-y-6">
                <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-500">
                  <div>
                    <div className="border-b border-slate-300 h-8" />
                    <span className="block pt-1">Cashier Signature</span>
                  </div>
                  <div>
                    <div className="border-b border-slate-300 h-8" />
                    <span className="block pt-1">Manager Signature</span>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400">
                  Generated by MediPOS Cloud Enterprise • End of Shift
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
