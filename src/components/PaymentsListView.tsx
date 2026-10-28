"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Search,
  Calendar,
  Printer,
  ChevronRight,
  RefreshCw,
  Eye,
  MoreVertical,
  ArrowDownLeft,
  ArrowUpRight,
  User,
  Edit2,
  Filter,
  ExternalLink,
  ChevronsUpDown,
  ChevronDown,
  FileText,
  MessageSquare,
} from "lucide-react";
import { api, UnifiedPaymentItem, PaymentsSummary } from "@/lib/api";
import PaymentVoucherModal from "./PaymentVoucherModal";
import GstInvoiceDetailModal from "./GstInvoiceDetailModal";
import GstBillDetailModal from "./GstBillDetailModal";
import { EditPaymentModal } from "./AccountingEditModals";
import { TableSkeleton, EmptyState } from "./common";

export default function PaymentsListView() {
  const [payments, setPayments] = useState<UnifiedPaymentItem[]>([]);
  const [summary, setSummary] = useState<PaymentsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "CUSTOMER" | "VENDOR">("ALL");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  // Selected payment for Detailed GST Payment Voucher View
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [viewInvoiceId, setViewInvoiceId] = useState<string | null>(null);
  const [viewBillId, setViewBillId] = useState<string | null>(null);

  // Selected payment for Edit Modal
  const [editPayment, setEditPayment] = useState<{
    id: string;
    type: "CUSTOMER" | "VENDOR";
    amount: number;
    paymentMethod: string;
    date: string;
    ref?: string;
    notes?: string;
    targetName?: string;
  } | null>(null);

  const [feedback, setFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await api.getPayments({
        type: typeFilter,
        paymentMethod: methodFilter !== "ALL" ? methodFilter : undefined,
        q: searchQuery || undefined,
        limit: 100,
      });
      if (res.success) {
        setPayments(res.payments || []);
        setSummary(res.summary || null);
      }
    } catch (err: any) {
      console.error("Failed to load payments:", err);
      setFeedback({ msg: err.message || "Failed to load payments", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [typeFilter, methodFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPayments();
  };

  const formatDateWithDay = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return { date: isoStr, day: "" };
      const date = d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const day = d.toLocaleDateString("en-IN", { weekday: "short" });
      return { date, day };
    } catch {
      return { date: isoStr, day: "" };
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "PT";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const totalReceipts = summary?.totalReceipts ?? 0;
  const totalDisbursements = summary?.totalDisbursements ?? 0;
  const netCashflow = summary?.netCashflow ?? 0;
  const totalCount = summary?.count ?? payments.length;

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800">Payments & Receipts</h1>
            <p className="text-xs text-slate-500">
              Track customer collections, vendor disbursements, GST vouchers, and bank cashflow.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadPayments()}
            disabled={loading}
            className="px-3 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded transition cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded text-xs flex items-center justify-between ${feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
            }`}
        >
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">Customer Receipts</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-emerald-600 font-mono mt-1">
            ₹{totalReceipts.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Inward Collections</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">Vendor Disbursements</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-lg font-bold text-rose-600 font-mono mt-1">
            ₹{totalDisbursements.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Outward Supplier Payouts</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500">Net Cashflow</div>
          <div
            className={`text-lg font-bold font-mono mt-1 ${netCashflow >= 0 ? "text-emerald-700" : "text-rose-600"
              }`}
          >
            ₹{netCashflow.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Receipts minus Disbursements</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500">Total Transactions</div>
          <div className="text-lg font-bold text-indigo-600 font-mono mt-1">{totalCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Settlement Records</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
            <input
              type="text"
              placeholder="Search by Partner, Invoice #, or Ref #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-slate-800 text-white rounded font-medium hover:bg-slate-700 transition cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500 text-[11px]">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="border border-slate-300 rounded px-2 py-2 bg-white text-slate-700 text-xs focus:outline-hidden"
          >
            <option value="ALL">All Types</option>
            <option value="CUSTOMER">Customer Receipts</option>
            <option value="VENDOR">Vendor Disbursements</option>
          </select>

          <span className="text-slate-500 text-[11px]">Mode:</span>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="border border-slate-300 rounded px-2 py-2 bg-white text-slate-700 text-xs focus:outline-hidden"
          >
            <option value="ALL">All Modes</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Card</option>
            <option value="CREDIT">Credit</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs min-w-[1220px] whitespace-nowrap">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4 text-center w-12 text-slate-400">#</th>
                <th className="py-3 px-4 min-w-[160px]">Receipt / Voucher #</th>
                <th className="py-3 px-4 min-w-[120px]">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">
                    <span>Date</span>
                    <ChevronsUpDown className="w-4 h-4 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center min-w-[150px]">Transaction Type</th>
                <th className="py-3 px-4 min-w-[220px]">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">
                    <span>Partner Details</span>
                    <ChevronsUpDown className="w-4 h-4 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 min-w-[160px]">Linked Invoice / Bill</th>
                <th className="py-3 px-4 min-w-[130px]">Payment Mode</th>
                <th className="py-3 px-4 text-right min-w-[120px]">Amount (₹)</th>
                <th className="py-3 px-4 text-center min-w-[110px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton columns={9} rows={6} />
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8">
                    <EmptyState
                      icon={CreditCard}
                      title="No Payments Found"
                      description="No payment vouchers or records match the selected filter criteria."
                    />
                  </td>
                </tr>
              ) : (
                payments.map((p, index) => {
                  const isCustomer = p.paymentType === "CUSTOMER";
                  const dateObj = formatDateWithDay(p.date);

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedPaymentId(p.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      title="Click row to view GST Payment Voucher"
                    >
                      {/* # Index Column */}
                      <td className="py-3 px-4 text-center text-xs font-medium text-slate-400">
                        {index + 1}
                      </td>

                      {/* Voucher # */}
                      <td className="py-3 px-4 font-semibold text-blue-600 hover:text-blue-700 hover:underline font-mono text-xs">
                        {p.paymentNumber}
                      </td>

                      {/* Date with Day underneath */}
                      <td className="py-3 px-4">
                        <div className="text-xs font-medium text-slate-800">{dateObj.date}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{dateObj.day}</div>
                      </td>

                      {/* Transaction Type */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
                            isCustomer
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                              : "bg-blue-50 text-blue-700 border-blue-200/60"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isCustomer ? "bg-emerald-500" : "bg-blue-500"
                            }`}
                          ></span>
                          <span>{isCustomer ? "Customer Receipt" : "Vendor Disbursement"}</span>
                        </span>
                      </td>

                      {/* Partner Details with Initials Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100/60 flex items-center justify-center font-bold text-xs shrink-0">
                            {getInitials(p.partnerName)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 text-xs">
                              {p.partnerName}
                            </div>
                            {p.partnerPhone && (
                              <div className="text-[11px] text-slate-400 font-normal">
                                {p.partnerPhone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Linked Invoice / Bill */}
                      <td className="py-3 px-4 font-mono text-xs">
                        {p.invoiceNumber ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isCustomer) {
                                setViewInvoiceId(p.invoiceId || null);
                              } else {
                                setViewBillId(p.invoiceId || null);
                              }
                            }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 hover:bg-blue-50 text-blue-700 border border-slate-200/80 rounded-lg text-xs font-medium transition cursor-pointer shadow-2xs"
                            title={`View original ${isCustomer ? "GST Customer Tax Invoice" : "GST Vendor Bill"}`}
                          >
                            <FileText className="w-3 h-3 text-blue-600" />
                            <span>{p.invoiceNumber}</span>
                          </button>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Payment Mode */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800 text-xs">{p.paymentMethod}</span>
                        {p.transactionRef && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Ref: {p.transactionRef}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td
                        className={`py-3 px-4 text-right font-semibold font-mono text-xs ${
                          isCustomer ? "text-emerald-600" : "text-slate-900"
                        }`}
                      >
                        {isCustomer ? "+" : "-"}₹
                        {p.amount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      {/* Actions Buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPaymentId(p.id);
                            }}
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                            title="View Official GST Payment Voucher"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditPayment({
                                id: p.id,
                                type: p.paymentType,
                                amount: p.amount,
                                paymentMethod: p.paymentMethod,
                                date: p.date.split("T")[0],
                                ref: p.transactionRef,
                                notes: p.notes,
                                targetName: p.partnerName,
                              });
                            }}
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                            title="Edit Payment Record / More Options"
                          >
                            <MoreVertical className="w-4 h-4" />
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

      {/* Detailed GST Payment Voucher Modal */}
      {selectedPaymentId && (
        <PaymentVoucherModal
          paymentId={selectedPaymentId}
          onClose={() => setSelectedPaymentId(null)}
          onViewInvoice={(invId) => {
            setSelectedPaymentId(null);
            setViewInvoiceId(invId);
          }}
          onViewBill={(billId) => {
            setSelectedPaymentId(null);
            setViewBillId(billId);
          }}
        />
      )}

      {/* Detailed GST Tax Invoice Modal */}
      {viewInvoiceId && (
        <GstInvoiceDetailModal
          invoiceId={viewInvoiceId}
          onClose={() => setViewInvoiceId(null)}
        />
      )}

      {/* Detailed GST Vendor Bill Modal */}
      {viewBillId && (
        <GstBillDetailModal
          billId={viewBillId}
          onClose={() => setViewBillId(null)}
        />
      )}

      {/* Edit Payment Modal */}
      <EditPaymentModal
        isOpen={Boolean(editPayment)}
        onClose={() => setEditPayment(null)}
        payment={editPayment}
        onSuccess={() => {
          setEditPayment(null);
          setFeedback({ msg: "Payment record updated successfully!", type: "success" });
          loadPayments();
        }}
      />
    </div>
  );
}
