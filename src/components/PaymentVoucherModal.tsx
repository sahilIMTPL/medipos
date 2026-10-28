"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Printer,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  User,
  Truck,
  FileText,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  Store,
  ArrowRight,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { api, UnifiedPaymentItem } from "@/lib/api";
import { triggerPrint } from "@/lib/print";
import { ModalDetailSkeleton, StatusBadge } from "./common";

interface PaymentVoucherModalProps {
  paymentId: string | null;
  onClose: () => void;
  onViewInvoice?: (invoiceId: string) => void;
  onViewBill?: (billId: string) => void;
}

export default function PaymentVoucherModal({
  paymentId,
  onClose,
  onViewInvoice,
  onViewBill,
}: PaymentVoucherModalProps) {
  const [payment, setPayment] = useState<UnifiedPaymentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!paymentId) return;
    setLoading(true);
    api
      .getPaymentById(paymentId)
      .then((data) => {
        if (data.payment) setPayment(data.payment);
      })
      .catch((err) => console.error("Failed to load payment voucher:", err))
      .finally(() => setLoading(false));
  }, [paymentId]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [paymentId, payment]);

  if (!paymentId) return null;

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

  const isCustomerReceipt = payment?.paymentType === "CUSTOMER";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Top Action Bar */}
        <div className="px-6 py-5 bg-white border-b border-slate-100 flex items-center justify-between flex-shrink-0 no-print print:hidden">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {payment?.paymentNumber || "VCH-00001"}
                </h2>
                <StatusBadge
                  status={isCustomerReceipt ? "CUSTOMER" : "VENDOR"}
                />
                <span className="px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded-lg font-mono font-medium border border-slate-200">
                  {payment?.paymentMethod || "UPI"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Official GST Payment Voucher & Settlement Receipt
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => triggerPrint("printable-area")}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print Voucher</span>
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
        ) : !payment ? (
          <div className="p-12 text-center text-slate-500 text-xs">Payment voucher record not found.</div>
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
                  {isCustomerReceipt ? "GST Customer Payment Receipt" : "GST Vendor Disbursement Voucher"}
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Official Statutory Settlement Record • Original for Recipient
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold font-mono text-slate-900">
                  {payment?.paymentNumber || "VCH-00001"}
                </div>
                <div className="text-xs text-slate-500">
                  Date: {payment?.date ? formatDate(payment.date) : "—"}
                </div>
              </div>
            </div>
            {/* ROW 1: STORE & PARTNER CARDS (2 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Store Identity */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Store className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-400">
                    {isCustomerReceipt ? "Received By (Pharmacy)" : "Disbursed From (Pharmacy)"}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    {payment.store?.name || "City Medical Store"}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate">
                      {payment.store?.address || "123 Main Street, Navrangpura"}
                      {payment.store?.city ? `, ${payment.store.city}` : ""}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="px-3 py-1 rounded-lg border border-slate-200 text-[11px] font-mono text-slate-700 bg-white shadow-2xs">
                      GSTIN: {payment.store?.gstin || "24AAAAA0000A1Z5"}
                    </span>
                    <span className="px-3 py-1 rounded-lg border border-slate-200 text-[11px] font-mono text-slate-700 bg-white shadow-2xs">
                      DL No: {payment.store?.drugLicenseNo || "GJ-AHM-2024-DL-1842"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Partner Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  {isCustomerReceipt ? <User className="w-6 h-6" /> : <Truck className="w-6 h-6" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-400">
                    {isCustomerReceipt ? "Received From (Customer / Patient)" : "Disbursed To (Vendor / Supplier)"}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    {payment.partnerName || "Partner"}
                  </h3>
                  {payment.partnerPhone && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>{payment.partnerPhone}</span>
                    </div>
                  )}
                  {payment.partnerGstin && (
                    <div className="mt-2">
                      <span className="px-3 py-1 rounded-lg border border-slate-200 text-[11px] font-mono text-slate-700 bg-white shadow-2xs inline-block">
                        GSTIN: {payment.partnerGstin}
                      </span>
                    </div>
                  )}
                  {payment.partnerAddress && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{payment.partnerAddress}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ROW 2: METADATA 4-COLUMN STRIP */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                <div className="pr-4">
                  <span className="text-xs font-medium text-slate-400 block">Voucher Reference #</span>
                  <span className="text-xs font-bold text-slate-900 mt-1 block">
                    {payment.paymentNumber}
                  </span>
                </div>
                <div className="md:px-4 pt-3 md:pt-0">
                  <span className="text-xs font-medium text-slate-400 block">Settlement Date</span>
                  <span className="text-xs font-bold text-slate-900 mt-1 block">
                    {formatDate(payment.date)}
                  </span>
                </div>
                <div className="md:px-4 pt-3 md:pt-0">
                  <span className="text-xs font-medium text-slate-400 block">Payment Method</span>
                  <span className="text-xs font-bold text-slate-900 mt-1 block">
                    {payment.paymentMethod}
                  </span>
                </div>
                <div className="md:pl-4 pt-3 md:pt-0">
                  <span className="text-xs font-medium text-slate-400 block">Settled Document</span>
                  {payment.invoiceId && (isCustomerReceipt ? onViewInvoice : onViewBill) ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (isCustomerReceipt && onViewInvoice && payment.invoiceId) {
                          onViewInvoice(payment.invoiceId);
                        } else if (!isCustomerReceipt && onViewBill && payment.invoiceId) {
                          onViewBill(payment.invoiceId);
                        }
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline mt-1 block cursor-pointer"
                    >
                      {payment.invoiceNumber} ➔
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-slate-900 mt-1 block">
                      {payment.invoiceNumber || "—"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ROW 3: HIGHLIGHTED SETTLEMENT AMOUNT CARD */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    {isCustomerReceipt ? "Amount Received From Customer" : "Amount Disbursed To Vendor"}
                  </div>
                  <div className="text-3xl font-black font-mono text-emerald-900 mt-1">
                    ₹{payment.amount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-xs text-emerald-700 font-medium mt-1">
                    Amount in Words: <span className="italic">{payment.amountInWords}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Transaction Reference / UTR
                  </div>
                  <div className="font-mono font-bold text-slate-900 mt-1 text-sm">
                    {payment.transactionRef || "PROCESSED_IMMEDIATE"}
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mt-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Settled & Reconciled</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 4: DOCUMENT ALLOCATION & LEDGER IMPACT (2 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Document Settlement Details */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Document Allocation</h4>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Target Document</span>
                    <span className="font-mono font-semibold text-slate-900">{payment.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Original Document Amount</span>
                    <span className="font-mono font-semibold text-slate-900">
                      ₹{payment.invoiceTotal.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Cumulative Amount Settled</span>
                    <span className="font-mono font-bold text-emerald-600">
                      ₹{payment.invoicePaid.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center">
                    <span className="font-bold text-slate-800">Remaining Due</span>
                    <span
                      className={`font-mono font-black ${
                        payment.invoiceBalanceRemaining > 0 ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      ₹{payment.invoiceBalanceRemaining.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Double-Entry Ledger Impact */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Double-Entry Ledger Impact</h4>
                </div>

                <div className="overflow-x-auto scrollbar-thin rounded-xl border border-slate-100">
                  <table className="w-full text-left text-xs min-w-[340px] whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100 text-[11px]">
                      <tr>
                        <th className="py-2 px-3">Account Title</th>
                        <th className="py-2 px-3 text-right">Debit</th>
                        <th className="py-2 px-3 text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {isCustomerReceipt ? (
                        <>
                          <tr>
                            <td className="py-2 px-3 font-medium text-slate-800">
                              {payment.paymentMethod === "CASH" ? "Cash on Hand" : "Bank Current Account"}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-700 font-mono">
                              ₹{payment.amount.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-400">—</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-medium text-slate-800">
                              Accounts Receivable
                            </td>
                            <td className="py-2 px-3 text-right text-slate-400">—</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-800 font-mono">
                              ₹{payment.amount.toFixed(2)}
                            </td>
                          </tr>
                        </>
                      ) : (
                        <>
                          <tr>
                            <td className="py-2 px-3 font-medium text-slate-800">
                              Accounts Payable
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-700 font-mono">
                              ₹{payment.amount.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-400">—</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-medium text-slate-800">
                              {payment.paymentMethod === "CASH" ? "Cash on Hand" : "Bank Current Account"}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-400">—</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-800 font-mono">
                              ₹{payment.amount.toFixed(2)}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ROW 5: VERIFICATION COMPLIANCE NOTICE */}
            <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Official Settlement Verification</h4>
              </div>
              <p className="text-xs text-slate-500 mt-1 ml-10">
                Official GST payment voucher recorded into double-entry accounting ledgers. All transaction audit entries permanently timestamped for GST compliance.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
