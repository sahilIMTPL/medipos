"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface RegisterPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "CUSTOMER_INVOICE" | "VENDOR_BILL";
  invoiceId: string;
  invoiceNumber: string;
  partnerName: string;
  partnerId?: string;
  grandTotal: number;
  paidAmount: number;
  remainingDue: number;
  onPaymentSuccess: () => void;
}

export const RegisterPaymentModal: React.FC<RegisterPaymentModalProps> = ({
  isOpen,
  onClose,
  type,
  invoiceId,
  invoiceNumber,
  partnerName,
  partnerId,
  grandTotal,
  paidAmount,
  remainingDue,
  onPaymentSuccess,
}) => {
  const [amount, setAmount] = useState<number>(remainingDue);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD" | "CREDIT">("UPI");
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string>("");

  useEffect(() => {
    if (isOpen) {
      idempotencyKeyRef.current = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `pay-${Date.now()}`;
      setAmount(Math.max(0, Number(remainingDue.toFixed(2))));
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setReferenceNumber("");
      setNotes(
        type === "CUSTOMER_INVOICE"
          ? `Receipt for Invoice #${invoiceNumber}`
          : `Disbursement for Bill #${invoiceNumber}`
      );
      setError(null);
    }
  }, [isOpen, remainingDue, invoiceNumber, type]);

  if (!isOpen) return null;

  const remainingAfterPayment = Math.max(0, Number((remainingDue - amount).toFixed(2)));
  const willBePaidInFull = amount >= remainingDue - 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent concurrent submissions
    if (amount <= 0) {
      setError("Payment amount must be greater than zero.");
      return;
    }
    if (amount > remainingDue + 0.05) {
      setError(`Payment cannot exceed outstanding balance of ₹${remainingDue.toFixed(2)}.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (type === "CUSTOMER_INVOICE") {
        await api.registerCustomerPayment(
          {
            salesInvoiceId: invoiceId,
            amount,
            paymentMethod,
            paymentDate,
            referenceNumber: referenceNumber.trim() || undefined,
            notes: notes.trim() || undefined,
          },
          idempotencyKeyRef.current
        );
      } else {
        const effectivePartnerId = partnerId?.trim() || "";
        const effectiveInvoiceId = invoiceId?.trim() || "";

        if (!effectivePartnerId && !effectiveInvoiceId) {
          throw new Error("Vendor or Bill identifier is missing. Please select a valid vendor bill to record payment.");
        }

        await api.registerVendorPayment(
          {
            supplierId: effectivePartnerId,
            purchaseInvoiceId: effectiveInvoiceId || undefined,
            amount,
            paymentMethod,
            paymentDate,
            referenceNumber: referenceNumber.trim() || undefined,
            notes: notes.trim() || undefined,
          },
          idempotencyKeyRef.current
        );
      }

      onPaymentSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to register payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Register Payment
            </h3>
            <p className="text-xs text-slate-500">
              {type === "CUSTOMER_INVOICE" ? "Customer Invoice" : "Vendor Bill"}:{" "}
              <span className="font-medium text-slate-700">{invoiceNumber}</span> • {partnerName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded p-1 hover:bg-slate-200 text-sm leading-none"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* Balance Overview Card */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200 rounded p-2 text-center text-xs">
            <div>
              <div className="text-slate-500 text-[11px]">Total Bill</div>
              <div className="font-semibold text-slate-800">₹{grandTotal.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[11px]">Already Paid</div>
              <div className="font-medium text-emerald-600">₹{paidAmount.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[11px]">Balance Due</div>
              <div className="font-bold text-rose-600">₹{remainingDue.toFixed(2)}</div>
            </div>
          </div>

          {/* Amount Input & Quick Fill */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700">Payment Amount (₹)</label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setAmount(Number(remainingDue.toFixed(2)))}
                  className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300"
                >
                  Pay Full (₹{remainingDue.toFixed(2)})
                </button>
                <button
                  type="button"
                  onClick={() => setAmount(Number((remainingDue / 2).toFixed(2)))}
                  className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300"
                >
                  50% (₹{(remainingDue / 2).toFixed(2)})
                </button>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-sm">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={remainingDue}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                className="w-full pl-7 pr-3 py-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-slate-800"
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">
                Remaining after payment:{" "}
                <span className={remainingAfterPayment === 0 ? "text-emerald-600 font-semibold" : "text-amber-600 font-medium"}>
                  ₹{remainingAfterPayment.toFixed(2)}
                </span>
              </span>
              <span
                className={`px-1 rounded text-[10px] font-semibold uppercase ${willBePaidInFull ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}
              >
                {willBePaidInFull ? "Status: PAID" : "Status: PARTIAL"}
              </span>
            </div>
          </div>

          {/* Payment Method / Journal & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Journal / Mode</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="UPI">Bank & Digital (UPI)</option>
                <option value="CASH">Cash on Hand (CSH)</option>
                <option value="CARD">Card POS Terminal</option>
                <option value="CREDIT">Store Credit / Note</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded text-slate-800 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Reference / UTR & Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Reference / UTR / Cheque #
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. UPI-98421038 / CHQ-104"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded text-slate-800 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Internal Note / Memo</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Remarks for General Ledger"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded text-slate-800 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Double-Entry Note */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded p-2 text-[11px] text-indigo-900 flex items-start gap-2">
            <span className="text-indigo-600 font-bold">ℹ</span>
            <span>
              <strong>Double-Entry Posting:</strong> This payment automatically creates a balanced debit/credit
              entry in the General Ledger and posts directly to the {type === "CUSTOMER_INVOICE" ? "Customer" : "Vendor"} Partner Ledger.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || amount <= 0}
              className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {loading && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>{loading ? "Registering..." : `Confirm Payment of ₹${amount.toFixed(2)}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
