"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Factory,
  Building2,
  Search,
  Package,
  Layers,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Plus,
  Pill,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";

interface ManufacturerStat {
  name: string;
  productCount: number;
  inStockCount: number;
  totalStock: number;
}

export default function ManufacturersView() {
  const [loading, setLoading] = useState(true);
  const [manufacturers, setManufacturers] = useState<ManufacturerStat[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStockStatus, setFilterStockStatus] = useState<"ALL" | "IN_STOCK" | "OUT_OF_STOCK">("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getManufacturers();
      if (res.success && res.details) {
        setManufacturers(res.details);
      } else if (res.success && res.manufacturers) {
        setManufacturers(
          res.manufacturers.map((m) => ({
            name: m,
            productCount: 1,
            inStockCount: 1,
            totalStock: 10,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load manufacturers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = manufacturers.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    if (!matchesSearch) return false;
    if (filterStockStatus === "IN_STOCK") return m.inStockCount > 0;
    if (filterStockStatus === "OUT_OF_STOCK") return m.inStockCount === 0;
    return true;
  });

  const totalCompanies = manufacturers.length;
  const totalProducts = manufacturers.reduce((s, m) => s + m.productCount, 0);
  const totalUnits = manufacturers.reduce((s, m) => s + m.totalStock, 0);

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
              <Factory className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Manufacturers
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Medicine manufacturing companies
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition shadow-2xs cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/products"
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Total Manufacturers
            </p>
            <p className="text-xl font-bold text-slate-900 mt-1">{totalCompanies}</p>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <Pill className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Active Medicines
            </p>
            <p className="text-xl font-bold text-slate-900 mt-1">{totalProducts}</p>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Available Stock (Units)
            </p>
            <p className="text-xl font-bold text-slate-900 mt-1">{totalUnits.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-3 sm:p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search manufacturer by name (e.g. Cipla, Sun, Mankind)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 hover:bg-slate-100/50 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {(["ALL", "IN_STOCK", "OUT_OF_STOCK"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStockStatus(status)}
              className={`px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterStockStatus === status
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {status === "ALL" && "All"}
              {status === "IN_STOCK" && "In Stock Only"}
              {status === "OUT_OF_STOCK" && "Out of Stock"}
            </button>
          ))}
        </div>
      </div>

      {/* Manufacturers Cards Grid */}
      {loading ? (
        <div className="p-10 text-center text-slate-400 space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-600" />
          <p className="text-xs font-semibold">Loading manufacturers portfolio...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200 shadow-2xs">
          <Building2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No manufacturers found</h3>
          <p className="text-xs text-slate-400 mt-1">Try modifying your search or filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((m) => {
            const stockPercent =
              m.productCount > 0 ? Math.round((m.inStockCount / m.productCount) * 100) : 0;

            return (
              <div
                key={m.name}
                className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs hover:border-indigo-300 transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-50 group-hover:text-indigo-600 transition">
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition">
                          {m.name}
                        </h3>
                        <span className="text-[10px] text-slate-400">Pharmaceutical Manufacturer</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded border ${
                        m.inStockCount > 0
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-600 border-rose-200"
                      }`}
                    >
                      {stockPercent}% In Stock
                    </span>
                  </div>

                  {/* Metrics Bar */}
                  <div className="grid grid-cols-3 gap-2 mt-3 p-2 bg-slate-50/70 rounded-lg text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">SKUs</span>
                      <span className="font-bold text-slate-900">{m.productCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">In Stock</span>
                      <span className="font-bold text-emerald-600">{m.inStockCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Units</span>
                      <span className="font-bold text-indigo-700">{m.totalStock}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[10px]">
                    {m.productCount} Registered Formulary
                  </span>

                  <Link
                    href={`/products?q=${encodeURIComponent(m.name)}`}
                    className="font-bold text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
                  >
                    <span>View Medicines</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
