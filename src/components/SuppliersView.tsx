"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  Search,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  AlertCircle,
  CreditCard,
  DollarSign,
  Building,
} from "lucide-react";
import { api, SupplierItem } from "@/lib/api";
import AddEditSupplierModal from "./AddEditSupplierModal";
import SupplierDetailsModal from "./SupplierDetailsModal";
import { useStore } from "@/context/StoreContext";

export default function SuppliersView() {
  const { currentStore } = useStore();
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<SupplierItem | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const data = await api.getSuppliers({
        q: searchQuery || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        storeId: currentStore?.id || undefined,
      });
      if (data.suppliers) {
        setSuppliers(data.suppliers);
      }
    } catch (err) {
      console.error("Failed to load suppliers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [statusFilter, currentStore?.id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadSuppliers();
  };

  const handleDelete = async (supplier: SupplierItem) => {
    if (
      !confirm(
        `Are you sure you want to deactivate or delete "${supplier.businessName}"? Historical records will be retained.`
      )
    ) {
      return;
    }

    try {
      await api.deleteSupplier(supplier.id);
      await loadSuppliers();
    } catch (err: any) {
      alert(err.message || "Could not delete supplier");
    }
  };

  // KPI calculations
  const totalSuppliersCount = suppliers.length;
  const totalBalanceDue = suppliers.reduce((sum, s) => sum + Number(s.currentBalance || 0), 0);
  const totalPurchasesVolume = suppliers.reduce((sum, s) => sum + Number(s.totalPurchases || 0), 0);
  const activeCount = suppliers.filter((s) => s.isActive).length;

  return (
    <div className="p-4 max-w-[1600px] mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Suppliers</h1>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700">
              {totalSuppliersCount} vendors
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Manage medicine distributors and suppliers</p>
        </div>

        <button
          onClick={() => {
            setSupplierToEdit(null);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-2xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Vendors</span>
            <Building className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{totalSuppliersCount}</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Balance Due</span>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </div>
          <div
            className={`text-xl font-bold ${
              totalBalanceDue > 0 ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            ₹{totalBalanceDue.toFixed(2)}
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Purchases</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            ₹{totalPurchasesVolume.toFixed(2)}
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Vendors</span>
            <CreditCard className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{activeCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search supplier by name, phone, GSTIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <button
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("ALL");
              loadSuppliers();
            }}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition"
            title="Reset Filters & Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs min-w-[1180px] whitespace-nowrap">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4 min-w-[250px]">Business Name</th>
                <th className="py-3 px-4 min-w-[190px]">Contact &amp; Phone</th>
                <th className="py-3 px-4 min-w-[170px]">GSTIN / DL</th>
                <th className="py-3 px-4 min-w-[130px]">Payment Terms</th>
                <th className="py-3 px-4 text-center min-w-[90px]">Invoices</th>
                <th className="py-3 px-4 text-right min-w-[130px]">Balance Due</th>
                <th className="py-3 px-4 text-center min-w-[110px]">Status</th>
                <th className="py-3 px-4 text-center min-w-[110px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading suppliers...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                    <Truck className="h-6 w-6 mx-auto mb-2 text-slate-300" />
                    No suppliers found matching your query.
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-slate-50/80 transition group">
                    <td className="px-3 py-2 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                          <Truck className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{supplier.businessName}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            {supplier.address || "No address"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-2 text-slate-700">
                      <div className="font-medium text-slate-900">
                        {supplier.contactPerson || "—"}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {supplier.phone || "—"}
                      </div>
                    </td>

                    <td className="px-3 py-2">
                      <div className="font-mono font-medium text-slate-800 text-[11px]">
                        {supplier.gstin || "Unregistered"}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        DL: {supplier.drugLicenseNo || "N/A"}
                      </div>
                    </td>

                    <td className="px-3 py-2">
                      <span className="inline-block px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">
                        {supplier.paymentTerms || "Net 30"}
                      </span>
                    </td>

                    <td className="px-3 py-2 text-center">
                      <span className="inline-block px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200">
                        {supplier.invoiceCount} bills
                      </span>
                    </td>

                    <td className="px-5 py-3 text-right">
                      <div
                        className={`font-bold ${
                          supplier.currentBalance > 0 ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        ₹{Number(supplier.currentBalance).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Purchased: ₹{supplier.totalPurchases.toFixed(0)}
                      </div>
                    </td>

                    <td className="px-5 py-3 text-center">
                      {supplier.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold text-[11px] border border-slate-200">
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedSupplierId(supplier.id)}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          title="View Invoices and Ledger"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSupplierToEdit(supplier);
                            setIsAddModalOpen(true);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
                          title="Edit Supplier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Deactivate Supplier"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <AddEditSupplierModal
          supplierToEdit={supplierToEdit}
          onClose={() => {
            setIsAddModalOpen(false);
            setSupplierToEdit(null);
          }}
          onSuccess={() => {
            loadSuppliers();
          }}
        />
      )}

      {/* Details & Ledger Modal */}
      {selectedSupplierId && (
        <SupplierDetailsModal
          supplierId={selectedSupplierId}
          onClose={() => setSelectedSupplierId(null)}
          onRefreshList={() => loadSuppliers()}
        />
      )}
    </div>
  );
}
