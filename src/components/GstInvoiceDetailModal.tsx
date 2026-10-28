"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Printer,
  FileText,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  User,
  Stethoscope,
  ArrowRight,
  Receipt,
  ExternalLink,
  Calculator,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  Store,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { api, SalesInvoicePrintDetail } from "@/lib/api";
import { triggerPrint } from "@/lib/print";
import PaymentVoucherModal from "./PaymentVoucherModal";
import { ModalDetailSkeleton, StatusBadge } from "./common";

interface GstInvoiceDetailModalProps {
  invoiceId: string | null;
  onClose: () => void;
  onRegisterPayment?: (invoice: any) => void;
}

export default function GstInvoiceDetailModal({
  invoiceId,
  onClose,
  onRegisterPayment,
}: GstInvoiceDetailModalProps) {
  const [invoice, setInvoice] = useState<SalesInvoicePrintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentVoucherId, setSelectedPaymentVoucherId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!invoiceId) return;
    setLoading(true);
    api
      .getSaleById(invoiceId)
      .then((data) => {
        if (data.invoice) {
          setInvoice(data.invoice);
        }
      })
      .catch((err) => console.error("Failed to load invoice details:", err))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  // Reset scroll position to top whenever an invoice is loaded
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [invoiceId, invoice]);

  if (!invoiceId) return null;

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoStr;
    }
  };

  const formatExpiry = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoStr;
    }
  };

  const grandTotal = invoice ? Number(invoice.grandTotal) : 0;
  const paidAmount = invoice ? Number(invoice.paidAmount) : 0;
  const balanceDue = Number((grandTotal - paidAmount).toFixed(2));
  const isFullyPaid = balanceDue <= 0.01;
  const isPartiallyPaid = !isFullyPaid && paidAmount > 0;
  const isUnpaid = paidAmount <= 0;
  const firstPaymentId = invoice?.payments && invoice.payments.length > 0 ? invoice.payments[0].id : null;
  const subtotal = invoice ? Number(invoice.subtotal) : 0;
  const taxTotal = invoice ? Number(invoice.taxTotal) : 0;
  const cgstAmount = Number(invoice?.cgstTotal || (taxTotal / 2).toFixed(2));
  const sgstAmount = Number(invoice?.sgstTotal || (taxTotal / 2).toFixed(2));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Top Action Bar */}
        <div className="px-6 py-5 bg-white border-b border-slate-100 flex items-center justify-between flex-shrink-0 no-print print:hidden">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {invoice?.invoiceNumber || "INV-00001"}
                </h2>

                {/* Status Badge */}
                <StatusBadge
                  status={isFullyPaid ? "FULLY_PAID" : isPartiallyPaid ? "PARTIALLY_PAID" : "UNPAID"}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                GST Registered Pharmacy Tax Invoice & Dispensing Record
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Payment Voucher Action Button */}
            {firstPaymentId && (
              <button
                type="button"
                onClick={() => setSelectedPaymentVoucherId(firstPaymentId)}
                className="px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-2xs"
                title="View Official GST Payment Voucher"
              >
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>View Payment Voucher</span>
              </button>
            )}

            {balanceDue > 0.01 && onRegisterPayment && invoice && (
              <button
                type="button"
                onClick={() => onRegisterPayment(invoice)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-2xs"
              >
                <CreditCard className="w-4 h-4" />
                <span>Collect ₹{balanceDue.toFixed(2)}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => triggerPrint("printable-area")}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print Invoice</span>
            </button>

            <button
              type="button"
              className="p-2 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-xl transition cursor-pointer shadow-2xs"
              title="More Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        {loading ? (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <ModalDetailSkeleton />
          </div>
        ) : !invoice ? (
          <div className="p-12 text-center text-slate-500 text-xs">Invoice record not found.</div>
        ) : (
          <div
            id="printable-area"
            ref={scrollContainerRef}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 bg-slate-50/50 space-y-4 scrollbar-thin print:p-0 print:bg-white print:space-y-3"
          >
            {/* PRINT-ONLY OFFICIAL DOCUMENT HEADER */}
            <div className="hidden print:flex print-only-header items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                  GST Registered Pharmacy Tax Invoice
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Official Commercial Tax Voucher • Original for Recipient
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold font-mono text-slate-900">
                  {invoice.invoiceNumber}
                </div>
                <div className="text-xs text-slate-500">
                  Invoice Date: {invoice.invoiceDate ? formatDate(invoice.invoiceDate) : "—"}
                </div>
                <div className="text-[11px] font-semibold text-emerald-700">
                  {isFullyPaid ? "STATUS: FULLY PAID" : isPartiallyPaid ? "STATUS: PARTIALLY PAID" : "STATUS: UNPAID"}
                </div>
              </div>
            </div>
            {/* ROW 1: STORE & CUSTOMER CARDS (2 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Billed By (Dispensing Pharmacy) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Store className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-400">Billed By (Dispensing Pharmacy)</div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    {invoice.store?.name || "City Medical Store"}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate">
                      {invoice.store?.address || "123 Main Street, Navrangpura"}
                      {invoice.store?.city ? `, ${invoice.store.city}` : ""}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="px-3 py-1 rounded-lg border border-slate-200 text-[11px] font-mono text-slate-700 bg-white shadow-2xs">
                      GSTIN: {invoice.store?.gstin || "24AAAAA0000A1Z5"}
                    </span>
                    <span className="px-3 py-1 rounded-lg border border-slate-200 text-[11px] font-mono text-slate-700 bg-white shadow-2xs">
                      DL No: {invoice.store?.drugLicenseNo || "GJ-AHM-2024-DL-1842"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Billed To (Customer / Patient) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-400">Billed To (Customer / Patient)</div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    {invoice.customer?.name || "Walk-in Customer"}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                    {invoice.customer?.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>{invoice.customer.phone}</span>
                      </div>
                    )}
                    {invoice.prescription?.doctorName && (
                      <div className="flex items-center gap-1 text-indigo-700 font-semibold">
                        <Stethoscope className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        <span>Dr. {invoice.prescription.doctorName}</span>
                      </div>
                    )}
                  </div>
                  {invoice.customer?.address && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{invoice.customer.address}</span>
                    </div>
                  )}
                  {invoice.prescription?.clinicName && (
                    <div className="mt-2 text-[11px] text-slate-500">
                      Clinic: <span className="font-medium text-slate-700">{invoice.prescription.clinicName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ROW 2: METADATA 4-COLUMN STRIP */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                <div className="pr-4">
                  <span className="text-xs font-medium text-slate-400 block">Invoice #</span>
                  <span className="text-xs font-bold text-slate-900 mt-1 block">
                    {invoice.invoiceNumber || "INV-00001"}
                  </span>
                </div>
                <div className="md:px-4 pt-3 md:pt-0">
                  <span className="text-xs font-medium text-slate-400 block">Invoice Date</span>
                  <span className="text-xs font-bold text-slate-900 mt-1 block">
                    {formatDate(invoice.invoiceDate)}
                  </span>
                </div>
                <div className="md:px-4 pt-3 md:pt-0">
                  <span className="text-xs font-medium text-slate-400 block">Payment Mode</span>
                  <span className="text-xs font-bold text-slate-900 mt-1 block">
                    {invoice.paymentMethod || "CASH"}
                  </span>
                </div>
                <div className="md:pl-4 pt-3 md:pt-0">
                  <span className="text-xs font-medium text-slate-400 block">Items Count</span>
                  <span className="text-xs font-bold text-slate-900 mt-1 block">
                    {invoice.items?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* ROW 3: LINE ITEMS TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left text-xs min-w-[850px] whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold text-[11px]">
                      <th className="py-3 px-4 w-12 text-center min-w-[48px]">#</th>
                      <th className="py-3 px-4 min-w-[220px]">Product</th>
                      <th className="py-3 px-4 min-w-[110px]">Batch</th>
                      <th className="py-3 px-4 min-w-[110px]">Exp Date</th>
                      <th className="py-3 px-4 text-center min-w-[90px]">Qty</th>
                      <th className="py-3 px-4 text-center min-w-[80px]">Unit</th>
                      <th className="py-3 px-4 text-right min-w-[100px]">Rate (₹)</th>
                      <th className="py-3 px-4 text-right min-w-[80px]">GST%</th>
                      <th className="py-3 px-4 text-right min-w-[120px]">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.items?.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 text-center text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-xs">
                            {item.productName}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            {item.genericName || (item.hsnCode ? `HSN: ${item.hsnCode}` : "Prescription item")}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {item.batchNumber || "—"}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {formatExpiry(item.expiryDate)}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-700 font-medium">
                          {Number(item.quantity)}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600">
                          {item.unit || "Strip"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">
                          {Number(item.netRate || item.unitPrice).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">
                          {Number(item.gstRate || 0)}%
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {Number(item.totalAmount).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ROW 4: TAX BREAKDOWN AND INVOICE SUMMARY (2 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* GST Tax Breakdown */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">GST Tax Breakdown</h4>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Taxable Value</span>
                    <span className="font-mono font-semibold text-slate-900">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Output CGST</span>
                    <span className="font-mono font-semibold text-slate-900">₹{cgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Output SGST</span>
                    <span className="font-mono font-semibold text-slate-900">₹{sgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 flex justify-between items-center text-emerald-800 font-bold">
                    <span>Total Output GST</span>
                    <span className="font-mono text-sm">₹{taxTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Invoice Summary */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Invoice Summary</h4>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-mono font-semibold text-slate-900">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Tax (GST)</span>
                    <span className="font-mono font-semibold text-slate-900">₹{taxTotal.toFixed(2)}</span>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 flex justify-between items-center text-emerald-900">
                    <span className="font-bold text-sm">Total Invoice Amount</span>
                    <span className="font-mono font-black text-lg">
                      ₹{grandTotal.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Received from Customer</span>
                    <span className="font-mono font-bold text-emerald-600">
                      ₹{paidAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Balance Due</span>
                    <span className={`font-mono font-bold ${balanceDue > 0.01 ? "text-rose-600" : "text-emerald-600"}`}>
                      ₹{balanceDue.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 5: SETTLEMENT RECEIPTS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Settlement Receipts & Payments</h4>
              </div>

              {invoice.payments && invoice.payments.length > 0 ? (
                <div className="space-y-2">
                  {invoice.payments.map((p, pIdx) => {
                    const receiptNo =
                      p.receiptNumber || `REC-${p.id.slice(0, 8).toUpperCase()}`;
                    const payMethod = p.method || p.paymentMethod || "CASH";

                    return (
                      <div
                        key={p.id || pIdx}
                        className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 text-xs">
                                {receiptNo}
                              </span>
                              <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {payMethod}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Settled on {formatDate(p.date || invoice.invoiceDate)} • Ref: {invoice.invoiceNumber}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 self-end sm:self-auto">
                          <div className="text-right">
                            <div className="font-mono font-bold text-slate-900 text-sm">
                              ₹{Number(p.amount).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            <div className="text-[11px] font-semibold text-emerald-600">
                              Received
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedPaymentVoucherId(p.id)}
                            className="px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                          >
                            <span>View Voucher</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : paidAmount > 0 ? (
                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {invoice.invoiceNumber}
                        </span>
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {invoice.paymentMethod || "CASH"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Settled on {formatDate(invoice.invoiceDate)} • Ref: {invoice.invoiceNumber}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900 text-sm">
                      ₹{paidAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-600">
                      Received
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                  No settlement receipts recorded for this invoice yet.
                </div>
              )}
            </div>

            {/* ROW 6: REGULATORY PHARMACY DISPENSING NOTICE */}
            <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Pharmacy Dispensing Notice</h4>
              </div>
              <p className="text-xs text-slate-500 mt-1 ml-10">
                Official Tax Invoice dispensed in accordance with Drugs & Cosmetics Rules. Certified medications checked and packed by a licensed pharmacist.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Linked Payment Voucher Modal */}
      {selectedPaymentVoucherId && (
        <PaymentVoucherModal
          paymentId={selectedPaymentVoucherId}
          onClose={() => setSelectedPaymentVoucherId(null)}
        />
      )}
    </div>
  );
}
