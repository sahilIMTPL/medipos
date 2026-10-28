"use client";

import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Printer,
  X,
  FileText,
  User,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
} from "lucide-react";
import {
  api,
  SalesReturnListItem,
  EligibleReturnInvoice,
  SalesReturnPrintDetail,
} from "@/lib/api";
import { triggerPrint } from "@/lib/print";

export default function SalesReturnsView() {
  const [returns, setReturns] = useState<SalesReturnListItem[]>([]);
  const [totalRefunded, setTotalRefunded] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Process Return Modal State
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [invoiceLookupQuery, setInvoiceLookupQuery] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [eligibleInvoice, setEligibleInvoice] = useState<EligibleReturnInvoice | null>(null);

  // Return Form State
  const [selectedItems, setSelectedItems] = useState<{
    [salesItemId: string]: {
      returnQty: number;
      isRestocked: boolean;
      reason: string;
    };
  }>({});
  const [refundMethod, setRefundMethod] = useState("CASH");
  const [generalReason, setGeneralReason] = useState("Customer requested return");
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Print Slip Modal State
  const [printDetail, setPrintDetail] = useState<SalesReturnPrintDetail | null>(null);
  const [printFormat, setPrintFormat] = useState<"80mm" | "A4">("80mm");
  const [loadingSlip, setLoadingSlip] = useState(false);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const data = await api.getSalesReturns({
        q: searchQuery || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (data.success) {
        setReturns(data.returns);
        setTotalRefunded(data.totalRefunded);
      }
    } catch (err) {
      console.error("Failed to load sales returns", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, [startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadReturns();
  };

  // Lookup invoice for return
  const handleLookupInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceLookupQuery.trim()) return;

    setLookingUp(true);
    setLookupError("");
    setEligibleInvoice(null);
    setSelectedItems({});

    try {
      const res = await api.getSalesReturnEligibleInvoice(invoiceLookupQuery);
      if (res.success && res.invoice) {
        setEligibleInvoice(res.invoice);
        // Pre-fill selection
        const initialMap: any = {};
        for (const it of res.invoice.items) {
          if (it.canReturn) {
            initialMap[it.salesItemId] = {
              returnQty: 0,
              isRestocked: true,
              reason: "Doctor changed medication",
            };
          }
        }
        setSelectedItems(initialMap);
      }
    } catch (err: any) {
      setLookupError(err.message || "Failed to find invoice");
    } finally {
      setLookingUp(false);
    }
  };

  // Calculate Total Refund in Process Modal
  const calculateTotalRefund = () => {
    if (!eligibleInvoice) return 0;
    let total = 0;
    for (const it of eligibleInvoice.items) {
      const selected = selectedItems[it.salesItemId];
      if (selected && selected.returnQty > 0) {
        total += selected.returnQty * it.ratePerUnit;
      }
    }
    return Number(total.toFixed(2));
  };

  // Submit Sales Return
  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eligibleInvoice) return;

    const itemsToSubmit = eligibleInvoice.items
      .filter((it) => selectedItems[it.salesItemId] && selectedItems[it.salesItemId].returnQty > 0)
      .map((it) => {
        const sel = selectedItems[it.salesItemId];
        const refundAmt = Number((sel.returnQty * it.ratePerUnit).toFixed(2));
        return {
          salesItemId: it.salesItemId,
          batchId: it.batchId,
          returnQty: sel.returnQty,
          refundAmount: refundAmt,
          isRestocked: sel.isRestocked,
          reason: sel.reason || generalReason,
        };
      });

    if (itemsToSubmit.length === 0) {
      alert("Please specify at least 1 return quantity for an item.");
      return;
    }

    setSubmittingReturn(true);
    try {
      const res = await api.createSalesReturn({
        originalInvoiceId: eligibleInvoice.id,
        refundMethod,
        reason: generalReason,
        items: itemsToSubmit,
      });

      if (res.success) {
        setIsProcessModalOpen(false);
        setEligibleInvoice(null);
        setSelectedItems({});
        await loadReturns();

        // Open print slip
        handleViewReturnSlip(res.returnId);
      }
    } catch (err: any) {
      alert(err.message || "Failed to process return");
    } finally {
      setSubmittingReturn(false);
    }
  };

  // View Return Slip
  const handleViewReturnSlip = async (returnId: string) => {
    setLoadingSlip(true);
    try {
      const res = await api.getSalesReturnDetails(returnId);
      if (res.success && res.returnSlip) {
        setPrintDetail(res.returnSlip);
      }
    } catch (err: any) {
      alert(err.message || "Could not load return slip");
    } finally {
      setLoadingSlip(false);
    }
  };

  const currentRefund = calculateTotalRefund();

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Sales Returns
            </h1>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700">
              {returns.length} returns
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Process customer returns and issue refunds
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadReturns}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 shadow-2xs transition cursor-pointer"
            title="Refresh returns list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => {
              setEligibleInvoice(null);
              setInvoiceLookupQuery("");
              setLookupError("");
              setIsProcessModalOpen(true);
            }}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm shadow-indigo-950/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Process Sales Return
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Total Returns</span>
            <RotateCcw className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{returns.length}</div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Total Refund Amount</span>
            <Receipt className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-700">₹{totalRefunded.toFixed(2)}</div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Restocked Items</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700">
            {returns.reduce((sum, r) => sum + r.items.filter((it) => it.isRestocked).length, 0)} Restocked
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search return #, original invoice #, customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 hover:bg-slate-100/50 focus:bg-white"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700"
          />
          {(startDate || endDate || searchQuery) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setSearchQuery("");
              }}
              className="px-2 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs min-w-[1200px] whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3 py-2 min-w-[130px]">Return #</th>
                <th className="px-3 py-2 min-w-[120px]">Date & Time</th>
                <th className="px-3 py-2 min-w-[140px]">Original Invoice</th>
                <th className="px-3 py-2 min-w-[200px]">Patient / Customer</th>
                <th className="px-3 py-2 text-center min-w-[70px]">Items</th>
                <th className="px-3 py-2 text-right min-w-[120px]">Refund Amount</th>
                <th className="px-3 py-2 text-center min-w-[110px]">Method</th>
                <th className="px-3 py-2 min-w-[180px]">Reason</th>
                <th className="px-3 py-2 text-right min-w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading returns history...
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    <RotateCcw className="h-7 w-7 mx-auto mb-2 text-slate-300" />
                    No sales returns found. Click "Process Sales Return" to create one.
                  </td>
                </tr>
              ) : (
                returns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-3 py-2 font-mono font-bold text-indigo-600">
                      {ret.returnNumber}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {new Date(ret.returnDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      <div className="text-[10px] text-slate-400">
                        {new Date(ret.returnDate).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-3 py-2 font-mono font-medium text-slate-800">
                      {ret.originalInvoiceNumber}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-semibold text-slate-900">{ret.customerName}</div>
                      {ret.customerPhone && (
                        <div className="text-[10px] text-slate-400">{ret.customerPhone}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="inline-block px-2 py-1 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {ret.itemCount} items
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-rose-600">
                      ₹{ret.totalRefundAmount.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded text-[10px] font-bold ${
                          ret.refundMethod === "CASH"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : ret.refundMethod === "UPI"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}
                      >
                        {ret.refundMethod}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-600 max-w-xs truncate" title={ret.reason}>
                      {ret.reason}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => handleViewReturnSlip(ret.id)}
                        className="px-2 py-1 rounded border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 font-semibold text-xs transition flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Printer className="h-3 w-3" />
                        Slip
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Return Modal */}
      {isProcessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="px-6 py-4 bg-white text-slate-900 flex items-center justify-between border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Process Sales Return</h3>
                <p className="text-xs text-slate-500">
                  Select original invoice, choose return quantities, and issue refund
                </p>
              </div>
              <button
                onClick={() => setIsProcessModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Step 1: Invoice Lookup */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Step 1: Enter Original Invoice Number
                </label>
                <form onSubmit={handleLookupInvoice} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-00131"
                    value={invoiceLookupQuery}
                    onChange={(e) => setInvoiceLookupQuery(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={lookingUp || !invoiceLookupQuery.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    {lookingUp ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Lookup Invoice"}
                  </button>
                </form>

                {lookupError && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
                    {lookupError}
                  </div>
                )}

                {eligibleInvoice && (
                  <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-slate-500">Patient:</span>{" "}
                      <span className="font-bold text-slate-900">{eligibleInvoice.customerName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Date:</span>{" "}
                      <span className="font-semibold text-slate-800">
                        {new Date(eligibleInvoice.invoiceDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Invoice Total:</span>{" "}
                      <span className="font-bold text-indigo-600">
                        ₹{eligibleInvoice.grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Line Items to Return */}
              {eligibleInvoice && (
                <form onSubmit={handleSubmitReturn} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Step 2: Choose Items & Return Quantities
                    </label>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="overflow-x-auto scrollbar-thin">
                        <table className="w-full text-left text-xs min-w-[700px] whitespace-nowrap">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-semibold uppercase">
                            <tr>
                              <th className="px-4 py-2 min-w-[200px]">Medicine / Batch</th>
                              <th className="px-3 py-2 text-center min-w-[80px]">Sold Qty</th>
                              <th className="px-3 py-2 text-center min-w-[90px]">Remaining</th>
                              <th className="px-3 py-2 text-center min-w-[100px]">Return Qty</th>
                              <th className="px-3 py-2 text-center min-w-[100px]">Restock?</th>
                              <th className="px-4 py-2 text-right min-w-[100px]">Refund</th>
                            </tr>
                          </thead>
                        <tbody className="divide-y divide-slate-100">
                          {eligibleInvoice.items.map((it) => {
                            const cur = selectedItems[it.salesItemId] || {
                              returnQty: 0,
                              isRestocked: true,
                              reason: "Customer return",
                            };
                            const lineRefund = cur.returnQty * it.ratePerUnit;

                            return (
                              <tr key={it.salesItemId} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3">
                                  <div className="font-bold text-slate-900">{it.productName}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    B:{it.batchNumber} • Exp:{it.expiryDate}
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-center font-medium text-slate-700">
                                  {it.soldQuantity} {it.saleUnit}s
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <span
                                    className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                      it.remainingReturnableQty > 0
                                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                        : "bg-slate-100 text-slate-500"
                                    }`}
                                  >
                                    {it.remainingReturnableQty} {it.saleUnit}s
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max={it.remainingReturnableQty}
                                    disabled={!it.canReturn}
                                    value={cur.returnQty === 0 ? "" : cur.returnQty}
                                    onChange={(e) => {
                                      const val = Math.min(
                                        it.remainingReturnableQty,
                                        Math.max(0, parseInt(e.target.value, 10) || 0)
                                      );
                                      setSelectedItems((prev) => ({
                                        ...prev,
                                        [it.salesItemId]: {
                                          ...cur,
                                          returnQty: val,
                                        },
                                      }));
                                    }}
                                    placeholder="0"
                                    className="w-14 text-center px-2 py-1 border border-slate-300 rounded font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                  />
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedItems((prev) => ({
                                        ...prev,
                                        [it.salesItemId]: {
                                          ...cur,
                                          isRestocked: !cur.isRestocked,
                                        },
                                      }))
                                    }
                                    className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                                      cur.isRestocked
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-amber-50 text-amber-700 border border-amber-200"
                                    }`}
                                  >
                                    {cur.isRestocked ? "Restock ✅" : "Dispose ⚠️"}
                                  </button>
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-slate-900">
                                  ₹{lineRefund.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Refund Method and Reason */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                        Refund Payment Method
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["CASH", "UPI", "CREDIT"] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setRefundMethod(m)}
                            className={`py-2 px-3 border rounded-lg text-xs font-bold text-center transition cursor-pointer ${
                              refundMethod === m
                                ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500"
                                : "border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {m === "CREDIT" ? "Credit Note" : m}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                        Return Reason Note
                      </label>
                      <select
                        value={generalReason}
                        onChange={(e) => setGeneralReason(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="Doctor changed medication">Doctor changed medication</option>
                        <option value="Customer did not need / leftover">Customer did not need / leftover</option>
                        <option value="Wrong medicine dispensed">Wrong medicine dispensed</option>
                        <option value="Damaged pack / leakage">Damaged pack / leakage</option>
                        <option value="Adverse reaction reported">Adverse reaction reported</option>
                      </select>
                    </div>
                  </div>

                  {/* Refund Summary Banner */}
                  <div className="p-4 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-xs text-slate-500 block uppercase tracking-wider font-semibold">
                        Total Refund Amount
                      </span>
                      <span className="text-xs text-slate-600">
                        Method: <strong className="text-slate-900">{refundMethod}</strong>
                      </span>
                    </div>
                    <div className="text-2xl font-black text-emerald-600">
                      ₹{currentRefund.toFixed(2)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsProcessModalOpen(false)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReturn || currentRefund <= 0}
                      className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-bold text-xs rounded-lg shadow transition flex items-center gap-1"
                    >
                      {submittingReturn ? "Processing..." : "Confirm & Process Return"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Return Slip / Credit Note Modal (Screen 10) */}
      {printDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between no-print print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-base">{printDetail.returnNumber}</h3>
                  <p className="text-xs text-slate-400">Credit Note / Return Receipt</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-[#111726] p-1 rounded-lg border border-[#1e2a42] flex text-xs">
                  <button
                    onClick={() => setPrintFormat("80mm")}
                    className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
                      printFormat === "80mm" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-300"
                    }`}
                  >
                    80mm Thermal
                  </button>
                  <button
                    onClick={() => setPrintFormat("A4")}
                    className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
                      printFormat === "A4" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-300"
                    }`}
                  >
                    A4 Note
                  </button>
                </div>

                <button
                  onClick={() => setPrintDetail(null)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Slip Preview Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto bg-slate-100 flex justify-center">
              <div
                id="printable-area"
                data-format={printFormat === "80mm" ? "thermal" : "a4"}
                className={`bg-white p-6 shadow border border-slate-200 text-slate-900 print:border-none print:shadow-none print:p-0 ${
                  printFormat === "80mm" ? "w-[300px] text-[11px] font-mono leading-tight thermal-receipt" : "w-full text-xs"
                }`}
              >
                {/* Store Header */}
                <div className="text-center pb-3 border-b border-dashed border-slate-300 space-y-1">
                  <div className="font-extrabold text-sm uppercase">{printDetail.store.name}</div>
                  <div className="text-[10px] text-slate-600">{printDetail.store.address}, {printDetail.store.city}</div>
                  <div className="text-[10px] text-slate-600">Ph: {printDetail.store.phone}</div>
                  <div className="text-[9px] text-slate-500">GSTIN: {printDetail.store.gstin}</div>
                  <div className="text-[9px] text-slate-500">DL: {printDetail.store.drugLicenseNo}</div>
                  <div className="font-bold text-xs uppercase pt-1 text-slate-800">
                    *** CREDIT NOTE / SALES RETURN ***
                  </div>
                </div>

                {/* Return Details Meta */}
                <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span>Return Slip #:</span>
                    <strong className="font-mono">{printDetail.returnNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Orig Invoice #:</span>
                    <strong className="font-mono">{printDetail.originalInvoiceNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Date & Time:</span>
                    <span>{new Date(printDetail.returnDate).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Patient:</span>
                    <span>{printDetail.customer.name}</span>
                  </div>
                </div>

                {/* Returned Line Items */}
                <div className="py-2 border-b border-dashed border-slate-300 overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left text-[10px] min-w-[240px]">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-1">ITEM</th>
                        <th className="py-1 text-center">QTY</th>
                        <th className="py-1 text-right">REFUND</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {printDetail.items.map((it, i) => (
                        <tr key={i}>
                          <td className="py-1">
                            <div className="font-bold">{it.productName}</div>
                            <div className="text-[9px] text-slate-500">
                              B:{it.batchNumber} • {it.isRestocked ? "Restocked" : "Disposed"}
                            </div>
                          </td>
                          <td className="py-1 text-center font-bold">
                            {it.returnQty} {it.unit}
                          </td>
                          <td className="py-1 text-right font-bold">
                            ₹{it.refundAmount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total Refund Banner */}
                <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-right">
                  <div className="flex justify-between text-xs font-black">
                    <span>TOTAL REFUND:</span>
                    <span className="text-rose-600">₹{printDetail.totalRefundAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>Refund Mode:</span>
                    <span className="font-bold">{printDetail.refundMethod}</span>
                  </div>
                  <div className="text-[9px] text-slate-500 text-left pt-1 italic">
                    Reason: {printDetail.reason}
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center pt-3 text-[9px] text-slate-400">
                  *** Thank you for visiting MediPOS ***
                  <br />
                  Credit Note Valid for Store Adjustments
                </div>
              </div>
            </div>

            {/* Print Trigger Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center no-print print:hidden">
              <button
                onClick={() => setPrintDetail(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => triggerPrint("printable-area")}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm shadow-indigo-950/20 transition flex items-center gap-2 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                Print Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
