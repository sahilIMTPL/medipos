"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  IndianRupee,
  UserPlus,
  Edit2,
  MoreVertical,
  X,
  FileText,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Filter,
  MessageSquare,
  Send,
} from "lucide-react";
import { api, CustomerItem, CustomerStats, CustomerSaleSummary } from "@/lib/api";
import SalesInvoiceModal from "@/components/SalesInvoiceModal";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    totalOrders: 0,
    totalSales: 0,
    newCustomersThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "ACTIVE" | "WALKIN" | "NEW">("ALL");

  // Selection & Inspector Drawer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [activeDetailTab, setActiveDetailTab] = useState<"OVERVIEW" | "PURCHASES" | "NOTES">("OVERVIEW");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals & Action states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  // Add/Edit Form State
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Notes tab state for fast in-place editing
  const [inspectorNotes, setInspectorNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSavedSuccess, setNotesSavedSuccess] = useState(false);

  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Load customer directory & stats
  const fetchCustomers = async (search?: string) => {
    setLoading(true);
    try {
      const res = await api.getCustomers({ q: search || undefined });
      if (res.customers) {
        setCustomers(res.customers);
        if (res.stats) {
          setStats(res.stats);
        } else {
          // Fallback stats calculation
          const totalOrders = res.customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
          const totalSales = res.customers.reduce((sum, c) => sum + (c.totalPaid || 0), 0);
          setStats({
            totalCustomers: res.customers.length,
            totalOrders,
            totalSales,
            newCustomersThisMonth: 0,
          });
        }

        // Set default selected customer if none selected or current not in list
        if (res.customers.length > 0) {
          setSelectedCustomerId((prev) => {
            if (prev && res.customers.some((c) => c.id === prev)) return prev;
            return res.customers[0].id;
          });
        } else {
          setSelectedCustomerId(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch customer directory", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Close action menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setActionMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Filtered customers based on search and tab filter
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        c.id.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filterType === "ACTIVE") {
        return (c.totalOrders || 0) > 0;
      }
      if (filterType === "WALKIN") {
        return c.name.toLowerCase().includes("walk-in");
      }
      if (filterType === "NEW") {
        if (!c.createdAt) return false;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return new Date(c.createdAt) >= startOfMonth;
      }
      return true;
    });
  }, [customers, searchQuery, filterType]);

  // Paginated customers for current table page
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  // Active selected customer object
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Sync inspector notes when selected customer changes
  useEffect(() => {
    if (selectedCustomer) {
      setInspectorNotes(selectedCustomer.notes || "");
      setNotesSavedSuccess(false);
    }
  }, [selectedCustomer]);

  // Reset page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType]);

  // Helpers
  const getInitials = (name: string) => {
    if (!name) return "CU";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
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

  const formatCurrency = (amount?: number) => {
    const val = Number(amount || 0);
    return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormName("");
    setFormPhone("");
    setFormEmail("");
    setFormAddress("");
    setFormNotes("");
    setFormError("");
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (c: CustomerItem) => {
    setFormName(c.name);
    setFormPhone(c.phone || "");
    setFormEmail(c.email || "");
    setFormAddress(c.address || "");
    setFormNotes(c.notes || "");
    setFormError("");
    setSelectedCustomerId(c.id);
    setIsEditModalOpen(true);
    setActionMenuOpenId(null);
  };

  // Save new customer
  const handleCreateCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setFormError("");

    try {
      const res = await api.createCustomer({
        name: formName.trim(),
        phone: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
        address: formAddress.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });

      if (res.customer) {
        setIsAddModalOpen(false);
        fetchCustomers();
        setSelectedCustomerId(res.customer.id);
        setIsDetailsOpen(true);
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to create customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update customer
  const handleUpdateCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !formName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setFormError("");

    try {
      const res = await api.updateCustomer(selectedCustomerId, {
        name: formName.trim(),
        phone: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
        address: formAddress.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });

      if (res.customer) {
        setIsEditModalOpen(false);
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === selectedCustomerId
              ? {
                  ...c,
                  name: res.customer.name,
                  phone: res.customer.phone || "",
                  email: res.customer.email || "",
                  address: res.customer.address || "",
                  notes: res.customer.notes || "",
                }
              : c
          )
        );
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to update customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save notes in inspector
  const handleSaveInspectorNotes = async () => {
    if (!selectedCustomerId || isSavingNotes) return;
    setIsSavingNotes(true);
    try {
      const res = await api.updateCustomer(selectedCustomerId, { notes: inspectorNotes });
      if (res.customer) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === selectedCustomerId ? { ...c, notes: res.customer.notes || "" } : c))
        );
        setNotesSavedSuccess(true);
        setTimeout(() => setNotesSavedSuccess(false), 2500);
      }
    } catch (err: any) {
      alert(err.message || "Failed to update notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Delete customer
  const handleDeleteCustomer = async (c: CustomerItem) => {
    if (!confirm(`Are you sure you want to delete profile for "${c.name}"?`)) return;
    try {
      await api.deleteCustomer(c.id);
      setActionMenuOpenId(null);
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || "Cannot delete customer with billing transactions.");
    }
  };

  return (
    <AppLayout activeMenuId="customers">
      <div className="p-4 space-y-4 max-w-[1700px] mx-auto">
        {/* Top Metric KPI Cards (4 cards) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Total Customers */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Customers
              </span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {stats.totalCustomers}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Users className="h-4 w-4" />
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Orders
              </span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {stats.totalOrders}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>

          {/* Card 3: Total Sales */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Sales
              </span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {formatCurrency(stats.totalSales)}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>

          {/* Card 4: New Customers */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                New This Month
              </span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {stats.newCustomersThisMonth}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0">
              <UserPlus className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Main Content: Master-Detail Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column: Search, Filter, Customer Table */}
          <div
            className={`transition-all duration-200 space-y-3 ${
              isDetailsOpen && selectedCustomer ? "lg:col-span-7" : "lg:col-span-12"
            }`}
          >
            {/* Table Toolbar */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, phone, or customer ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {/* Filter Dropdown */}
                <div className="relative">
                  <select
                    value={filterType}
                    onChange={(e: any) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none pr-8 shadow-xs"
                  >
                    <option value="ALL">All Customers</option>
                    <option value="ACTIVE">Active Buyers</option>
                    <option value="WALKIN">Walk-in Guests</option>
                    <option value="NEW">New This Month</option>
                  </select>
                  <Filter className="h-3 w-3 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* + Add Customer Button */}
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Customer</span>
                </button>
              </div>
            </div>

            {/* Customers Data Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left border-collapse text-xs min-w-[950px] whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-2 px-3 w-10 min-w-[40px] text-center">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          readOnly
                        />
                      </th>
                      <th className="py-2 px-3 min-w-[180px]">Customer</th>
                      <th className="py-2 px-3 min-w-[120px]">Customer ID</th>
                      <th className="py-2 px-3 min-w-[120px]">Phone</th>
                      <th className="py-2 px-3 min-w-[100px] text-center">Total Orders</th>
                      <th className="py-2 px-3 min-w-[110px] text-right">Total Paid</th>
                      <th className="py-2 px-3 min-w-[130px]">Last Purchase</th>
                      <th className="py-2 px-3 min-w-[100px] text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-400">
                          <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-600" />
                          <span>Loading customer database...</span>
                        </td>
                      </tr>
                    ) : paginatedCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-400">
                          No customer profiles match your search criteria.
                        </td>
                      </tr>
                    ) : (
                      paginatedCustomers.map((c) => {
                        const isSelected = selectedCustomerId === c.id;
                        return (
                          <tr
                            key={c.id}
                            onClick={() => {
                              setSelectedCustomerId(c.id);
                              setIsDetailsOpen(true);
                            }}
                            className={`group cursor-pointer transition ${
                              isSelected
                                ? "bg-indigo-50/70 hover:bg-indigo-50 font-medium"
                                : "hover:bg-slate-50/80"
                            }`}
                          >
                            <td
                              className="py-2 px-3 text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedCustomerId(c.id);
                                  setIsDetailsOpen(true);
                                }}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            </td>

                            {/* Customer Avatar & Name */}
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                                  {getInitials(c.name)}
                                </div>
                                <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition truncate max-w-[150px]">
                                  {c.name}
                                </span>
                              </div>
                            </td>

                            {/* Customer ID */}
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                              #{c.id.slice(0, 8)}
                            </td>

                            {/* Phone */}
                            <td className="py-2 px-3 text-slate-600">
                              {c.phone ? (
                                <span className="font-medium">{c.phone}</span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>

                            {/* Total Orders */}
                            <td className="py-2 px-3 text-center">
                              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded text-[11px]">
                                {c.totalOrders || 0}
                              </span>
                            </td>

                            {/* Total Paid */}
                            <td className="py-2 px-3 text-right font-bold text-slate-900">
                              {formatCurrency(c.totalPaid)}
                            </td>

                            {/* Last Purchase */}
                            <td className="py-2 px-3 text-slate-500 text-[11px]">
                              {formatDate(c.lastPurchase)}
                            </td>

                            {/* Actions Menu */}
                            <td
                              className="py-2 px-3 text-center relative"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setActionMenuOpenId((prev) => (prev === c.id ? null : c.id))
                                }
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {actionMenuOpenId === c.id && (
                                <div
                                  ref={actionMenuRef}
                                  className="absolute right-4 top-10 w-36 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1 text-left text-xs animate-in fade-in zoom-in-95 duration-100"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCustomerId(c.id);
                                      setIsDetailsOpen(true);
                                      setActionMenuOpenId(null);
                                    }}
                                    className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <ExternalLink className="h-3 w-3 text-slate-400" />
                                    <span>View Profile</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(c)}
                                    className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <Edit2 className="h-3 w-3 text-slate-400" />
                                    <span>Edit Details</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCustomer(c)}
                                    className="w-full px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100"
                                  >
                                    <Trash2 className="h-3 w-3 text-rose-500" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer with Pagination */}
              <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <div>
                  Showing{" "}
                  <strong className="text-slate-800">
                    {filteredCustomers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                  </strong>{" "}
                  to{" "}
                  <strong className="text-slate-800">
                    {Math.min(currentPage * pageSize, filteredCustomers.length)}
                  </strong>{" "}
                  of <strong className="text-slate-800">{filteredCustomers.length}</strong> customers
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        type="button"
                        onClick={() => setCurrentPage(pg)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                          currentPage === pg
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {pg}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Customer Details Drawer / Inspector Panel (5 Cols) */}
          {isDetailsOpen && selectedCustomer && (
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-base flex items-center justify-center flex-shrink-0 shadow-inner">
                    {getInitials(selectedCustomer.name)}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      {selectedCustomer.name}
                    </h2>
                    <span className="text-[11px] font-mono text-slate-500">
                      Customer ID: #{selectedCustomer.id.slice(0, 8)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(selectedCustomer)}
                    className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDetailsOpen(false)}
                    title="Close Inspector Panel"
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Drawer Tabs */}
              <div className="px-5 border-b border-slate-200 flex items-center gap-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveDetailTab("OVERVIEW")}
                  className={`pb-3 border-b-2 transition cursor-pointer ${
                    activeDetailTab === "OVERVIEW"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailTab("PURCHASES")}
                  className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-2 ${
                    activeDetailTab === "PURCHASES"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <span>Purchase History</span>
                  <span className="px-2 py-1 rounded-full bg-slate-100 text-[10px] text-slate-600">
                    {selectedCustomer.salesInvoices?.length || 0}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailTab("NOTES")}
                  className={`pb-3 border-b-2 transition cursor-pointer ${
                    activeDetailTab === "NOTES"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Contact & Notes
                </button>
              </div>

              {/* Drawer Tab Contents */}
              <div className="p-5 pt-0 space-y-5">
                {/* 1. OVERVIEW TAB */}
                {activeDetailTab === "OVERVIEW" && (
                  <div className="space-y-5">
                    {/* Contact Information Card */}
                    <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-3 text-xs">
                      <span className="font-bold text-slate-900 block">Contact Information</span>
                      <div className="space-y-2 text-slate-600">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span>{selectedCustomer.phone || "No phone registered"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span>{selectedCustomer.email || "No email registered"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span>{selectedCustomer.address || "No address recorded"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span>
                            Customer since {formatDate(selectedCustomer.createdAt || new Date().toISOString())}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Metric Stat Tiles (2x2 Grid) */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Tile 1: Total Orders */}
                      <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 font-medium block">Total Orders</span>
                          <span className="text-base font-black text-slate-900">
                            {selectedCustomer.totalOrders || 0}
                          </span>
                        </div>
                      </div>

                      {/* Tile 2: Total Paid */}
                      <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                          <IndianRupee className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 font-medium block">Total Paid</span>
                          <span className="text-base font-black text-slate-900">
                            {formatCurrency(selectedCustomer.totalPaid)}
                          </span>
                        </div>
                      </div>

                      {/* Tile 3: Outstanding Balance */}
                      <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 font-medium block">Outstanding Balance</span>
                          <span className="text-base font-black text-emerald-700">₹0</span>
                        </div>
                      </div>

                      {/* Tile 4: Last Purchase */}
                      <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 font-medium block">Last Purchase</span>
                          <span className="text-xs font-bold text-slate-900">
                            {formatDate(selectedCustomer.lastPurchase)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sales History Table Preview */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 text-xs">Sales History</h3>
                        <button
                          type="button"
                          onClick={() => setActiveDetailTab("PURCHASES")}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                        >
                          View All
                        </button>
                      </div>

                      {!selectedCustomer.salesInvoices || selectedCustomer.salesInvoices.length === 0 ? (
                        <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                          No sales transactions logged for this customer yet.
                        </div>
                      ) : (
                        <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto scrollbar-thin">
                          <table className="w-full text-left text-xs min-w-[650px] whitespace-nowrap">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold text-[10px] uppercase">
                                <th className="py-2 px-3 min-w-[100px]">Date</th>
                                <th className="py-2 px-3 min-w-[120px]">Invoice No.</th>
                                <th className="py-2 px-2 min-w-[60px] text-center">Items</th>
                                <th className="py-2 px-3 min-w-[90px] text-right">Total</th>
                                <th className="py-2 px-2 min-w-[80px] text-center">Status</th>
                                <th className="py-2 px-2 min-w-[90px] text-center">Payment</th>
                                <th className="py-2 px-3 min-w-[80px] text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {selectedCustomer.salesInvoices.slice(0, 5).map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                                  <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                                    {formatDate(inv.invoiceDate)}
                                  </td>
                                  <td className="py-2 px-3 font-mono font-bold text-indigo-700">
                                    {inv.invoiceNumber}
                                  </td>
                                  <td className="py-2 px-2 text-center text-slate-600">
                                    {inv.itemCount || 1}
                                  </td>
                                  <td className="py-2 px-3 text-right font-bold text-slate-900">
                                    {formatCurrency(inv.grandTotal)}
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Paid
                                    </span>
                                  </td>
                                  <td className="py-2 px-2 text-center text-[10px] font-semibold text-slate-500">
                                    {inv.paymentMethod}
                                  </td>
                                  <td className="py-2 px-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => setViewingInvoiceId(inv.id)}
                                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-bold cursor-pointer"
                                    >
                                      View
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. PURCHASES TAB */}
                {activeDetailTab === "PURCHASES" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">
                        All Invoices ({selectedCustomer.salesInvoices?.length || 0})
                      </span>
                    </div>

                    {!selectedCustomer.salesInvoices || selectedCustomer.salesInvoices.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200">
                        No purchase records found.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {selectedCustomer.salesInvoices.map((inv) => (
                          <div
                            key={inv.id}
                            className="p-3 border border-slate-200 rounded-xl hover:border-indigo-300 transition bg-white flex items-center justify-between text-xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-indigo-700 font-mono">
                                  {inv.invoiceNumber}
                                </span>
                                <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                  {inv.paymentStatus}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-3">
                                <span>{formatDate(inv.invoiceDate)}</span>
                                <span>•</span>
                                <span>{inv.itemCount || 1} items</span>
                                <span>•</span>
                                <span>{inv.paymentMethod}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-black text-slate-900">
                                {formatCurrency(inv.grandTotal)}
                              </span>
                              <button
                                type="button"
                                onClick={() => setViewingInvoiceId(inv.id)}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                              >
                                View Bill
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. NOTES & CONTACT TAB */}
                {activeDetailTab === "NOTES" && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Patient Medical & General Notes
                      </label>
                      <textarea
                        rows={5}
                        placeholder="e.g. Known drug allergies (Penicillin), chronic medication schedule, preferred brand preferences..."
                        value={inspectorNotes}
                        onChange={(e) => setInspectorNotes(e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 bg-slate-50/50"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      {notesSavedSuccess ? (
                        <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> Notes saved successfully!
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">
                          Changes are saved directly to patient profile
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={handleSaveInspectorNotes}
                        disabled={isSavingNotes}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <Save className="h-4 w-4" />
                        <span>{isSavingNotes ? "Saving..." : "Save Notes"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-white border-b border-slate-100 text-slate-900 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Add New Patient / Customer</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mobile / Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. ramesh@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Postal Address</label>
                <input
                  type="text"
                  placeholder="e.g. Block C-102, S.G. Highway, Ahmedabad"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Initial Medical Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Blood group B+, diabetic"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? "Creating..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-white border-b border-slate-100 text-slate-900 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Edit Customer Profile</h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomerSubmit} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mobile / Phone Number</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Postal Address</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Medical / Chronic Notes</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
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
                  {isSubmitting ? "Saving..." : "Update Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sales Invoice Print / View Modal */}
      {viewingInvoiceId && (
        <SalesInvoiceModal
          invoiceId={viewingInvoiceId}
          onClose={() => setViewingInvoiceId(null)}
        />
      )}
    </AppLayout>
  );
}
