"use client";

import React, { useState, useEffect } from "react";
import {
  Scale,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Layers,
  ArrowRight,
  X,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { api, ProductItem } from "@/lib/api";

interface Unit {
  id: string;
  name: string;
  code: string;
  isBaseUnit: boolean;
  createdAt?: string;
}

interface UnitConversion {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  fromUnit: string;
  toUnit: string;
  factor: number;
}

export default function UnitsView() {
  const [activeTab, setActiveTab] = useState<"units" | "conversions">("units");
  const [units, setUnits] = useState<Unit[]>([]);
  const [conversions, setConversions] = useState<UnitConversion[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Create Unit Modal State
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [unitName, setUnitName] = useState("");
  const [unitCode, setUnitCode] = useState("");
  const [isBaseUnit, setIsBaseUnit] = useState(false);
  const [unitSaving, setUnitSaving] = useState(false);
  const [unitError, setUnitError] = useState("");

  // Create Conversion Modal State
  const [isConvModalOpen, setIsConvModalOpen] = useState(false);
  const [convProductId, setConvProductId] = useState("");
  const [convFromUnitId, setConvFromUnitId] = useState("");
  const [convToUnitId, setConvToUnitId] = useState("");
  const [convFactor, setConvFactor] = useState(10);
  const [convSaving, setConvSaving] = useState(false);
  const [convError, setConvError] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [uData, cData, pData] = await Promise.all([
        api.getUnits(),
        api.getUnitConversions(),
        api.getProducts(),
      ]);

      if (uData.units) setUnits(uData.units);
      if (cData.conversions) setConversions(cData.conversions);
      if (pData.products) setProducts(pData.products);
    } catch (err) {
      console.error("Failed to load units or conversions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName.trim() || !unitCode.trim()) {
      setUnitError("Unit name and code are required.");
      return;
    }

    setUnitSaving(true);
    setUnitError("");
    try {
      await api.createUnit({
        name: unitName.trim(),
        code: unitCode.trim().toUpperCase(),
        isBaseUnit,
      });
      setIsUnitModalOpen(false);
      setUnitName("");
      setUnitCode("");
      setIsBaseUnit(false);
      await loadData();
    } catch (err: any) {
      setUnitError(err.message || "Failed to create unit");
    } finally {
      setUnitSaving(false);
    }
  };

  const handleCreateConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convProductId || !convFromUnitId || !convToUnitId || convFactor <= 0) {
      setConvError("Please select product, units, and conversion factor > 0");
      return;
    }

    setConvSaving(true);
    setConvError("");
    try {
      await api.createUnitConversion({
        productId: convProductId,
        fromUnitId: convFromUnitId,
        toUnitId: convToUnitId,
        conversionFactor: Number(convFactor),
      });
      setIsConvModalOpen(false);
      setConvProductId("");
      setConvFactor(10);
      await loadData();
    } catch (err: any) {
      setConvError(err.message || "Failed to save unit conversion");
    } finally {
      setConvSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      {/* Page Title & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Units & Pack Conversions
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage pharmacy dispensing measurement units and product packaging multiplication factors
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "units" ? (
            <button
              onClick={() => {
                setUnitError("");
                setIsUnitModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Unit
            </button>
          ) : (
            <button
              onClick={() => {
                setConvError("");
                if (units.length >= 2) {
                  const strip = units.find((u) => u.code === "STRIP") || units[0];
                  const tab = units.find((u) => u.code === "TAB") || units[1];
                  setConvFromUnitId(strip.id);
                  setConvToUnitId(tab.id);
                }
                setIsConvModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Define Pack Conversion
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-4 text-xs">
        <button
          onClick={() => setActiveTab("units")}
          className={`pb-2 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === "units"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Scale className="h-4 w-4" />
          Unit Master ({units.length})
        </button>
        <button
          onClick={() => setActiveTab("conversions")}
          className={`pb-2 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === "conversions"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="h-4 w-4" />
          Product Pack Conversions ({conversions.length})
        </button>
      </div>

      {/* Tab 1: Units Master */}
      {activeTab === "units" && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs min-w-[800px] whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="px-3 py-2 w-12 text-center text-slate-400">#</th>
                    <th className="px-3 py-2 min-w-[150px]">Unit Name</th>
                    <th className="px-3 py-2 min-w-[120px]">Code / Symbol</th>
                    <th className="px-3 py-2 text-center min-w-[140px]">Unit Type</th>
                    <th className="px-3 py-2 min-w-[280px]">Description / Typical Usage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {units.map((u, idx) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-3 py-2 text-slate-400 font-mono font-medium">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2 font-bold text-slate-900">
                        {u.name}
                      </td>
                      <td className="px-3 py-2 font-mono font-semibold text-indigo-600">
                        {u.code}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {u.isBaseUnit ? (
                          <span className="inline-block px-2 py-1 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 text-[10px]">
                            Base Unit (Dispensable)
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200 text-[10px]">
                            Packaging Unit
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {u.code === "TAB"
                          ? "Single tablet dispensing unit"
                          : u.code === "STRIP"
                          ? "Blister/foil packaging unit"
                          : u.code === "BOX"
                          ? "Carton / Shipper outer packaging"
                          : u.code === "ML"
                          ? "Liquid suspension volume"
                          : u.code === "BTL"
                          ? "Syrup / Suspension bottle"
                          : "Standard measurement unit"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Conversions */}
      {activeTab === "conversions" && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs min-w-[800px] whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="px-3 py-2 w-12 text-center text-slate-400">#</th>
                    <th className="px-3 py-2 min-w-[220px]">Medicine Name</th>
                    <th className="px-3 py-2 min-w-[120px]">SKU</th>
                    <th className="px-3 py-2 min-w-[260px]">Packaging Conversion Rule</th>
                    <th className="px-3 py-2 text-center min-w-[100px]">Factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {conversions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-10 text-center text-slate-400">
                        No product pack conversions defined yet. Click "Define Pack Conversion" to add one.
                      </td>
                    </tr>
                  ) : (
                    conversions.map((c, idx) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-3 py-2 text-slate-400 font-mono font-medium">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2 font-bold text-slate-900">
                          {c.productName}
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-500">
                          {c.sku}
                        </td>
                        <td className="px-3 py-2">
                          <div className="inline-flex items-center gap-2 bg-slate-50 px-2 py-1 rounded border border-slate-200 text-slate-800 font-medium">
                            <span className="font-bold text-indigo-600">1 {c.fromUnit}</span>
                            <ArrowRight className="h-3 w-3 text-slate-400" />
                            <span className="font-bold text-emerald-600">
                              {c.factor} {c.toUnit}s
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-slate-900">
                          ×{c.factor}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Unit */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-white text-slate-900 flex items-center justify-between border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Add Measurement Unit</h3>
              <button
                onClick={() => setIsUnitModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUnit} className="p-5 space-y-4">
              {unitError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{unitError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sachet, Ampoule, Tube"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit Code / Symbol *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SAC, AMP, TUBE"
                  value={unitCode}
                  onChange={(e) => setUnitCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isBaseUnit"
                  checked={isBaseUnit}
                  onChange={(e) => setIsBaseUnit(e.target.checked)}
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isBaseUnit" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Is Base Unit (Smallest dispensable quantity)
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={unitSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-lg shadow-sm shadow-indigo-950/20 transition cursor-pointer"
                >
                  {unitSaving ? "Saving..." : "Save Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Define Conversion */}
      {isConvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-white text-slate-900 flex items-center justify-between border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Define Pack Conversion</h3>
              <button
                onClick={() => setIsConvModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateConversion} className="p-5 space-y-4">
              {convError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{convError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Medicine *
                </label>
                <select
                  required
                  value={convProductId}
                  onChange={(e) => setConvProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Select Medicine...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    From Packaging Unit
                  </label>
                  <select
                    value={convFromUnitId}
                    onChange={(e) => setConvFromUnitId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    To Base Unit
                  </label>
                  <select
                    value={convToUnitId}
                    onChange={(e) => setConvToUnitId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Conversion Factor (Units per Pack) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={convFactor}
                  onChange={(e) => setConvFactor(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Example: 1 Strip contains 10 Tablets
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsConvModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={convSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-lg shadow-sm shadow-indigo-950/20 transition cursor-pointer"
                >
                  {convSaving ? "Saving..." : "Save Conversion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
