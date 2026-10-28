"use client";

import React, { useState, useEffect } from "react";
import {
  Receipt,
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
  Truck,
  ArrowRight,
  Filter,
  FileText,
  ChevronsUpDown,
  ChevronDown,
} from "lucide-react";
import { purchasesApi, PurchaseItemDetail } from "@/lib/api";
import GstBillDetailModal from "./GstBillDetailModal";
import { RegisterPaymentModal } from "./RegisterPaymentModal";
import PaymentVoucherModal from "./PaymentVoucherModal";
import { TableSkeleton, EmptyState, StatusBadge } from "./common";
import { useStore } from "@/context/StoreContext";

export default function BillsListView() {
  const { currentStore } = useStore();
  const [bills, setBills] = useState<PurchaseItemDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  // Selected bill for Detailed GST Vendor Bill View
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  // Selected payment voucher for official voucher modal
  const [selectedPaymentVoucherId, setSelectedPaymentVoucherId] = useState<string | null>(null);

  // Selected bill for Register Payment modal
  const [paymentModalBill, setPaymentModalBill] = useState<{
    id: string;
    invoiceNumber: string;
    supplierName: string;
    supplierId?: string;
    totalAmount: number;
    paidAmount: number;
    remainingDue: number;
  } | null>(null);

  const [feedback, setFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const loadBills = async () => {
    setLoading(true);
    try {
      const res = await purchasesApi.getPurchases({
        q: searchQuery || undefined,
        paymentStatus: statusFilter !== "ALL" ? statusFilter : undefined,
        storeId: currentStore?.id || undefined,
      });
      if (res.success && res.purchases) {
        setBills(res.purchases);
      }
    } catch (err: any) {
      console.error("Failed to load vendor bills:", err);
      setFeedback({ msg: err.message || "Failed to load vendor bills", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, [statusFilter, currentStore?.id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadBills();
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
    if (!name) return "SP";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // Metrics calculations
  const totalBilled = bills.reduce((sum, b) => sum + Number(b.totalAmount), 0);
  const totalPaid = bills.reduce((sum, b) => sum + Number(b.paidAmount), 0);
  const totalPayable = totalBilled - totalPaid;
  const pendingCount = bills.filter((b) => b.paymentStatus !== "PAID").length;

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto bg-slate-50/50 min-h-screen">
      {/* Top Header matching reference image */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Supplier Bills</h1>
          <p className="text-sm text-slate-500 mt-1">
            View and manage all supplier purchase bills
          </p>
        </div>

        {/* Right side controls: Search, Date Range, Filter, Refresh */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by bill ref, invoice, supplier..."
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
                  { label: "All Bills", val: "ALL" },
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
            onClick={() => loadBills()}
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

      {/* Modern Supplier Bills Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs min-w-[1400px] whitespace-nowrap">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4 text-center w-12 text-slate-400">#</th>
                <th className="py-3 px-4 min-w-[140px]">Bill Ref #</th>
                <th className="py-3 px-4 min-w-[130px]">Supplier Inv #</th>
                <th className="py-3 px-4 min-w-[120px]">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">
                    <span>Date</span>
                    <ChevronsUpDown className="w-4 h-4 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 min-w-[220px]">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">
                    <span>Supplier</span>
                    <ChevronsUpDown className="w-4 h-4 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center min-w-[70px]">Items</th>
                <th className="py-3 px-4 text-right min-w-[120px]">Total Bill</th>
                <th className="py-3 px-4 text-right min-w-[120px]">Paid Amount</th>
                <th className="py-3 px-4 text-right min-w-[120px]">Balance Payable</th>
                <th className="py-3 px-4 text-center min-w-[130px]">Status</th>
                <th className="py-3 px-4 text-center min-w-[220px]">Settlement Disbursements</th>
                <th className="py-3 px-4 text-center min-w-[110px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton columns={11} rows={6} />
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8">
                    <EmptyState
                      icon={Receipt}
                      title="No Vendor Bills Found"
                      description="No vendor purchase bills match the selected filter criteria."
                    />
                  </td>
                </tr>
              ) : (
                bills.map((bill, index) => {
                  const totalAmount = Number(bill.totalAmount);
                  const paidAmount = Number(bill.paidAmount);
                  const balanceDue = Number((totalAmount - paidAmount).toFixed(2));
                  const dateObj = formatDateWithDay(bill.invoiceDate);

                  return (
                    <tr
                      key={bill.id}
                      onClick={() => setSelectedBillId(bill.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      title="Click row to view GST Vendor Bill & GRN"
                    >
                      {/* # Index Column */}
                      <td className="py-3 px-4 text-center text-xs font-medium text-slate-400">
                        {index + 1}
                      </td>

                      {/* Bill Ref # */}
                      <td className="py-3 px-4 font-semibold text-blue-600 hover:text-blue-700 hover:underline font-mono text-xs">
                        {bill.invoiceNumber}
                      </td>

                      {/* Supplier Inv # */}
                      <td className="py-3 px-4 font-medium text-slate-600 font-mono text-xs">
                        {bill.supplierInvoiceNumber || "—"}
                      </td>

                      {/* Date with Day underneath */}
                      <td className="py-3 px-4">
                        <div className="text-xs font-medium text-slate-800">{dateObj.date}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{dateObj.day}</div>
                      </td>

                      {/* Supplier with Initials Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100/60 flex items-center justify-center font-bold text-xs shrink-0">
                            {getInitials(bill.supplierName)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 text-xs">
                              {bill.supplierName}
                            </div>
                            {bill.supplierPhone && (
                              <div className="text-[11px] text-slate-400 font-normal">
                                {bill.supplierPhone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3 px-4 text-center text-slate-600 text-xs font-medium">
                        {bill.itemCount || 1}
                      </td>

                      {/* Total Bill */}
                      <td className="py-3 px-4 text-right font-semibold text-slate-800 font-mono text-xs">
                        ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Paid Amount */}
                      <td className="py-3 px-4 text-right font-semibold text-emerald-600 font-mono text-xs">
                        ₹{paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Balance Payable */}
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

                      {/* Settlement Disbursements */}
                      <td className="py-3 px-4 text-center">
                        {bill.payments && bill.payments.length > 0 ? (
                          <div className="flex flex-col gap-1 items-center">
                            {bill.payments.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPaymentVoucherId(p.id);
                                }}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-lg text-xs font-medium transition cursor-pointer shadow-2xs group"
                                title={`View Payment Voucher for ${p.voucherNumber || p.receiptNumber || "Disbursement"}`}
                              >
                                <FileText className="w-3 h-3 text-emerald-600" />
                                <span className="font-mono">
                                  {p.voucherNumber || p.receiptNumber || `VCH-${p.id.slice(0, 8).toUpperCase()}`}
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
                            <span>Paid ₹{paidAmount.toLocaleString("en-IN")}</span>
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
                              setSelectedBillId(bill.id);
                            }}
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                            title="View GST Registered Vendor Bill & GRN"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (balanceDue > 0) {
                                setPaymentModalBill({
                                  id: bill.id,
                                  invoiceNumber: bill.supplierInvoiceNumber || bill.invoiceNumber,
                                  supplierName: bill.supplierName || bill.supplier?.businessName || "Vendor",
                                  supplierId: bill.supplierId || (bill as any).supplier_id || bill.supplier?.id,
                                  totalAmount,
                                  paidAmount,
                                  remainingDue: balanceDue,
                                });
                              } else {
                                setSelectedBillId(bill.id);
                              }
                            }}
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                            title={balanceDue > 0 ? "Record Payment Disbursement" : "More options"}
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

      {/* Detailed GST Vendor Bill Modal */}
      {selectedBillId && (
        <GstBillDetailModal
          billId={selectedBillId}
          onClose={() => setSelectedBillId(null)}
          onPayBill={(b) => {
            setSelectedBillId(null);
            setPaymentModalBill({
              id: b.id,
              invoiceNumber: b.supplierInvoiceNumber || b.invoiceNumber,
              supplierName: b.supplierName || b.supplier?.businessName || "Vendor",
              supplierId: b.supplierId || (b as any).supplier_id || b.supplier?.id,
              totalAmount: Number(b.totalAmount),
              paidAmount: Number(b.paidAmount),
              remainingDue: Number((Number(b.totalAmount) - Number(b.paidAmount)).toFixed(2)),
            });
          }}
        />
      )}

      {/* Register Payment Modal */}
      {paymentModalBill && (
        <RegisterPaymentModal
          isOpen={true}
          onClose={() => setPaymentModalBill(null)}
          type="VENDOR_BILL"
          invoiceId={paymentModalBill.id}
          invoiceNumber={paymentModalBill.invoiceNumber}
          partnerName={paymentModalBill.supplierName}
          partnerId={paymentModalBill.supplierId}
          grandTotal={paymentModalBill.totalAmount}
          paidAmount={paymentModalBill.paidAmount}
          remainingDue={paymentModalBill.remainingDue}
          onPaymentSuccess={() => {
            setPaymentModalBill(null);
            setFeedback({ msg: "Vendor payment recorded successfully!", type: "success" });
            loadBills();
          }}
        />
      )}
      {/* Linked Payment Voucher Modal */}
      {selectedPaymentVoucherId && (
        <PaymentVoucherModal
          paymentId={selectedPaymentVoucherId}
          onClose={() => setSelectedPaymentVoucherId(null)}
          onViewBill={(id) => {
            setSelectedPaymentVoucherId(null);
            setSelectedBillId(id);
          }}
        />
      )}
    </div>
  );
}
