"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  ShoppingBag,
  Package,
  AlertTriangle,
  Calendar,
  ShieldAlert,
  CalendarDays,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { api, DashboardStatsResponse } from "@/lib/api";
import { CardSkeleton } from "./common";
import { useStore } from "@/context/StoreContext";

export default function DashboardView() {
  const { currentStore } = useStore();
  const [selectedDateFilter, setSelectedDateFilter] = useState("Today");
  const [data, setData] = useState<DashboardStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const stats = await api.getDashboardStats(currentStore?.id);
      setData(stats);
    } catch (err: any) {
      console.error("Dashboard error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [currentStore?.id]);

  const kpis = data?.kpis || {
    todaySales: { amount: "₹ 12,450", invoiceCount: 24, percentChange: "+12%", isPositive: true },
    todayPurchases: { amount: "₹ 8,200", invoiceCount: 2, percentChange: "-5%", isPositive: false },
    currentStockValue: { amount: "₹ 4,28,500", itemCount: "450 Items" },
    lowStock: { count: 18 },
    expiringSoon: { count: 26 },
    expired: { count: 5 },
  };

  const chartDays = data?.chartDays || [
    { day: "Mon", sales: 13.8, purchases: 6.2, salesVal: "₹ 13,800", purVal: "₹ 6,200" },
    { day: "Tue", sales: 12.2, purchases: 7.9, salesVal: "₹ 12,200", purVal: "₹ 7,900" },
    { day: "Wed", sales: 10.9, purchases: 6.5, salesVal: "₹ 10,900", purVal: "₹ 6,500" },
    { day: "Thu", sales: 8.5, purchases: 4.1, salesVal: "₹ 8,500", purVal: "₹ 4,100" },
    { day: "Fri", sales: 11.7, purchases: 5.8, salesVal: "₹ 11,700", purVal: "₹ 5,800" },
    { day: "Sat", sales: 15.2, purchases: 8.9, salesVal: "₹ 15,200", purVal: "₹ 8,900" },
    { day: "Sun", sales: 16.4, purchases: 7.8, salesVal: "₹ 16,400", purVal: "₹ 7,800" },
  ];

  const topMedicines = data?.topMedicines || [
    { rank: 1, name: "Paracetamol 500mg", qty: 35, amount: "₹ 1,750" },
    { rank: 2, name: "Crocin 650", qty: 20, amount: "₹ 1,600" },
    { rank: 3, name: "Azithromycin 500", qty: 12, amount: "₹ 1,440" },
    { rank: 4, name: "Pantoprazole 40mg", qty: 10, amount: "₹ 900" },
    { rank: 5, name: "Amoxicillin 500mg", qty: 8, amount: "₹ 800" },
  ];

  const recentInvoices = data?.recentInvoices || [
    { invoiceNo: "INV-000124", time: "04:12 PM", customer: "Walk-in", amount: "₹ 450" },
    { invoiceNo: "INV-000123", time: "03:50 PM", customer: "Walk-in", amount: "₹ 1,280" },
    { invoiceNo: "INV-000122", time: "03:20 PM", customer: "Rajesh Kumar", amount: "₹ 620" },
    { invoiceNo: "INV-000121", time: "02:45 PM", customer: "Walk-in", amount: "₹ 320" },
    { invoiceNo: "INV-000120", time: "02:10 PM", customer: "Suresh Patel", amount: "₹ 950" },
  ];

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Store overview and daily summary
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pos"
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-indigo-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>New Sale</span>
          </Link>

          <button
            onClick={fetchStats}
            title="Refresh"
            disabled={isLoading}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <CardSkeleton count={6} variant="compact" className="grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-3">
          {/* Sales */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500 font-medium truncate">Today's Sales</p>
                <p className="text-base font-bold text-slate-900 tracking-tight">{kpis.todaySales.amount}</p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span className="font-semibold text-emerald-600 flex items-center">
                <ArrowUpRight className="h-3 w-3 inline" /> {kpis.todaySales.percentChange}
              </span>
              <span>{kpis.todaySales.invoiceCount} bills</span>
            </div>
          </div>

          {/* Purchases */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500 font-medium truncate">Today's Purchases</p>
                <p className="text-base font-bold text-slate-900 tracking-tight">{kpis.todayPurchases.amount}</p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span className="text-slate-600 font-medium">Purchased</span>
              <span>{kpis.todayPurchases.invoiceCount} orders</span>
            </div>
          </div>

          {/* Stock Value */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                <Package className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500 font-medium truncate">Stock Value</p>
                <p className="text-base font-bold text-slate-900 tracking-tight">{kpis.currentStockValue.amount}</p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-medium">
              {kpis.currentStockValue.itemCount} in store
            </div>
          </div>

          {/* Low Stock */}
          <Link
            href="/products"
            className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-amber-300 transition"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500 font-medium truncate">Low Stock</p>
                <p className="text-base font-bold text-slate-900 tracking-tight">{kpis.lowStock.count}</p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-amber-600 font-semibold">
              View items →
            </div>
          </Link>

          {/* Expiring Soon */}
          <Link
            href="/batches-expiry"
            className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-rose-300 transition"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500 font-medium truncate">Expiring Soon</p>
                <p className="text-base font-bold text-slate-900 tracking-tight">{kpis.expiringSoon.count}</p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-rose-600 font-semibold">
              Next 30 days →
            </div>
          </Link>

          {/* Expired */}
          <Link
            href="/batches-expiry"
            className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-rose-300 transition"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500 font-medium truncate">Expired</p>
                <p className="text-base font-bold text-slate-900 tracking-tight">{kpis.expired.count}</p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-red-600 font-semibold">
              Manage batches →
            </div>
          </Link>
        </div>
      )}

      {/* Main Grid: Chart + Top Selling + Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Sales Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="font-bold text-xs text-slate-900">Sales vs Purchases (This Week)</h2>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                  <span className="text-slate-500 text-[11px]">Sales</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-500 text-[11px]">Purchases</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col h-48">
              <div className="flex-1 flex gap-2 sm:gap-3 items-end justify-between px-2 pt-2 border-b border-slate-100">
                {chartDays.map((item) => {
                  const maxRange = 20;
                  const salesHeight = Math.min(100, Math.max(8, (item.sales / maxRange) * 100));
                  const purHeight = Math.min(100, Math.max(8, (item.purchases / maxRange) * 100));

                  return (
                    <div
                      key={item.day}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] rounded-md px-2 py-1 pointer-events-none z-10 whitespace-nowrap shadow-md">
                        <div>Sales: {item.salesVal}</div>
                        <div>Purchases: {item.purVal}</div>
                      </div>

                      <div className="w-full flex justify-center items-end gap-1 h-full">
                        <div
                          style={{ height: `${salesHeight}%` }}
                          className="w-3 sm:w-3 bg-indigo-600 rounded-t-xs transition-all"
                        ></div>
                        <div
                          style={{ height: `${purHeight}%` }}
                          className="w-3 sm:w-3 bg-emerald-500 rounded-t-xs transition-all"
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between px-2 pt-2 text-[11px] text-slate-400 font-medium">
                {chartDays.map((item) => (
                  <span key={item.day} className="flex-1 text-center">
                    {item.day}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-slate-100 text-right">
            <Link href="/reports" className="text-xs text-indigo-600 font-semibold hover:underline">
              View Sales Reports →
            </Link>
          </div>
        </div>

        {/* Top Selling (4 cols) */}
        <div className="lg:col-span-4 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-xs text-slate-900">Top Selling Medicines</h2>
              <span className="text-[11px] text-slate-400">Today</span>
            </div>

            <div className="mt-2 overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs min-w-[280px] whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium text-[11px]">
                    <th className="py-2 px-1 min-w-[140px]">Medicine</th>
                    <th className="py-2 px-2 text-center min-w-[60px]">Sold</th>
                    <th className="py-2 px-2 text-right min-w-[80px]">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {topMedicines.map((med) => (
                    <tr key={med.rank} className="hover:bg-slate-50/60 transition">
                      <td className="py-2 px-1 font-medium text-slate-800">
                        {med.name}
                      </td>
                      <td className="py-2 px-2 text-center text-slate-600 font-medium">
                        {med.qty}
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-slate-900">
                        {med.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-right">
            <Link href="/products" className="text-xs text-indigo-600 font-semibold hover:underline">
              View All Products →
            </Link>
          </div>
        </div>

        {/* Recent Bills (3 cols) */}
        <div className="lg:col-span-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-xs text-slate-900">Recent Bills</h2>
              <Link href="/sales-history" className="text-xs text-indigo-600 font-semibold hover:underline">
                View All
              </Link>
            </div>

            <div className="mt-2 overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs min-w-[280px] whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium text-[11px]">
                    <th className="py-2 px-1 min-w-[90px]">Bill No</th>
                    <th className="py-2 px-1 min-w-[110px]">Customer</th>
                    <th className="py-2 px-1 text-right min-w-[80px]">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentInvoices.map((inv) => (
                    <tr key={inv.invoiceNo} className="hover:bg-slate-50/60 transition">
                      <td className="py-2 px-1 font-semibold text-indigo-600">
                        {inv.invoiceNo}
                      </td>
                      <td className="py-2 px-1 text-slate-600 truncate max-w-[120px]">
                        {inv.customer}
                      </td>
                      <td className="py-2 px-1 text-right font-bold text-slate-900">
                        {inv.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <Link
              href="/pos"
              className="w-full block text-center py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition"
            >
              + Create New Bill
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
