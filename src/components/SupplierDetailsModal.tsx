"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Truck,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  DollarSign,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { api, SupplierItem } from "@/lib/api";
import GstBillDetailModal from "./GstBillDetailModal";
import PaymentVoucherModal from "./PaymentVoucherModal";

interface SupplierDetailsModalProps {
  supplierId: string | null;
  onClose: () => void;
  onRefreshList?: () => void;
}

export default function SupplierDetailsModal({
  supplierId,
  onClose,
  onRefreshList,
}: SupplierDetailsModalProps) {
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"invoices" | "payments">("invoices");
  const [detailBillId, setDetailBillId] = useState<string | null>(null);
  const [detailPaymentId, setDetailPaymentId] = useState<string | null>(null);

  // Payment Recording State
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState("UPI");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [payError, setPayError] = useState("");

  const loadSupplier = async () => {
    if (!supplierId) return;
    setLoading(true);
    try {
      const data = await api.getSupplierById(supplierId);
      if (data.supplier) {
        setSupplier(data.supplier);
        setPayAmount(Number(data.supplier.currentBalance) || 0);
      }
    } catch (err) {
      console.error("Failed to load supplier details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupplier();
  }, [supplierId]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || payAmount <= 0) {
      setPayError("Please enter a valid payment amount");
      return;
    }

    setSavingPayment(true);
    setPayError("");
    try {
      await api.recordSupplierPayment(supplierId!, {
        amount: Number(payAmount),
        paymentMethod: payMethod,
        referenceNumber: payRef.trim() || undefined,
        notes: payNotes.trim() || undefined,
      });

      setIsPayOpen(false);
      setPayRef("");
      setPayNotes("");
      await loadSupplier();
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      setPayError(err.message || "Failed to record payment");
    } finally {
      setSavingPayment(false);
    }
  };

  if (!supplierId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg text-slate-900 leading-tight">
                  {supplier?.businessName || "Supplier Details"}
                </h2>
                {supplier?.isActive ? (
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-1 rounded border border-emerald-200">
                    Active
                  </span>
                ) : (
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-semibold px-2 py-1 rounded border border-slate-200">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {supplier?.phone ? `Phone: ${supplier.phone}` : "Supplier profile"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-600" />
            Loading supplier profile and purchase ledger...
          </div>
        ) : !supplier ? (
          <div className="p-12 text-center text-slate-500">Supplier not found.</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* KPI Balance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">
                  Outstanding Balance Due
                </span>
                <div
                  className={`text-2xl font-bold ${
                    supplier.currentBalance > 0 ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  ₹{Number(supplier.currentBalance).toFixed(2)}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Terms: {supplier.paymentTerms || "Net 30"}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">
                  Total Purchases
                </span>
                <div className="text-2xl font-bold text-slate-900">
                  {supplier.purchaseInvoices?.length || 0} Invoices
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Lifetime supplier volume
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">
                  Total Payments Disbursed
                </span>
                <div className="text-2xl font-bold text-slate-900">
                  {supplier.payments?.length || 0} Payments
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Bank / UPI settlements
                </span>
              </div>
            </div>

            {/* Contact Details Bar */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{supplier.phone || "No phone listed"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>{supplier.email || "No email listed"}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span className="truncate">{supplier.address || "No address listed"}</span>
              </div>
            </div>

            {/* Quick Action: Record Payment Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 border-b border-slate-200">
                <button
                  onClick={() => setActiveTab("invoices")}
                  className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
                    activeTab === "invoices"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  Purchase Invoices ({supplier.purchaseInvoices?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("payments")}
                  className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
                    activeTab === "payments"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  Payments Log ({supplier.payments?.length || 0})
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPayAmount(supplier.currentBalance > 0 ? supplier.currentBalance : 0);
                  setIsPayOpen(true);
                }}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 transition"
              >
                <Plus className="h-4 w-4" />
                Record Payment
              </button>
            </div>

            {/* Record Payment Form Modal */}
            {isPayOpen && (
              <form
                onSubmit={handleRecordPayment}
                className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3 animate-in fade-in duration-150 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 text-sm">
                    Disburse Payment to {supplier.businessName}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPayOpen(false)}
                    className="p-1 rounded text-emerald-700 hover:bg-emerald-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {payError && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-700 font-medium">
                    {payError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Payment Amount (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="1"
                      value={payAmount}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Payment Method
                    </label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="UPI">UPI / QR Transfer</option>
                      <option value="CASH">Cash</option>
                      <option value="CARD">Debit / Credit Card</option>
                      <option value="CREDIT">Bank Wire / RTGS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Reference / UTR Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UPI-9281928"
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPayOpen(false)}
                    className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPayment}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-lg shadow transition flex items-center gap-1"
                  >
                    {savingPayment ? "Saving..." : "Confirm & Update Balance"}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 1: Purchases Table */}
            {activeTab === "invoices" && (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left text-xs min-w-[780px] whitespace-nowrap">
                    <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 min-w-[140px]">Internal Voucher #</th>
                        <th className="px-4 py-3 min-w-[130px]">Supplier Bill #</th>
                        <th className="px-4 py-3 min-w-[110px]">Date</th>
                        <th className="px-4 py-3 text-center min-w-[70px]">Items</th>
                        <th className="px-4 py-3 text-right min-w-[110px]">Invoice Total</th>
                        <th className="px-4 py-3 text-right min-w-[110px]">Paid Amount</th>
                        <th className="px-4 py-3 text-center min-w-[110px]">Status</th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {supplier.purchaseInvoices && supplier.purchaseInvoices.length > 0 ? (
                      supplier.purchaseInvoices.map((inv: any) => (
                        <tr
                          key={inv.id}
                          onClick={() => setDetailBillId(inv.id)}
                          className="hover:bg-emerald-50/50 transition cursor-pointer group"
                          title="Click row to view full GST Vendor Bill"
                        >
                          <td className="px-4 py-3 font-mono font-bold text-indigo-600 group-hover:underline">
                            {inv.invoiceNumber}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600">
                            {inv.supplierInvoiceNumber}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{inv.invoiceDate}</td>
                          <td className="px-4 py-3 text-center font-bold text-slate-700">
                            {inv.itemCount} items
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">
                            ₹{inv.totalAmount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                            ₹{inv.paidAmount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {inv.paymentStatus === "PAID" ? (
                              <span className="inline-block px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                                PAID
                              </span>
                            ) : inv.paymentStatus === "PARTIAL" ? (
                              <span className="inline-block px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                                PARTIAL
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
                                UNPAID
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                          No purchase invoices found for this supplier.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            )}

            {/* Tab 2: Payments Table */}
            {activeTab === "payments" && (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left text-xs min-w-[780px] whitespace-nowrap">
                    <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 min-w-[120px]">Payment Date</th>
                        <th className="px-4 py-3 min-w-[100px]">Method</th>
                        <th className="px-4 py-3 min-w-[150px]">Reference / UTR</th>
                        <th className="px-4 py-3 min-w-[180px]">Notes</th>
                        <th className="px-4 py-3 text-right min-w-[130px]">Amount Disbursed</th>
                        <th className="px-4 py-3 text-center min-w-[100px]">Voucher</th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {supplier.payments && supplier.payments.length > 0 ? (
                      supplier.payments.map((p: any) => (
                        <tr
                          key={p.id}
                          onClick={() => setDetailPaymentId(p.id)}
                          className="hover:bg-slate-100/70 transition cursor-pointer group"
                          title="Click row to view Official GST Payment Voucher"
                        >
                          <td className="px-4 py-3 text-slate-800 font-medium">{p.date}</td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200 text-[10px]">
                              {p.paymentMethod}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600">
                            {p.referenceNumber || "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                            {p.notes || "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-600">
                            ₹{p.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailPaymentId(p.id);
                              }}
                              className="px-2 py-1 text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded cursor-pointer transition shadow-2xs"
                              title="View Official GST Payment Voucher"
                            >
                              Voucher ➔
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                          No payments recorded yet for this supplier.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Linked GST Bill Detail Modal */}
      {detailBillId && (
        <GstBillDetailModal
          billId={detailBillId}
          onClose={() => setDetailBillId(null)}
        />
      )}

      {/* Linked Payment Voucher Modal */}
      {detailPaymentId && (
        <PaymentVoucherModal
          paymentId={detailPaymentId}
          onClose={() => setDetailPaymentId(null)}
          onViewBill={(bId) => {
            setDetailPaymentId(null);
            setDetailBillId(bId);
          }}
        />
      )}
    </div>
  );
}
