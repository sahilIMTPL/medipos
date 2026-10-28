"use client";

import React, { useState, useEffect } from "react";
import { api, AccountItem, JournalItemDto, JournalEntryDto } from "@/lib/api";

// ----------------------------------------------------
// 1. Edit Account Modal
// ----------------------------------------------------
interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: AccountItem | null;
  onSuccess: () => void;
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({ isOpen, onClose, account, onSuccess }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setDescription(account.description || "");
      setCurrentBalance(account.currentBalance || 0);
      setIsActive(account.isActive);
      setError(null);
    }
  }, [account, isOpen]);

  if (!isOpen || !account) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.updateAccount(account.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        currentBalance: Number(currentBalance),
        isActive,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Edit Account: {account.code}</h3>
            <p className="text-xs text-slate-500">Category: {account.type}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
          {error && <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-700">{error}</div>}

          <div>
            <label className="block font-medium text-slate-700 mb-1">Account Code</label>
            <input
              type="text"
              value={account.code}
              disabled
              className="w-full px-3 py-2 border border-slate-200 rounded bg-slate-100 text-slate-500 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Account Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded text-slate-800 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Description / Notes</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded text-slate-800 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Calibrate Balance (₹)</label>
              <input
                type="number"
                step="0.01"
                value={currentBalance}
                onChange={(e) => setCurrentBalance(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded text-slate-800 focus:ring-1 focus:ring-indigo-500 font-bold"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Status</label>
              <select
                value={isActive ? "ACTIVE" : "ARCHIVED"}
                onChange={(e) => setIsActive(e.target.value === "ACTIVE")}
                className="w-full px-3 py-2 border border-slate-300 rounded bg-white text-slate-800"
              >
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived / Inactive</option>
              </select>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded p-2 text-[11px] text-amber-800">
            ℹ <strong>Audit Trail:</strong> Any changes made here are logged with timestamps and previous values in Change Logs.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3 py-2 font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 2. Edit Journal Modal
// ----------------------------------------------------
interface EditJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  journal: JournalItemDto | null;
  accounts: AccountItem[];
  onSuccess: () => void;
}

export const EditJournalModal: React.FC<EditJournalModalProps> = ({ isOpen, onClose, journal, accounts, onSuccess }) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [defaultAccountId, setDefaultAccountId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (journal) {
      setName(journal.name);
      setCode(journal.code);
      setDefaultAccountId("");
      setError(null);
    }
  }, [journal, isOpen]);

  if (!isOpen || !journal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.updateJournal(journal.id, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        defaultAccountId: defaultAccountId || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update journal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Edit Journal: {journal.code}</h3>
            <p className="text-xs text-slate-500">Type: {journal.type}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
          {error && <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-700">{error}</div>}

          <div>
            <label className="block font-medium text-slate-700 mb-1">Journal Short Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded text-slate-800 font-mono font-bold focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Journal Title / Description</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded text-slate-800 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Default Chart Account</label>
            <select
              value={defaultAccountId}
              onChange={(e) => setDefaultAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded bg-white text-slate-800"
            >
              <option value="">Keep current default ({journal.defaultAccount || "Auto"})</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} - {a.name} ({a.type})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3 py-2 font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Journal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 3. Edit Journal Entry Modal
// ----------------------------------------------------
interface EditJournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: JournalEntryDto | any | null;
  onSuccess: () => void;
}

export const EditJournalEntryModal: React.FC<EditJournalEntryModalProps> = ({ isOpen, onClose, entry, onSuccess }) => {
  const [reference, setReference] = useState("");
  const [narration, setNarration] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("POSTED");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entry) {
      setReference(entry.reference || "");
      setNarration(entry.notes || "");
      setDate(entry.date || "");
      setStatus(entry.state || "POSTED");
      setError(null);
    }
  }, [entry, isOpen]);

  if (!isOpen || !entry) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.updateJournalEntry(entry.id, {
        reference: reference.trim() || undefined,
        narration: narration.trim() || undefined,
        date: date || undefined,
        status,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update entry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Edit Entry: {entry.entryNumber}</h3>
            <p className="text-xs text-slate-500">Journal: {entry.journalName || entry.journalCode}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
          {error && <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-700">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Voucher Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded text-slate-800"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">State / Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded bg-white text-slate-800 font-semibold"
              >
                <option value="POSTED">POSTED</option>
                <option value="DRAFT">DRAFT</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Reference Voucher / Bill #</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-slate-800"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Narration / Memo</label>
            <textarea
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded text-slate-800"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3 py-2 font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Voucher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 4. Edit Payment Modal (Customer / Vendor)
// ----------------------------------------------------
interface EditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: {
    id: string;
    type: "CUSTOMER" | "VENDOR";
    amount: number;
    paymentMethod: string;
    date: string;
    ref?: string;
    notes?: string;
    targetName?: string;
  } | null;
  onSuccess: () => void;
}

export const EditPaymentModal: React.FC<EditPaymentModalProps> = ({ isOpen, onClose, payment, onSuccess }) => {
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentDate, setPaymentDate] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (payment) {
      setAmount(payment.amount);
      setPaymentMethod(payment.paymentMethod);
      setPaymentDate(payment.date);
      setReferenceNumber(payment.ref || "");
      setNotes(payment.notes || "");
      setError(null);
    }
  }, [payment, isOpen]);

  if (!isOpen || !payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError("Payment amount must be greater than zero.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.updatePayment(payment.id, {
        paymentType: payment.type,
        amount,
        paymentMethod,
        paymentDate,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">
              Edit {payment.type === "CUSTOMER" ? "Customer Receipt" : "Vendor Payment"}
            </h3>
            <p className="text-xs text-slate-500">{payment.targetName || "Payment Record"}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
          {error && <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-700">{error}</div>}

          <div>
            <label className="block font-medium text-slate-700 mb-1">Payment Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded text-slate-800 font-bold focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Adjusting this amount automatically updates the related invoice/bill balance and partner ledger.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Payment Mode</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded bg-white text-slate-800"
              >
                <option value="UPI">UPI / Digital</option>
                <option value="CASH">Cash on Hand</option>
                <option value="CARD">Card Terminal</option>
                <option value="CREDIT">Store Credit</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Reference / UTR / Cheque #</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-slate-800"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Notes / Remarks</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-slate-800"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3 py-2 font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm disabled:opacity-50"
            >
              {loading ? "Saving..." : "Update Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
