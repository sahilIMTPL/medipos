"use client";

import React, { useState } from "react";
import { X, Save, AlertCircle, RefreshCw, Truck } from "lucide-react";
import { api, SupplierItem } from "@/lib/api";

interface AddEditSupplierModalProps {
  supplierToEdit?: SupplierItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddEditSupplierModal({
  supplierToEdit,
  onClose,
  onSuccess,
}: AddEditSupplierModalProps) {
  const isEditMode = Boolean(supplierToEdit);

  const [businessName, setBusinessName] = useState(supplierToEdit?.businessName || "");
  const [contactPerson, setContactPerson] = useState(supplierToEdit?.contactPerson || "");
  const [phone, setPhone] = useState(supplierToEdit?.phone || "");
  const [email, setEmail] = useState(supplierToEdit?.email || "");
  const [address, setAddress] = useState(supplierToEdit?.address || "");
  const [gstin, setGstin] = useState(supplierToEdit?.gstin || "");
  const [paymentTerms, setPaymentTerms] = useState(supplierToEdit?.paymentTerms || "Net 30");
  const [openingBalance, setOpeningBalance] = useState(
    supplierToEdit?.openingBalance !== undefined ? supplierToEdit.openingBalance : 0
  );
  const [isActive, setIsActive] = useState(
    supplierToEdit?.isActive !== undefined ? supplierToEdit.isActive : true
  );

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setErrorMsg("Please enter the supplier name");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      if (isEditMode && supplierToEdit) {
        await api.updateSupplier(supplierToEdit.id, {
          businessName: businessName.trim(),
          contactPerson: contactPerson.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          gstin: gstin.trim() || undefined,
          paymentTerms: paymentTerms.trim(),
          isActive,
        });
      } else {
        await api.createSupplier({
          businessName: businessName.trim(),
          contactPerson: contactPerson.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          gstin: gstin.trim() || undefined,
          paymentTerms: paymentTerms.trim(),
          openingBalance: Number(openingBalance || 0),
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save supplier");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg text-slate-900 leading-tight">
              {isEditMode ? "Edit Supplier" : "Add Supplier"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter supplier and contact details
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supplier / Company Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ABC Pharma Distributors"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                placeholder="e.g. Rajesh Kumar"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="orders@supplier.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GSTIN
              </label>
              <input
                type="text"
                placeholder="e.g. 24AABCA1234F1Z8"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm font-mono uppercase text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Address
            </label>
            <textarea
              rows={2}
              placeholder="City, State"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-sm shadow-indigo-600/20 flex items-center gap-2 transition cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{isEditMode ? "Save Changes" : "Save Supplier"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
