"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Printer,
  FileText,
  CheckCircle2,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Barcode,
  RefreshCw,
  QrCode,
  Cloud,
  Check,
  MessageSquare,
  Send,
} from "lucide-react";
import { api, SalesInvoicePrintDetail } from "@/lib/api";
import { triggerPrint } from "@/lib/print";

interface SalesInvoiceModalProps {
  invoiceId: string | null;
  onClose: () => void;
}

export default function SalesInvoiceModal({ invoiceId, onClose }: SalesInvoiceModalProps) {
  const [invoice, setInvoice] = useState<SalesInvoicePrintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [format, setFormat] = useState<"thermal" | "a4">("thermal");
  const [pushingDigi, setPushingDigi] = useState(false);
  const [digiSuccessMsg, setDigiSuccessMsg] = useState<string | null>(null);
  const [digiDocUri, setDigiDocUri] = useState<string | null>(null);
  const [citizenId, setCitizenId] = useState("");
  const [showDigiInput, setShowDigiInput] = useState(false);

  useEffect(() => {
    if (!invoiceId) return;
    setLoading(true);
    api
      .getSaleById(invoiceId)
      .then((data) => {
        if (data.invoice) setInvoice(data.invoice);
      })
      .catch((err) => console.error("Failed to load invoice receipt", err))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  if (!invoiceId) return null;

  const handlePrint = () => {
    triggerPrint("printable-area");
  };

  const handlePushToDigiLocker = async () => {
    if (!invoiceId) return;
    setPushingDigi(true);
    setDigiSuccessMsg(null);
    try {
      const res = await api.pushInvoice(invoiceId);
      if (res.success) {
        setDigiSuccessMsg("Receipt successfully deposited into citizen DigiLocker vault!");
        setDigiDocUri(res.receipt.digilockerUri);
        setShowDigiInput(false);
      } else {
        alert("Failed to push to DigiLocker");
      }
    } catch (err: any) {
      alert(err.message || "DigiLocker service unreachable");
    } finally {
      setPushingDigi(false);
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-white text-slate-900 flex items-center justify-between flex-shrink-0 border-b border-slate-100 no-print print:hidden">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg leading-tight text-slate-900">
                  {invoice?.invoiceNumber || "Invoice Receipt"}
                </h2>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded border border-emerald-200">
                  {invoice?.paymentStatus || "PAID"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Pharmacy Tax Invoice • {invoice ? formatDate(invoice.invoiceDate) : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex text-xs">
              <button
                type="button"
                onClick={() => setFormat("thermal")}
                className={`px-3 py-1 rounded font-medium transition cursor-pointer ${
                  format === "thermal" ? "bg-white text-slate-900 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                80mm Thermal
              </button>
              <button
                type="button"
                onClick={() => setFormat("a4")}
                className={`px-3 py-1 rounded font-medium transition cursor-pointer ${
                  format === "a4" ? "bg-white text-slate-900 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                A4 Standard
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition ml-2 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Receipt View */}
        {loading ? (
          <div className="p-16 text-center text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-600" />
            Generating tax receipt...
          </div>
        ) : !invoice ? (
          <div className="p-12 text-center text-slate-500">Invoice not found.</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center">
            {/* Thermal Slip Layout (80mm style) */}
            <div
              id="printable-area"
              data-format={format}
              className={`bg-white p-6 shadow-md border border-slate-300 rounded-lg text-slate-800 font-sans print:p-0 print:border-none print:shadow-none ${
                format === "thermal" ? "w-[380px] thermal-receipt" : "w-full max-w-2xl"
              }`}
            >
              {/* Store Branding Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-300 space-y-1">
                <h1 className="font-extrabold text-base uppercase tracking-tight text-slate-900">
                  {invoice.store.name}
                </h1>
                <p className="text-[11px] text-slate-600">
                  {invoice.store.address}, {invoice.store.city}
                </p>
                <p className="text-[11px] text-slate-600">Ph: {invoice.store.phone}</p>
                <div className="text-[10px] font-mono text-slate-500 flex justify-center gap-3 pt-1">
                  <span>GSTIN: {invoice.store.gstin}</span>
                  <span>DL: {invoice.store.drugLicenseNo}</span>
                </div>
              </div>

              {/* Invoice Meta */}
              <div className="py-3 border-b border-dashed border-slate-300 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Invoice No:</span>
                  <span className="font-mono font-bold text-slate-900">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Date & Time:</span>
                  <span className="font-medium text-slate-800">{formatDate(invoice.invoiceDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Patient / Customer:</span>
                  <span className="font-semibold text-slate-900">
                    {invoice.customer.name} {invoice.customer.phone ? `(${invoice.customer.phone})` : ""}
                  </span>
                </div>
                {invoice.prescription?.doctorName && (
                  <div className="flex justify-between text-indigo-900 bg-indigo-50/60 px-2 py-1 rounded">
                    <span className="font-medium">Prescribed By:</span>
                    <span className="font-bold">
                      Dr. {invoice.prescription.doctorName}{" "}
                      {invoice.prescription.doctorRegNo ? `[${invoice.prescription.doctorRegNo}]` : ""}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Cashier:</span>
                  <span className="text-slate-700">{invoice.cashier}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-3 border-b border-dashed border-slate-300 overflow-x-auto scrollbar-thin">
                <table className="w-full text-left text-xs min-w-[320px]">
                  <thead>
                    <tr className="border-b border-slate-300 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="pb-1">Item</th>
                      <th className="pb-1 text-center">Batch/Exp</th>
                      <th className="pb-1 text-center">Qty</th>
                      <th className="pb-1 text-right">MRP</th>
                      <th className="pb-1 text-right">Amt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.items.map((it) => (
                      <tr key={it.id} className="py-2">
                        <td className="py-2 pr-1">
                          <div className="font-bold text-slate-900 text-xs">{it.productName}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                            {it.genericName || it.packDescription}
                          </div>
                        </td>
                        <td className="py-2 text-center font-mono text-[10px] text-slate-600">
                          <div>{it.batchNumber}</div>
                          <div className="text-slate-400">{it.expiryDate}</div>
                        </td>
                        <td className="py-2 text-center font-bold text-slate-900 text-xs">
                          {it.quantity} {it.unit}
                        </td>
                        <td className="py-2 text-right text-slate-600 text-xs">
                          ₹{it.unitPrice.toFixed(2)}
                        </td>
                        <td className="py-2 text-right font-bold text-slate-900 text-xs">
                          ₹{it.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="py-3 border-b border-dashed border-slate-300 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Subtotal:</span>
                  <span className="font-semibold">₹{invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount Savings:</span>
                    <span className="font-semibold">-₹{invoice.discountTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>CGST (Intra-state):</span>
                  <span className="font-semibold">₹{invoice.cgstTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>SGST (Intra-state):</span>
                  <span className="font-semibold">₹{invoice.sgstTotal.toFixed(2)}</span>
                </div>

                <div className="pt-2 border-t border-slate-400 flex justify-between text-base font-extrabold text-slate-900">
                  <span>NET PAYABLE:</span>
                  <span className="text-indigo-600">₹{invoice.grandTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between pt-1 text-slate-700">
                  <span>Payment Mode:</span>
                  <span className="font-bold uppercase">{invoice.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Amount Received:</span>
                  <span className="font-semibold">₹{invoice.paidAmount.toFixed(2)}</span>
                </div>
                {invoice.changeAmount > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Change Returned:</span>
                    <span className="font-semibold">₹{invoice.changeAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Receipt Footer */}
              <div className="pt-4 text-center text-[10px] text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">
                  *** Thank You For Visiting MediPOS Pharmacy ***
                </p>
                <p>Medicines once sold can only be returned with original bill within 7 days.</p>
                <p className="pt-1 text-[9px] text-slate-400 font-mono">
                  Software: MediPOS Medical Retail v1.0 • All Prices Inclusive of GST
                </p>
              </div>
            </div>
          </div>
        )}

        {/* DigiLocker Confirmation Banner */}
        {digiSuccessMsg && (
          <div className="mx-6 my-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-bold">{digiSuccessMsg}</span>
                {digiDocUri && <span className="block font-mono text-[10px] text-emerald-700">URI: {digiDocUri}</span>}
              </div>
            </div>
            <span className="text-[10px] bg-emerald-100 font-bold px-2 py-1 rounded text-emerald-700">DigiLocker Pushed</span>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0 no-print print:hidden">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition"
            >
              Close
            </button>

            {!showDigiInput && !digiSuccessMsg && (
              <button
                type="button"
                onClick={() => setShowDigiInput(true)}
                className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg shadow-2xs transition flex items-center gap-2 cursor-pointer"
              >
                <Cloud className="h-4 w-4 text-indigo-600" />
                <span>Push to DigiLocker</span>
              </button>
            )}

            {showDigiInput && (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Citizen Aadhaar / ABHA ID"
                  value={citizenId}
                  onChange={(e) => setCitizenId(e.target.value)}
                  className="px-2 py-2 text-xs border border-slate-200 rounded-lg font-mono w-44 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handlePushToDigiLocker}
                  disabled={pushingDigi}
                  className="px-3 py-2 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-700 transition cursor-pointer disabled:opacity-50"
                >
                  {pushingDigi ? "Sending..." : "Send"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDigiInput(false)}
                  className="px-2 py-2 text-xs text-slate-500 hover:text-slate-800"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm shadow-indigo-950/20 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
