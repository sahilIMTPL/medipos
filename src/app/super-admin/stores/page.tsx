"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Edit2,
  ExternalLink,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  FileText,
  IndianRupee,
  ShieldCheck,
  X,
  AlertTriangle,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import { api, SuperAdminStoreItem } from "@/lib/api";

export default function SuperAdminStoresPage() {
  const [stores, setStores] = useState<SuperAdminStoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");

  // Modals state
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<SuperAdminStoreItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCity, setFormCity] = useState("Ahmedabad");
  const [formState, setFormState] = useState("Gujarat");
  const [formPincode, setFormPincode] = useState("380001");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formGstin, setFormGstin] = useState("");
  const [formDrugLicenseNo, setFormDrugLicenseNo] = useState("");
  const [formAdminEmail, setFormAdminEmail] = useState("");

  const loadStores = async () => {
    setLoading(true);
    try {
      const res = await api.getSuperAdminStores();
      if (res.success && res.stores) {
        setStores(res.stores);
      }
    } catch (err) {
      console.error("Failed to load stores", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const formatCurrency = (val: number) => {
    return `₹${Number(val || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  // Filtered stores
  const filteredStores = useMemo(() => {
    return stores.filter((st) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        st.name.toLowerCase().includes(q) ||
        st.code.toLowerCase().includes(q) ||
        st.city.toLowerCase().includes(q) ||
        (st.gstin && st.gstin.toLowerCase().includes(q)) ||
        (st.drugLicenseNo && st.drugLicenseNo.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (statusFilter === "ACTIVE") return st.isActive;
      if (statusFilter === "SUSPENDED") return !st.isActive;
      return true;
    });
  }, [stores, search, statusFilter]);

  // Open Onboard Modal
  const handleOpenOnboardModal = () => {
    setFormName("");
    setFormCode(`STORE-00${stores.length + 1}`);
    setFormAddress("");
    setFormCity("Ahmedabad");
    setFormState("Gujarat");
    setFormPincode("380001");
    setFormPhone("");
    setFormEmail("");
    setFormGstin("");
    setFormDrugLicenseNo("");
    setFormAdminEmail("admin@citymedical.com");
    setFormError("");
    setIsOnboardModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (st: SuperAdminStoreItem) => {
    setSelectedStore(st);
    setFormName(st.name);
    setFormCode(st.code);
    setFormAddress(st.address || "");
    setFormCity(st.city || "Ahmedabad");
    setFormState(st.state || "Gujarat");
    setFormPincode(st.pincode || "380001");
    setFormPhone(st.phone || "");
    setFormEmail(st.email || "");
    setFormGstin(st.gstin || "");
    setFormDrugLicenseNo(st.drugLicenseNo || "");
    setFormError("");
    setIsEditModalOpen(true);
    setActionMenuOpenId(null);
  };

  // Submit new store branch
  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setFormError("");

    try {
      await api.createStoreBranch({
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        address: formAddress.trim() || undefined,
        city: formCity.trim() || undefined,
        state: formState.trim() || undefined,
        pincode: formPincode.trim() || undefined,
        phone: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
        gstin: formGstin.trim() || undefined,
        drugLicenseNo: formDrugLicenseNo.trim() || undefined,
        adminEmail: formAdminEmail.trim() || undefined,
      });

      setIsOnboardModalOpen(false);
      loadStores();
    } catch (err: any) {
      setFormError(err.message || "Failed to onboard store branch");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit edit store branch
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore || !formName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setFormError("");

    try {
      await api.updateStoreBranch(selectedStore.id, {
        name: formName.trim(),
        address: formAddress.trim() || undefined,
        city: formCity.trim() || undefined,
        state: formState.trim() || undefined,
        pincode: formPincode.trim() || undefined,
        phone: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
        gstin: formGstin.trim() || undefined,
        drugLicenseNo: formDrugLicenseNo.trim() || undefined,
      });

      setIsEditModalOpen(false);
      loadStores();
    } catch (err: any) {
      setFormError(err.message || "Failed to update store branch");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active/suspended
  const handleToggleStatus = async (st: SuperAdminStoreItem) => {
    const nextStatus = !st.isActive;
    const confirmMsg = nextStatus
      ? `Activate store branch "${st.name}"? POS billing will be resumed.`
      : `Suspend store branch "${st.name}"? Cashiers will be locked from creating new sales until reactivated.`;

    if (!confirm(confirmMsg)) return;

    try {
      await api.updateStoreBranchStatus(st.id, nextStatus);
      setStores((prev) =>
        prev.map((item) => (item.id === st.id ? { ...item, isActive: nextStatus } : item))
      );
      setActionMenuOpenId(null);
    } catch (err: any) {
      alert(err.message || "Failed to update store status");
    }
  };

  const totalStores = stores.length;
  const activeStores = stores.filter((s) => s.isActive).length;
  const suspendedStores = totalStores - activeStores;
  const totalCombinedSales = stores.reduce((sum, s) => sum + s.totalSales, 0);

  return (
    <SuperAdminLayout
      activeMenuId="stores"
      title="Store Branches Management"
      subtitle="Provision, configure, activate/suspend, and monitor franchise pharmacy outlets"
    >
      <div className="space-y-6 max-w-[1700px] mx-auto">
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Total Outlets
              </span>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {totalStores} Branches
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Provisioned in network</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Online & Operational
              </span>
              <div className="text-2xl font-black text-emerald-600 tracking-tight">
                {activeStores} Active
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold">Active POS billing</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Suspended Outlets
              </span>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {suspendedStores} Locked
              </div>
              <span className="text-[11px] text-slate-400 font-medium">No sales permitted</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
              <XCircle className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Combined Outlets GMV
              </span>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {formatCurrency(totalCombinedSales)}
              </div>
              <span className="text-[11px] text-indigo-600 font-semibold">Aggregated sales total</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
              <IndianRupee className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Filter, Onboard Action */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search branch by name, code, city, GSTIN, or drug license..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none pr-8 shadow-xs"
              >
                <option value="ALL">All Stores</option>
                <option value="ACTIVE">Active Online</option>
                <option value="SUSPENDED">Suspended Outlets</option>
              </select>
              <Filter className="h-3 w-3 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={handleOpenOnboardModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Onboard Store Branch</span>
            </button>
          </div>
        </div>

        {/* Store Branches Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse text-xs min-w-[1080px] whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 min-w-[120px]">Branch Code</th>
                  <th className="py-3 px-4 min-w-[200px]">Store Identity</th>
                  <th className="py-3 px-4 min-w-[200px]">Regulatory Credentials</th>
                  <th className="py-3 px-4 min-w-[170px]">Store Admin</th>
                  <th className="py-3 px-4 min-w-[110px] text-center">Catalog Size</th>
                  <th className="py-3 px-4 min-w-[130px] text-right">Orders & GMV</th>
                  <th className="py-3 px-4 min-w-[100px] text-center">Status</th>
                  <th className="py-3 px-4 min-w-[100px] text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
                      <span>Loading pharmacy stores database...</span>
                    </td>
                  </tr>
                ) : filteredStores.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No pharmacy branches match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStores.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition">
                      {/* Store Code */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-md text-[11px]">
                          {st.code}
                        </span>
                      </td>

                      {/* Store Name & City */}
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">{st.name}</span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {st.city || "Ahmedabad"}, {st.state || "Gujarat"}
                          </span>
                        </div>
                      </td>

                      {/* GSTIN & Drug License */}
                      <td className="py-3 px-4">
                        <div className="space-y-1 text-[11px]">
                          <div>
                            <span className="text-slate-400">GSTIN: </span>
                            <span className="font-mono font-semibold text-slate-700">
                              {st.gstin || "Pending"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">DL No: </span>
                            <span className="font-mono font-semibold text-slate-700">
                              {st.drugLicenseNo || "Pending"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Store Manager */}
                      <td className="py-3 px-4">
                        {st.manager ? (
                          <div>
                            <span className="font-semibold text-slate-800 block text-xs">
                              {st.manager.name}
                            </span>
                            <span className="text-[11px] text-slate-400">{st.manager.email}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Unassigned</span>
                        )}
                      </td>

                      {/* Catalog Size */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded text-[11px]">
                          {st.productCount} meds
                        </span>
                      </td>

                      {/* Orders & GMV */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-slate-900 block">
                          {formatCurrency(st.totalSales)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {st.orderCount} orders
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(st)}
                          title="Click to toggle store status"
                          className={`px-3 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                            st.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          }`}
                        >
                          {st.isActive ? "ACTIVE ONLINE" : "SUSPENDED"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActionMenuOpenId((prev) => (prev === st.id ? null : st.id))
                          }
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {actionMenuOpenId === st.id && (
                          <div className="absolute right-4 top-10 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1 text-left text-xs animate-in fade-in zoom-in-95 duration-100">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(st)}
                              className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Edit2 className="h-3 w-3 text-slate-400" />
                              <span>Edit Branch Profile</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleStatus(st)}
                              className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              {st.isActive ? (
                                <>
                                  <XCircle className="h-3 w-3 text-rose-500" />
                                  <span>Suspend Store</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                  <span>Activate Store</span>
                                </>
                              )}
                            </button>

                            <Link
                              href="/pos"
                              className="w-full px-3 py-2 text-indigo-700 hover:bg-indigo-50 flex items-center gap-2 border-t border-slate-100"
                            >
                              <Store className="h-3 w-3" />
                              <span>Open Branch POS</span>
                            </Link>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-800">{filteredStores.length}</strong> of{" "}
              <strong className="text-slate-800">{stores.length}</strong> store outlets
            </span>
            <span className="text-[11px] text-slate-400">
              Multi-store franchise data synchronized across all PostgreSQL nodes
            </span>
          </div>
        </div>
      </div>

      {/* Onboard Store Modal */}
      {isOnboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#080c16] border-b border-[#151f33] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Onboard New Pharmacy Branch</h3>
                <span className="text-[11px] text-slate-400">
                  Provision new physical or satellite store outlet
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOnboardModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Store Branch Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apollo Care West Gate"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Store Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. STORE-003"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Physical Address</label>
                <input
                  type="text"
                  placeholder="e.g. Shop 4, Ground Floor, Shivalik Plaza"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">City</label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">State</label>
                  <input
                    type="text"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Pincode</label>
                  <input
                    type="text"
                    value={formPincode}
                    onChange={(e) => setFormPincode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 24AAAAA0000A1Z5"
                    value={formGstin}
                    onChange={(e) => setFormGstin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Drug License No. (Form 20B/21B)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GJ-AHM-189283"
                    value={formDrugLicenseNo}
                    onChange={(e) => setFormDrugLicenseNo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Store Manager Email
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. admin@citymedical.com"
                    value={formAdminEmail}
                    onChange={(e) => setFormAdminEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOnboardModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? "Onboarding..." : "Onboard Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Store Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#080c16] border-b border-[#151f33] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Edit Store Branch</h3>
                <span className="text-[11px] text-slate-400">
                  Update location and regulatory credentials for {formCode}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Store Branch Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Physical Address</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">City</label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">State</label>
                  <input
                    type="text"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Pincode</label>
                  <input
                    type="text"
                    value={formPincode}
                    onChange={(e) => setFormPincode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={formGstin}
                    onChange={(e) => setFormGstin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Drug License No.
                  </label>
                  <input
                    type="text"
                    value={formDrugLicenseNo}
                    onChange={(e) => setFormDrugLicenseNo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
