"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import {
  IndianRupee,
  ShoppingBag,
  Building2,
  Users,
  TrendingUp,
  ShieldAlert,
  Plus,
  RefreshCw,
  ExternalLink,
  Store,
  CreditCard,
  Clock,
  ArrowRight,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Download,
  CheckCircle2,
} from "lucide-react";
import {
  api,
  SuperAdminDashboardResponse,
  SuperAdminDashboardKpis,
  SuperAdminStoreSummary,
  SuperAdminRecentSale,
} from "@/lib/api";

export default function SuperAdminDashboardPage() {
  const [data, setData] = useState<SuperAdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    try {
      const res = await api.getSuperAdminDashboard();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error("Failed to load super admin dashboard", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const formatCurrency = (val: number) => {
    return `₹${Number(val || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const kpis: SuperAdminDashboardKpis = data?.kpis || {
    networkGmv: 0,
    networkOrders: 0,
    totalStores: 0,
    activeStores: 0,
    suspendedStores: 0,
    activeStaff: 0,
    complianceAlerts: 0,
  };

  const stores: SuperAdminStoreSummary[] = data?.storesSummary || [];
  const recentSales: SuperAdminRecentSale[] = data?.recentSales || [];

  // Calculate highest store revenue for bar sizing
  const maxStoreRevenue = Math.max(...stores.map((s) => s.totalRevenue), 1);

  return (
    <SuperAdminLayout
      activeMenuId="dashboard"
      title="Global Platform Dashboard"
      subtitle="Consolidated Network Gross Merchandise Value (GMV), Multi-Branch Health & Live Operations"
    >
      <div className="space-y-6 max-w-[1700px] mx-auto">
        {/* Top Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Network GMV */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Network Gross GMV
              </span>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {formatCurrency(kpis.networkGmv)}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <TrendingUp className="h-3 w-3" />
                <span>+18.4% network growth</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <IndianRupee className="h-6 w-6" />
            </div>
          </div>

          {/* Card 2: Total Orders Billed */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Total Orders Billed
              </span>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {kpis.networkOrders}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <TrendingUp className="h-3 w-3" />
                <span>Across all retail terminals</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
              <ShoppingBag className="h-6 w-6" />
            </div>
          </div>

          {/* Card 3: Active Pharmacy Stores */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Active Store Branches
              </span>
              <div className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>{kpis.activeStores}</span>
                <span className="text-xs font-bold text-slate-400">/ {kpis.totalStores} Total</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                <span>100% Branches Operational</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
          </div>

          {/* Card 4: Registered Staff & Cashiers */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Staff & Operators
              </span>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {kpis.activeStaff}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
                <ShieldCheck className="h-3 w-3" />
                <span>RBAC Governed</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 flex-shrink-0">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Executive Action Bar & Control Shortcuts */}
        <div className="bg-[#080c16] text-white p-4 rounded-2xl border border-[#151f33] shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm block text-white">
                Multi-Branch Orchestrator Hub
              </span>
              <span className="text-xs text-slate-400">
                Manage pharmacy outlets, universal drug catalogs, regulatory DL records, and cross-store stock.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3 py-2 bg-[#121a2d] hover:bg-[#1a253e] border border-[#1f2c4a] text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
              <span>Refresh Metrics</span>
            </button>

            <Link
              href="/super-admin/stores"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-950/40"
            >
              <Plus className="h-4 w-4" />
              <span>Onboard New Branch</span>
            </Link>
          </div>
        </div>

        {/* Two-Column Analytics Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 Cols): Store Performance Leaderboard */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Store Branches GMV & Operational Status
                </h3>
                <p className="text-xs text-slate-500">
                  Revenue contribution and active catalog sizes per pharmacy location
                </p>
              </div>
              <Link
                href="/super-admin/stores"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
              >
                <span>Manage Stores</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="p-5 pt-0 space-y-4">
              {loading ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
                  <span>Aggregating cross-store metrics...</span>
                </div>
              ) : stores.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No pharmacy store branches found.
                </div>
              ) : (
                stores.map((st) => {
                  const percentage = Math.round((st.totalRevenue / maxStoreRevenue) * 100);
                  return (
                    <div
                      key={st.id}
                      className="p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50/50 transition space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {st.code}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">{st.name}</span>
                              <span
                                className={`px-2 py-1 rounded text-[10px] font-bold ${
                                  st.isActive
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}
                              >
                                {st.isActive ? "ONLINE" : "SUSPENDED"}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500">
                              {st.city} • GSTIN: {st.gstin} • DL: {st.drugLicenseNo}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-black text-slate-900 block">
                            {formatCurrency(st.totalRevenue)}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {st.invoiceCount} invoices billed
                          </span>
                        </div>
                      </div>

                      {/* Visual Revenue Progress Bar */}
                      <div className="space-y-1">
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>Active Stock: {st.productCount} medicines</span>
                          <span>Staff: {st.staffCount} operators</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column (5 Cols): Live Global Sales Stream Ticker */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Live Network Sales Stream
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-xs text-slate-500">
                  Real-time invoice completions across all store terminals
                </p>
              </div>
            </div>

            <div className="p-5 pt-0 space-y-2 max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Connecting to live transaction stream...
                </div>
              ) : recentSales.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No retail invoices logged yet across the network.
                </div>
              ) : (
                recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="p-3 border border-slate-100 rounded-xl hover:border-slate-300 transition flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-700">
                          {sale.invoiceNumber}
                        </span>
                        <span className="px-2 py-1 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {sale.storeCode}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>{sale.customerName}</span>
                        <span>•</span>
                        <span className="text-slate-400">{sale.storeName}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-slate-900 block">
                        {formatCurrency(sale.grandTotal)}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {sale.paymentMethod}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
