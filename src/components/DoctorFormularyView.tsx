"use client";

import React, { useState, useEffect } from "react";
import {
  Pill,
  Search,
  RefreshCw,
  Layers,
  Sparkles,
  ArrowRight,
  Store,
} from "lucide-react";
import { doctorApi, DoctorAuthUser, DoctorFormularyMedicine } from "@/lib/api/doctor.api";
import GenericSubstituteModal from "./GenericSubstituteModal";

interface DoctorFormularyViewProps {
  doctor: DoctorAuthUser | null;
  onPrescribeMedicine: (med: DoctorFormularyMedicine) => void;
}

export default function DoctorFormularyView({
  doctor,
  onPrescribeMedicine,
}: DoctorFormularyViewProps) {
  const [medicines, setMedicines] = useState<DoctorFormularyMedicine[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"ALL" | "IN_STOCK" | "OUT_OF_STOCK">("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Substitute modal
  const [substituteTarget, setSubstituteTarget] = useState<any>(null);
  const [isSubstituteModalOpen, setIsSubstituteModalOpen] = useState(false);

  useEffect(() => {
    loadCatalog();
  }, [doctor?.storeId]);

  const loadCatalog = async (q?: string) => {
    setIsLoading(true);
    try {
      const res = await doctorApi.getDoctorMedicines({
        storeId: doctor?.storeId,
        q: q || undefined,
        limit: 150,
      });
      if (res.success && res.medicines) {
        setMedicines(res.medicines);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = medicines.filter((m) => {
    if (stockFilter === "IN_STOCK" && m.stockStatus !== "IN_STOCK") return false;
    if (stockFilter === "OUT_OF_STOCK" && m.stockStatus === "IN_STOCK") return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      (m.genericName && m.genericName.toLowerCase().includes(q)) ||
      (m.brandName && m.brandName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Pill className="w-5 h-5 stroke-2" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Pharmacy Live Stock & Formulary Explorer
            </h1>
            <p className="text-xs text-slate-500">
              Real-time batch inventory, FEFO stock levels, and generic substitutes at{" "}
              <strong className="text-slate-700">{doctor?.storeName || "City Medical Store"}</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadCatalog(searchQuery)}
          className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
          <span>Refresh Live Stock</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medicine by brand or generic salt..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition"
          />
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setStockFilter("ALL")}
            className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg transition cursor-pointer ${
              stockFilter === "ALL" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
            }`}
          >
            All Medicines ({medicines.length})
          </button>
          <button
            type="button"
            onClick={() => setStockFilter("IN_STOCK")}
            className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg transition cursor-pointer ${
              stockFilter === "IN_STOCK" ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-500"
            }`}
          >
            In Stock
          </button>
          <button
            type="button"
            onClick={() => setStockFilter("OUT_OF_STOCK")}
            className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg transition cursor-pointer ${
              stockFilter === "OUT_OF_STOCK" ? "bg-white text-rose-700 shadow-2xs" : "text-slate-500"
            }`}
          >
            Out of Stock
          </button>
        </div>
      </div>

      {/* Catalog Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading live stock catalog...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-400">
          No medicines found matching &quot;{searchQuery}&quot;.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((med) => {
            const isAvailable = med.stockStatus === "IN_STOCK";
            return (
              <div
                key={med.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{med.name}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                        isAvailable
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {isAvailable ? `In Stock (${med.totalBaseQty})` : "Out of Stock"}
                    </span>
                  </div>

                  {med.genericName && (
                    <p className="text-xs text-slate-500">
                      Salt: <span className="font-medium text-slate-700">{med.genericName}</span>
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                    <span className="bg-slate-100 px-2 py-1 rounded font-medium">{med.dosageForm}</span>
                    <span>• MRP: ₹{med.mrp.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {!isAvailable && med.genericName ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSubstituteTarget(med);
                        setIsSubstituteModalOpen(true);
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Find Substitute</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400">FEFO Available</span>
                  )}

                  <button
                    type="button"
                    onClick={() => onPrescribeMedicine(med)}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <span>Prescribe</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Substitute Modal */}
      {isSubstituteModalOpen && substituteTarget && (
        <GenericSubstituteModal
          targetProduct={substituteTarget}
          isOpen={isSubstituteModalOpen}
          onClose={() => setIsSubstituteModalOpen(false)}
          onSelectSubstitute={(substitute) => {
            setIsSubstituteModalOpen(false);
            onPrescribeMedicine({
              ...substituteTarget,
              id: substitute.id,
              name: substitute.name,
              mrp: substitute.mrp,
              stockStatus: substitute.availableQty > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
              totalBaseQty: substitute.availableQty,
              packQty: Math.floor(substitute.availableQty / 10),
            } as any);
          }}
        />
      )}
    </div>
  );
}
