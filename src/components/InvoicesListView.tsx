"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Calendar,
  CreditCard,
  Printer,
  ChevronRight,
  RefreshCw,
  Eye,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  Receipt,
  ArrowRight,
  ChevronsUpDown,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import { api, SalesInvoiceListItem } from "@/lib/api";
import GstInvoiceDetailModal from "./GstInvoiceDetailModal";
import { RegisterPaymentModal } from "./RegisterPaymentModal";
import PaymentVoucherModal from "./PaymentVoucherModal";
import { TableSkeleton, EmptyState, StatusBadge } from "./common";
import { useStore } from "@/context/StoreContext";

export default function InvoicesListView() {
  const { currentStore } = useStore();
  const [invoices, setInvoices] = useState<SalesInvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  // Selected invoice for Detailed GST Tax Invoice View
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  // Selected payment voucher for official voucher modal
  const [selectedPaymentVoucherId, setSelectedPaymentVoucherId] = useState<string | null>(null);

  // Selected invoice for Register Payment modal
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<{
    id: string;
    invoiceNumber: string;
    customerName: string;
    customerId?: string;
    grandTotal: number;
    paidAmount: number;
    remainingDue: number;
  } | null>(null);

  const [feedback, setFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.getSales({
        q: searchQuery || undefined,
        paymentStatus: statusFilter !== "ALL" ? statusFilter : undefined,
        storeId: currentStore?.id || undefined,
        limit: 100,
      });
      if (res.success && res.invoices) {
        setInvoices(res.invoices);
      }
    } catch (err: any) {
      console.error("Failed to load invoices:", err);
      setFeedback({ msg: err.message || "Failed to load invoices", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [statusFilter, currentStore?.id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadInvoices();
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
    if (!name) return "CS";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // Metrics calculations
  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.grandTotal), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
  const totalPending = totalInvoiced - totalCollected;
  const unpaidCount = invoices.filter((inv) => inv.paymentStatus !== "PAID").length;

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto bg-slate-50/50 min-h-screen">
      {/* Top Header matching reference image */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">
            View and manage all customer tax invoices and receivables
          </p>
        </div>

        {/* Right side controls: Search, Date Range, Filter, Refresh */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by invoice #, customer, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-72 sm:w-80 pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition"
            />
          </form>

          {/* Date Picker Button / Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowDateDropdown(!showDateDropdown);
                setShowFilterDropdown(false);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>
                {dateRangeFilter === "ALL" ? "01 Oct 2026 - 31 Oct 2026" : dateRangeFilter}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {showDateDropdown && (
              <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-30 text-xs">
                <div className="font-semibold text-slate-400 px-2 py-1 text-[11px] uppercase">
                  Select Period
                </div>
                {[
                  "01 Oct 2026 - 31 Oct 2026",
                  "Current Month",
                  "Last 30 Days",
                  "Current Quarter",
                  "All History",
                ].map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => {
                      setDateRangeFilter(range);
                      setShowDateDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${
                      dateRangeFilter === range
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowFilterDropdown(!showFilterDropdown);
                setShowDateDropdown(false);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              <Filter className="w-4 h-4 text-slate-500" />
              <span>
                {statusFilter === "ALL" ? "Filter" : `Status: ${statusFilter}`}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-30 text-xs">
                <div className="font-semibold text-slate-400 px-2 py-1 text-[11px] uppercase">
                  Payment Status
                </div>
                {[
                  { label: "All Invoices", val: "ALL" },
                  { label: "Fully Paid", val: "PAID" },
                  { label: "Partially Paid", val: "PARTIAL" },
                  { label: "Unpaid Only", val: "UNPAID" },
                ].map((s) => (
                  <button
                    key={s.val}
                    type="button"
                    onClick={() => {
                      setStatusFilter(s.val);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${
                      statusFilter === s.val
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => loadInvoices()}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer shadow-2xs"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between shadow-2xs ${
            feedback.type === "success"
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

      {/* Modern Invoices Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs min-w-[1380px] whitespace-nowrap">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4 text-center w-12 text-slate-400">#</th>
                <th className="py-3 px-4 min-w-[140px]">Invoice #</th>
                <th className="py-3 px-4 min-w-[120px]">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">
                    <span>Date</span>
                    <ChevronsUpDown className="w-4 h-4 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 min-w-[220px]">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">
                    <span>Customer / Patient</span>
                    <ChevronsUpDown className="w-4 h-4 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center min-w-[70px]">Items</th>
                <th className="py-3 px-4 text-right min-w-[120px]">Grand Total</th>
                <th className="py-3 px-4 text-right min-w-[120px]">Paid Amount</th>
                <th className="py-3 px-4 text-right min-w-[120px]">Balance Due</th>
                <th className="py-3 px-4 text-center min-w-[130px]">Status</th>
                <th className="py-3 px-4 text-center min-w-[220px]">Settlement Receipts</th>
                <th className="py-3 px-4 text-center min-w-[110px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton columns={10} rows={6} />
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8">
                    <EmptyState
                      icon={FileText}
                      title="No Invoices Found"
                      description="No customer tax invoices match the selected filter criteria."
                    />
                  </td>
                </tr>
              ) : (
                invoices.map((inv, index) => {
                  const grandTotal = Number(inv.grandTotal);
                  const paidAmount = Number(inv.paidAmount);
                  const balanceDue = Number((grandTotal - paidAmount).toFixed(2));
                  const dateObj = formatDateWithDay(inv.invoiceDate);

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedInvoiceId(inv.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      title="Click row to view GST Tax Invoice"
                    >
                      {/* # Index Column */}
                      <td className="py-3 px-4 text-center text-xs font-medium text-slate-400">
                        {index + 1}
                      </td>

                      {/* Invoice # */}
                      <td className="py-3 px-4 font-semibold text-blue-600 hover:text-blue-700 hover:underline font-mono text-xs">
                        {inv.invoiceNumber}
                      </td>

                      {/* Date with Day underneath */}
                      <td className="py-3 px-4">
                        <div className="text-xs font-medium text-slate-800">{dateObj.date}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{dateObj.day}</div>
                      </td>

                      {/* Customer / Patient with Initials Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100/60 flex items-center justify-center font-bold text-xs shrink-0">
                            {getInitials(inv.customerName)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 text-xs">
                              {inv.customerName}
                            </div>
                            {inv.customerPhone && (
                              <div className="text-[11px] text-slate-400 font-normal">
                                {inv.customerPhone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3 px-4 text-center text-slate-600 text-xs font-medium">
                        {inv.itemCount || 1}
                      </td>

                      {/* Grand Total */}
                      <td className="py-3 px-4 text-right font-semibold text-slate-800 font-mono text-xs">
                        ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Paid Amount */}
                      <td className="py-3 px-4 text-right font-semibold text-emerald-600 font-mono text-xs">
                        ₹{paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Balance Due */}
                      <td className="py-3 px-4 text-right font-semibold font-mono text-xs">
                        <span className={balanceDue > 0.01 ? "text-rose-600" : "text-emerald-600"}>
                          ₹{balanceDue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Status Pill Badge with Dot */}
                      <td className="py-3 px-4 text-center">
                        <StatusBadge
                          status={balanceDue <= 0.01 ? "FULLY_PAID" : paidAmount > 0 ? "PARTIALLY_PAID" : "UNPAID"}
                        />
                      </td>

                      {/* Settlement Receipts */}
                      <td className="py-3 px-4 text-center">
                        {inv.payments && inv.payments.length > 0 ? (
                          <div className="flex flex-col gap-1 items-center">
                            {inv.payments.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPaymentVoucherId(p.id);
                                }}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-lg text-xs font-medium transition cursor-pointer shadow-2xs group"
                                title={`View Official Payment Voucher for ${p.receiptNumber || "Receipt"}`}
                              >
                                <FileText className="w-3 h-3 text-emerald-600" />
                                <span className="font-mono">
                                  {p.receiptNumber || `RCP-${p.id.slice(0, 8).toUpperCase()}`}
                                </span>
                                <span className="font-semibold">
                                  ₹{Number(p.amount).toLocaleString("en-IN")}
                                </span>
                                <ChevronRight className="w-3 h-3 text-emerald-500 group-hover:translate-x-1 transition" />
                              </button>
                            ))}
                          </div>
                        ) : paidAmount > 0 ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-lg text-xs font-medium">
                            <FileText className="w-3 h-3 text-emerald-600" />
                            <span>Paid via {inv.paymentMethod || "CASH"}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>

                      {/* Actions Buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInvoiceId(inv.id);
                            }}
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                            title="View GST Registered Tax Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (balanceDue > 0) {
                                setPaymentModalInvoice({
                                  id: inv.id,
                                  invoiceNumber: inv.invoiceNumber,
                                  customerName: inv.customerName,
                                  grandTotal,
                                  paidAmount,
                                  remainingDue: balanceDue,
                                });
                              } else {
                                setSelectedInvoiceId(inv.id);
                              }
                            }}
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                            title={balanceDue > 0 ? "Collect Payment Installment" : "More options"}
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

      {/* Detailed GST Tax Invoice Modal */}
      {selectedInvoiceId && (
        <GstInvoiceDetailModal
          invoiceId={selectedInvoiceId}
          onClose={() => setSelectedInvoiceId(null)}
          onRegisterPayment={(inv) => {
            setSelectedInvoiceId(null);
            setPaymentModalInvoice({
              id: inv.id,
              invoiceNumber: inv.invoiceNumber,
              customerName: inv.customer.name,
              grandTotal: Number(inv.grandTotal),
              paidAmount: Number(inv.paidAmount),
              remainingDue: Number((Number(inv.grandTotal) - Number(inv.paidAmount)).toFixed(2)),
            });
          }}
        />
      )}

      {/* Register Payment Modal */}
      {paymentModalInvoice && (
        <RegisterPaymentModal
          isOpen={true}
          onClose={() => setPaymentModalInvoice(null)}
          type="CUSTOMER_INVOICE"
          invoiceId={paymentModalInvoice.id}
          invoiceNumber={paymentModalInvoice.invoiceNumber}
          partnerName={paymentModalInvoice.customerName}
          grandTotal={paymentModalInvoice.grandTotal}
          paidAmount={paymentModalInvoice.paidAmount}
          remainingDue={paymentModalInvoice.remainingDue}
          onPaymentSuccess={() => {
            setPaymentModalInvoice(null);
            setFeedback({ msg: "Customer payment registered successfully!", type: "success" });
            loadInvoices();
          }}
        />
      )}
      {/* Linked Payment Voucher Modal */}
      {selectedPaymentVoucherId && (
        <PaymentVoucherModal
          paymentId={selectedPaymentVoucherId}
          onClose={() => setSelectedPaymentVoucherId(null)}
          onViewInvoice={(id) => {
            setSelectedPaymentVoucherId(null);
            setSelectedInvoiceId(id);
          }}
        />
      )}
    </div>
  );
}
