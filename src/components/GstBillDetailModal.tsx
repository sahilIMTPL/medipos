"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Printer,
  Receipt,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  FileText,
  Calculator,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  Store,
} from "lucide-react";
import { purchasesApi, PurchaseItemDetail } from "@/lib/api";
import { triggerPrint } from "@/lib/print";
import PaymentVoucherModal from "./PaymentVoucherModal";
import { ModalDetailSkeleton, StatusBadge } from "./common";

interface GstBillDetailModalProps {
  billId: string | null;
  onClose: () => void;
  onPayBill?: (bill: any) => void;
}

export default function GstBillDetailModal({
  billId,
  onClose,
  onPayBill,
}: GstBillDetailModalProps) {
  const [bill, setBill] = useState<PurchaseItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentVoucherId, setSelectedPaymentVoucherId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!billId) return;
    setLoading(true);
    purchasesApi
      .getPurchaseById(billId)
      .then((data) => {
        if (data.purchase) setBill(data.purchase);
      })
      .catch((err) => console.error("Failed to load bill details:", err))
      .finally(() => setLoading(false));
  }, [billId]);

  // Reset scroll position to top whenever a bill is loaded
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [billId, bill]);

  if (!billId) return null;

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

  // Convert amount to Indian English Words
  function numberToIndianWords(num: number): string {
    const a = [
      "",
      "One ",
      "Two ",
      "Three ",
      "Four ",
      "Five ",
      "Six ",
      "Seven ",
      "Eight ",
      "Nine ",
      "Ten ",
      "Eleven ",
      "Twelve ",
      "Thirteen ",
      "Fourteen ",
      "Fifteen ",
      "Sixteen ",
      "Seventeen ",
      "Eighteen ",
      "Nineteen ",
    ];
    const b = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];
    const n = Math.floor(Math.abs(num));
    const paise = Math.round((Math.abs(num) - n) * 100);

    if (n === 0 && paise === 0) return "Zero Rupees Only";

    function convertTwoDigits(val: number): string {
      if (val < 20) return a[val];
      return b[Math.floor(val / 10)] + (val % 10 !== 0 ? " " + a[val % 10] : " ");
    }

    let words = "";
    let rem = n;

    if (rem >= 10000000) {
      words += convertTwoDigits(Math.floor(rem / 10000000)) + "Crore ";
      rem %= 10000000;
    }
    if (rem >= 100000) {
      words += convertTwoDigits(Math.floor(rem / 100000)) + "Lakh ";
      rem %= 100000;
    }
    if (rem >= 1000) {
      words += convertTwoDigits(Math.floor(rem / 1000)) + "Thousand ";
      rem %= 1000;
    }
    if (rem >= 100) {
      words += convertTwoDigits(Math.floor(rem / 100)) + "Hundred ";
      rem %= 100;
    }
    if (rem > 0) {
      words += convertTwoDigits(rem);
    }

    let res = words.trim() + " Rupees";
    if (paise > 0) {
      res += " and " + convertTwoDigits(paise).trim() + " Paise";
    }
    return res + " Only";
  }

  const totalAmount = bill ? Number(bill.totalAmount) : 0;
  const paidAmount = bill ? Number(bill.paidAmount) : 0;
  const balanceDue = Number((totalAmount - paidAmount).toFixed(2));
  const isFullyPaid = balanceDue <= 0.01;
  const isPartiallyPaid = !isFullyPaid && paidAmount > 0;
  const isUnpaid = paidAmount <= 0;
  const firstPaymentId = bill?.payments && bill.payments.length > 0 ? bill.payments[0].id : null;
  const subtotal = bill ? Number(bill.subtotal) : 0;
  const taxTotal = bill ? Number(bill.taxTotal) : 0;
  const cgstAmount = Number((taxTotal / 2).toFixed(2));
  const sgstAmount = Number((taxTotal / 2).toFixed(2));

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
                  {bill?.invoiceNumber || "PUR-00046"}
                </h2>

                {/* Status Badge */}
                <StatusBadge
                  status={isFullyPaid ? "FULLY_PAID" : isPartiallyPaid ? "PARTIALLY_PAID" : "UNPAID"}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                GST Registered Vendor Bill & Goods Receipt Note (GRN)
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

            {balanceDue > 0.01 && onPayBill && bill && (
              <button
                type="button"
                onClick={() => onPayBill(bill)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-2xs"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay ₹{balanceDue.toFixed(2)}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => triggerPrint("printable-area")}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print Bill</span>
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
        ) : !bill ? (
          <div className="p-12 text-center text-slate-500 text-xs">Vendor bill record not found.</div>
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
                  GST Purchase Bill &amp; Goods Receipt Note (GRN)
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Official Commercial Tax Voucher • Original for Records
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold font-mono text-slate-900">
                  {bill.invoiceNumber || "PUR-00046"}
                </div>
                <div className="text-xs text-slate-500">
                  Bill Date: {bill.invoiceDate ? formatDate(bill.invoiceDate) : "—"}
                </div>
                <div className="text-[11px] font-semibold text-emerald-700">
                  {isFullyPaid ? "STATUS: FULLY PAID" : isPartiallyPaid ? "STATUS: PARTIALLY PAID" : "STATUS: UNPAID"}
                </div>
              </div>
            </div>
            {/* ROW 1: CONSIGNEE & VENDOR CARDS (2 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Billed To (Consignee) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Store className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-400">Billed To (Consignee)</div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    {bill.store?.name || "City Medical Store"}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{bill.store?.address || "123 Main Street, Navrangpura"}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="px-3 py-1 rounded-lg border border-slate-200 text-[11px] font-mono text-slate-700 bg-white shadow-2xs">
                      GSTIN: {bill.store?.gstin || "24AAAAA0000A1Z5"}
                    </span>
                    <span className="px-3 py-1 rounded-lg border border-slate-200 text-[11px] font-mono text-slate-700 bg-white shadow-2xs">
                      DL No: {bill.store?.drugLicenseNo || "GJ-AHM-2024-DL-1842"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Billed By (Vendor / Supplier) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Truck className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-400">Billed By (Vendor / Supplier)</div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    {bill.supplier?.businessName || bill.supplierName || "ABC Pharma Distributors"}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                    {(bill.supplier?.phone || bill.supplierPhone) && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>{bill.supplier?.phone || bill.supplierPhone}</span>
                      </div>
                    )}
                    {(bill.supplier?.email || "orders@abcpharma.com") && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>{bill.supplier?.email || "orders@abcpharma.com"}</span>
                      </div>
                    )}
                  </div>
                  {(bill.supplier?.gstin || bill.supplierGstin) && (
                    <div className="mt-2">
                      <span className="px-3 py-1 rounded-lg border border-slate-200 text-[11px] font-mono text-slate-700 bg-white shadow-2xs inline-block">
                        Supplier GSTIN: {bill.supplier?.gstin || bill.supplierGstin}
                      </span>
                    </div>
                  )}
                  {(bill.supplier?.address || "Naroda GIDC, Ahmedabad") && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{bill.supplier?.address || "Naroda GIDC, Ahmedabad"}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ROW 2: METADATA 4-COLUMN STRIP */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                <div className="pr-4">
                  <span className="text-xs font-medium text-slate-400 block">Supplier Invoice #</span>
                  <span className="text-xs font-bold text-slate-900 mt-1 block">
                    {bill.supplierInvoiceNumber || bill.invoiceNumber || "SUPP-8922"}
                  </span>
                </div>
                <div className="md:px-4 pt-3 md:pt-0">
                  <span className="text-xs font-medium text-slate-400 block">Bill Date</span>
                  <span className="text-xs font-bold text-slate-900 mt-1 block">
                    {formatDate(bill.invoiceDate)}
                  </span>
                </div>
                <div className="md:px-4 pt-3 md:pt-0">
                  <span className="text-xs font-medium text-slate-400 block">Reference #</span>
                  <span className="text-xs font-bold text-slate-900 mt-1 block">
                    {bill.invoiceNumber || "PUR-00046"}
                  </span>
                </div>
                <div className="md:pl-4 pt-3 md:pt-0">
                  <span className="text-xs font-medium text-slate-400 block">Items</span>
                  <span className="text-xs font-bold text-slate-900 mt-1 block">
                    {bill.items?.length || 0}
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
                      <th className="py-3 px-4 text-center min-w-[90px]">Pack Qty</th>
                      <th className="py-3 px-4 text-center min-w-[80px]">Unit</th>
                      <th className="py-3 px-4 text-right min-w-[100px]">Rate (₹)</th>
                      <th className="py-3 px-4 text-right min-w-[80px]">GST%</th>
                      <th className="py-3 px-4 text-right min-w-[120px]">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bill.items?.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 text-center text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-xs">
                            {item.productName}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            {item.genericName || "Standard Pack"}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {item.batchNumber || "—"}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {formatExpiry(item.expiryDate)}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-700 font-medium">
                          {Number(item.purchaseQty)}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600">
                          {item.unit || "Strip"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">
                          {Number(item.unitRate).toFixed(2)}
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

            {/* ROW 4: ITC AND BILL SUMMARY (2 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Input Tax Credit (ITC) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Input Tax Credit (ITC)</h4>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Subtotal (Taxable Value)</span>
                    <span className="font-mono font-semibold text-slate-900">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>CGST (6%)</span>
                    <span className="font-mono font-semibold text-slate-900">₹{cgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>SGST (6%)</span>
                    <span className="font-mono font-semibold text-slate-900">₹{sgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 flex justify-between items-center text-emerald-800 font-bold">
                    <span>Total Input GST</span>
                    <span className="font-mono text-sm">₹{taxTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Bill Summary */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Bill Summary</h4>
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
                    <span className="font-bold text-sm">Total Bill Amount</span>
                    <span className="font-mono font-black text-lg">
                      ₹{totalAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Paid to Vendor</span>
                    <span className="font-mono font-bold text-emerald-600">
                      ₹{paidAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Balance Payable</span>
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

            {/* ROW 5: SETTLEMENT DISBURSEMENTS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Settlement Disbursements</h4>
              </div>

              {bill.payments && bill.payments.length > 0 ? (
                <div className="space-y-2">
                  {bill.payments.map((p, pIdx) => {
                    const voucherNo =
                      p.voucherNumber || p.receiptNumber || `VCH-${p.id.slice(0, 8).toUpperCase()}`;
                    const payMethod = p.paymentMethod || "UPI";

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
                                {voucherNo}
                              </span>
                              <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {payMethod}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Disbursed on {formatDate(p.date)} • Ref: {bill.invoiceNumber}
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
                              Disbursed
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
                          {bill.invoiceNumber}
                        </span>
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          PAID
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Disbursed on {formatDate(bill.invoiceDate)} • Ref: {bill.invoiceNumber}
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
                      Disbursed
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                  No settlement disbursements recorded for this vendor bill yet.
                </div>
              )}
            </div>

            {/* ROW 6: GOODS RECEIVING NOTE (GRN) */}
            <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Goods Receiving Note (GRN)</h4>
              </div>
              <p className="text-xs text-slate-500 mt-1 ml-10">
                All medicines inspected against physical damage, batch discrepancies, and expiry dates. Batch records verified for pharmacy inventory database entry.
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
