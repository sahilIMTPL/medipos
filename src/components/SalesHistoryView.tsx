"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Printer,
  Eye,
  RefreshCw,
  Calendar,
  CreditCard,
  DollarSign,
  TrendingUp,
  Receipt,
  User,
  ShoppingBag,
} from "lucide-react";
import { api, SalesInvoiceListItem } from "@/lib/api";
import GstInvoiceDetailModal from "./GstInvoiceDetailModal";
import { RegisterPaymentModal } from "./RegisterPaymentModal";
import { useStore } from "@/context/StoreContext";

interface SalesHistoryViewProps {
  onNavigateToPos?: () => void;
}

export default function SalesHistoryView({ onNavigateToPos }: SalesHistoryViewProps) {
  const { currentStore } = useStore();
  const [invoices, setInvoices] = useState<SalesInvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Print / View Details Modal
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  // Register Payment Modal
  const [paymentModalState, setPaymentModalState] = useState<{
    isOpen: boolean;
    invoice: SalesInvoiceListItem | null;
  }>({
    isOpen: false,
    invoice: null,
  });

  const loadSales = async () => {
    setLoading(true);
    try {
      const data = await api.getSales({
        q: searchQuery || undefined,
        paymentMethod: selectedMethod !== "ALL" ? selectedMethod : undefined,
        paymentStatus: selectedStatus !== "ALL" ? selectedStatus : undefined,
        storeId: currentStore?.id || undefined,
      });

      if (data.invoices) setInvoices(data.invoices);
    } catch (err) {
      console.error("Failed to load sales history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [selectedMethod, selectedStatus, currentStore?.id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadSales();
  };

  // KPI Calculations
  const totalCount = invoices.length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.grandTotal || 0), 0);
  const upiCount = invoices.filter((inv) => inv.paymentMethod === "UPI").length;
  const cashCount = invoices.filter((inv) => inv.paymentMethod === "CASH").length;
  const aov = totalCount > 0 ? totalRevenue / totalCount : 0;

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="p-4 max-w-[1600px] mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sales History</h1>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700">
              {totalCount} bills
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">View completed sales invoices and print receipts</p>
        </div>

        {onNavigateToPos && (
          <button
            onClick={onNavigateToPos}
            className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-2xs transition cursor-pointer self-start sm:self-auto"
          >
            <Receipt className="h-4 w-4" />
            <span>Open POS Billing</span>
          </button>
        )}
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Bills</span>
            <Receipt className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{totalCount}</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Revenue</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            ₹{totalRevenue.toFixed(2)}
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Average Basket</span>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">₹{aov.toFixed(1)}</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Payment Mix</span>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {upiCount} UPI / {cashCount} Cash
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice #, customer name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="px-2 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
          >
            <option value="ALL">All Methods</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Card</option>
            <option value="SPLIT">Split</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
          >
            <option value="ALL">All Status</option>
            <option value="PAID">Paid</option>
            <option value="PARTIAL">Partial</option>
            <option value="UNPAID">Unpaid</option>
          </select>

          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedMethod("ALL");
              setSelectedStatus("ALL");
              loadSales();
            }}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition"
            title="Reset Filters & Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs min-w-[1340px] whitespace-nowrap">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4 text-center w-12 text-slate-400">#</th>
                <th className="py-3 px-4 min-w-[140px]">Invoice #</th>
                <th className="py-3 px-4 min-w-[130px]">Date &amp; Time</th>
                <th className="py-3 px-4 min-w-[220px]">Customer</th>
                <th className="py-3 px-4 min-w-[140px]">Doctor</th>
                <th className="py-3 px-4 text-center min-w-[70px]">Items</th>
                <th className="py-3 px-4 text-right min-w-[110px]">Subtotal</th>
                <th className="py-3 px-4 text-right min-w-[120px]">Grand Total</th>
                <th className="py-3 px-4 text-center min-w-[120px]">Payment Mode</th>
                <th className="py-3 px-4 text-center min-w-[120px]">Status</th>
                <th className="py-3 px-4 text-center min-w-[110px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading sales transactions...</span>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    <Receipt className="h-6 w-6 mx-auto mb-2 text-slate-300" />
                    <span>No sales invoices found matching your query.</span>
                  </td>
                </tr>
              ) : (
                invoices.map((inv, index) => (
                  <tr
                    key={inv.id}
                    onClick={() => setSelectedInvoiceId(inv.id)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    title="Click row to view / print Tax Invoice"
                  >
                    {/* # Index Column */}
                    <td className="py-3 px-4 text-center text-xs font-medium text-slate-400">
                      {index + 1}
                    </td>

                    {/* Invoice # */}
                    <td className="py-3 px-4 font-semibold text-blue-600 hover:text-blue-700 hover:underline font-mono text-xs">
                      {inv.invoiceNumber}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-700 text-xs">
                      {formatDate(inv.invoiceDate)}
                    </td>

                    {/* Customer with Initials Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100/60 flex items-center justify-center font-bold text-xs shrink-0">
                          {inv.customerName
                            ? inv.customerName.trim().slice(0, 2).toUpperCase()
                            : "CS"}
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

                    {/* Doctor */}
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {inv.doctorName ? `Dr. ${inv.doctorName}` : "—"}
                    </td>

                    {/* Items */}
                    <td className="py-3 px-4 text-center font-medium text-slate-600 text-xs">
                      {inv.itemCount}
                    </td>

                    {/* Subtotal */}
                    <td className="py-3 px-4 text-right text-slate-700 font-mono text-xs">
                      ₹{inv.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Grand Total */}
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 font-mono text-xs">
                      ₹{inv.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Payment Mode */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium text-xs border border-slate-200/80">
                        {inv.paymentMethod}
                      </span>
                    </td>

                    {/* Status Pill Badge with Dot */}
                    <td className="py-3 px-4 text-center">
                      {inv.paymentStatus === "PAID" ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>Fully Paid</span>
                        </span>
                      ) : inv.paymentStatus === "PARTIAL" ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>Partially Paid</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          <span>Unpaid</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInvoiceId(inv.id);
                          }}
                          className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                          title="View / Print Tax Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {inv.paymentStatus !== "PAID" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPaymentModalState({
                                isOpen: true,
                                invoice: inv,
                              });
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-2xs"
                            title="Register Customer Payment"
                          >
                            Pay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Tax Modal */}
      {selectedInvoiceId && (
        <GstInvoiceDetailModal
          invoiceId={selectedInvoiceId}
          onClose={() => setSelectedInvoiceId(null)}
          onRegisterPayment={(inv) => {
            setPaymentModalState({
              isOpen: true,
              invoice: inv,
            });
          }}
        />
      )}

      {/* Register Payment Modal */}
      {paymentModalState.isOpen && paymentModalState.invoice && (
        <RegisterPaymentModal
          isOpen={paymentModalState.isOpen}
          onClose={() => setPaymentModalState({ isOpen: false, invoice: null })}
          type="CUSTOMER_INVOICE"
          invoiceId={paymentModalState.invoice.id}
          invoiceNumber={paymentModalState.invoice.invoiceNumber}
          partnerName={paymentModalState.invoice.customerName}
          grandTotal={paymentModalState.invoice.grandTotal}
          paidAmount={paymentModalState.invoice.paidAmount}
          remainingDue={paymentModalState.invoice.grandTotal - paymentModalState.invoice.paidAmount}
          onPaymentSuccess={() => {
            loadSales();
          }}
        />
      )}
    </div>
  );
}
