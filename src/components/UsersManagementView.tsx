"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  UserPlus,
  Shield,
  ShieldCheck,
  Stethoscope,
  Building2,
  Lock,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit2,
  RefreshCw,
  X,
  Building,
} from "lucide-react";
import { api, UserItem, StoreInfo } from "@/lib/api";
import { useStore } from "@/context/StoreContext";

export default function UsersManagementView() {
  const { currentStore, stores } = useStore();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [storeFilter, setStoreFilter] = useState("ALL");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  // Form State
  const [formFullName, setFormFullName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState<"ADMIN" | "STORE_ADMIN" | "DOCTOR">("STORE_ADMIN");
  const [formStoreIds, setFormStoreIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [feedback, setFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const u = api.getStoredUser();
    if (u) setCurrentUser(u);
  }, []);

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const isAdmin = currentUser?.role === "ADMIN";
  const isStoreAdmin = currentUser?.role === "STORE_ADMIN";

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers({
        q: searchQuery || undefined,
        role: roleFilter !== "ALL" ? roleFilter : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        storeId: storeFilter !== "ALL" ? storeFilter : undefined,
      });
      if (res.success && res.users) {
        setUsers(res.users);
      }
    } catch (err: any) {
      console.error("Failed to load users:", err);
      setFeedback({ msg: err.message || "Failed to load users", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter, storeFilter, currentStore?.id]);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormFullName("");
    setFormEmail("");
    setFormUsername("");
    setFormPassword("");
    setFormPhone("");
    setFormError("");

    if (isStoreAdmin) {
      setFormRole("DOCTOR");
      setFormStoreIds(currentStore?.id ? [currentStore.id] : []);
    } else if (isAdmin) {
      setFormRole("STORE_ADMIN");
      setFormStoreIds(currentStore?.id ? [currentStore.id] : []);
    } else {
      setFormRole("STORE_ADMIN");
      setFormStoreIds(currentStore?.id ? [currentStore.id] : []);
    }

    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserItem) => {
    setEditingUser(user);
    setFormFullName(user.fullName);
    setFormEmail(user.email);
    setFormUsername(user.username);
    setFormPassword("");
    setFormPhone(user.phone || "");
    setFormRole(user.role as any);
    setFormStoreIds(user.stores?.map((s) => s.id) || []);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      if (editingUser) {
        const res = await api.updateUser(editingUser.id, {
          fullName: formFullName,
          email: formEmail,
          phone: formPhone,
          role: formRole,
          password: formPassword || undefined,
          storeIds: formStoreIds,
        });

        if (res.success) {
          setFeedback({ msg: res.message || "User updated successfully", type: "success" });
          setIsModalOpen(false);
          await loadUsers();
        } else {
          setFormError(res.message || "Failed to update user");
        }
      } else {
        const res = await api.createUser({
          fullName: formFullName,
          email: formEmail,
          username: formUsername,
          password: formPassword,
          phone: formPhone,
          role: formRole,
          storeIds: formStoreIds,
        });

        if (res.success) {
          setFeedback({ msg: res.message || "User created successfully", type: "success" });
          setIsModalOpen(false);
          await loadUsers();
        } else {
          setFormError(res.message || "Failed to create user");
        }
      }
    } catch (err: any) {
      setFormError(err.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: UserItem) => {
    const nextStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const promptMsg =
      nextStatus === "SUSPENDED"
        ? `Are you sure you want to SUSPEND "${user.fullName}"? Their login session will be revoked immediately.`
        : `Reactivate login access for "${user.fullName}"?`;

    if (!confirm(promptMsg)) return;

    try {
      const res = await api.updateUserStatus(user.id, nextStatus);
      if (res.success) {
        setFeedback({ msg: res.message, type: "success" });
        await loadUsers();
      }
    } catch (err: any) {
      setFeedback({ msg: err.message || "Failed to update status", type: "error" });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <ShieldCheck className="h-3 w-3" />
            Super Admin
          </span>
        );
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Building2 className="h-3 w-3" />
            Multi-Store Admin
          </span>
        );
      case "STORE_ADMIN":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Shield className="h-3 w-3" />
            Store Admin
          </span>
        );
      case "DOCTOR":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
            <Stethoscope className="h-3 w-3" />
            Doctor
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
            {role}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600" />
            )}
            <span className="text-sm font-semibold">{feedback.msg}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Staff & Role Governance</h1>
              <p className="text-xs text-slate-500 mt-1">
                {isSuperAdmin && "Full platform staff administration across all branches."}
                {isAdmin && "Manage Store Admins & Doctors across your assigned pharmacy stores."}
                {isStoreAdmin && `Manage Doctors & staff for ${currentStore?.name || "your store"}.`}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add New Staff User</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, username, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="ALL">All Roles</option>
            {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
            {(isSuperAdmin || isAdmin) && <option value="ADMIN">Multi-Store Admin</option>}
            <option value="STORE_ADMIN">Store Admin</option>
            <option value="DOCTOR">Doctor</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          {/* Store Filter for Super Admin */}
          {isSuperAdmin && stores.length > 1 && (
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <option value="ALL">All Stores</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={loadUsers}
            className="p-2 text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg border border-slate-200 transition"
            title="Refresh list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-3.5">Staff User</th>
                <th className="px-6 py-3.5">System Role</th>
                <th className="px-6 py-3.5">Assigned Branches</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Loading staff members...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No staff users found</p>
                    <p className="text-[11px] mt-1 text-slate-400">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSuspended = u.status === "SUSPENDED" || !u.isActive;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{u.fullName}</p>
                            <p className="text-[11px] text-slate-400 font-mono">@{u.username}</p>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-slate-400" />
                                {u.email}
                              </span>
                              {u.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3 text-slate-400" />
                                  {u.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {getRoleBadge(u.role)}
                      </td>

                      <td className="px-6 py-4">
                        {u.role === "SUPER_ADMIN" ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                            All Platform Branches
                          </span>
                        ) : u.stores && u.stores.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {u.stores.map((st) => (
                              <span
                                key={st.id}
                                className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {st.name} ({st.code})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">No stores assigned</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={u.id === currentUser?.userId}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${
                            !isSuspended
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                          } ${u.id === currentUser?.userId ? "opacity-50 cursor-not-allowed" : ""}`}
                          title={u.id === currentUser?.userId ? "Cannot suspend own account" : "Click to toggle status"}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${!isSuspended ? "bg-emerald-500" : "bg-rose-500"}`} />
                          {!isSuspended ? "Active" : "Suspended"}
                        </button>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition"
                          title="Edit staff details"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  {editingUser ? <Edit2 className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {editingUser ? `Edit Staff: ${editingUser.fullName}` : "Add New Staff User"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Role & multi-store boundary assignment
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Shah"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingUser)}
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                    placeholder="e.g. rajesh_shah"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="rajesh@hospital.com"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {editingUser ? "Reset Password (leave blank to keep current)" : "Initial Password *"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  minLength={6}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  System Role *
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                >
                  {isSuperAdmin && (
                    <>
                      <option value="ADMIN">Multi-Store Admin (Franchisee / Chain Director)</option>
                      <option value="STORE_ADMIN">Store Admin (Single Branch Manager)</option>
                      <option value="DOCTOR">Doctor (OPD Consultations & e-Rx)</option>
                    </>
                  )}
                  {isAdmin && (
                    <>
                      <option value="STORE_ADMIN">Store Admin (Branch Manager)</option>
                      <option value="DOCTOR">Doctor (OPD Consultations & e-Rx)</option>
                    </>
                  )}
                  {isStoreAdmin && (
                    <>
                      <option value="DOCTOR">Doctor (Consulting Physician)</option>
                    </>
                  )}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {formRole === "STORE_ADMIN" && "Must be assigned to strictly ONE pharmacy store branch."}
                  {formRole === "ADMIN" && "Can be assigned to multiple stores owned by this administrator."}
                  {formRole === "DOCTOR" && "Has clinical access to OPD prescription writing."}
                </p>
              </div>

              {/* Branch Assignment */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Store Branch Assignment *
                </label>
                {isStoreAdmin ? (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>{currentStore?.name} ({currentStore?.code})</span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Assigned Branch</span>
                  </div>
                ) : formRole === "STORE_ADMIN" ? (
                  <select
                    value={formStoreIds[0] || ""}
                    onChange={(e) => setFormStoreIds([e.target.value])}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="">Select Single Pharmacy Branch</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code}) - {s.city || "Branch"}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 rounded-lg border border-slate-200 bg-slate-50">
                    {stores.map((s) => {
                      const checked = formStoreIds.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-100 p-1 rounded transition"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormStoreIds([...formStoreIds, s.id]);
                              } else {
                                setFormStoreIds(formStoreIds.filter((id) => id !== s.id));
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                          />
                          <span className="font-medium text-slate-800">
                            {s.name} <span className="text-slate-400 font-mono">({s.code})</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingUser ? "Save Changes" : "Create Staff Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
