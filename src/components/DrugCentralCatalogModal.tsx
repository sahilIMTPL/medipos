"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  X,
  Pill,
  Download,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Database,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { api, DrugCentralProduct } from "@/lib/api";

interface DrugCentralCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

export default function DrugCentralCatalogModal({
  isOpen,
  onClose,
  onImportSuccess,
}: DrugCentralCatalogModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [medicines, setMedicines] = useState<DrugCentralProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [customPrice, setCustomPrice] = useState<Record<number, number>>({});

  useEffect(() => {
    if (isOpen) {
      // Default initial query with popular formulations
      handleSearch("Amoxicillin");
    }
  }, [isOpen]);

  const handleSearch = async (term: string) => {
    if (!term || term.trim().length < 2) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await api.searchDrugCentral(term.trim(), 25);
      if (res.success) {
        setMedicines(res.medicines || []);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to search DrugCentral catalog.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (med: DrugCentralProduct) => {
    setImportingId(med.id);
    setErrorMessage("");
    setSuccessMessage("");
    const price = customPrice[med.id] || 50.0;

    try {
      const res = await api.importDrugCentralMedicine(med.id, undefined, price);
      if (res.success) {
        setSuccessMessage(`"${med.productName}" successfully added to inventory catalog!`);
        if (onImportSuccess) {
          onImportSuccess();
        }
      } else {
        setErrorMessage(res.message || "Failed to import medicine.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error importing medicine to inventory.");
    } finally {
      setImportingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-slate-900 leading-tight">
                  DrugCentral Master Medicine Catalog
                </h2>
                <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  150,000+ Formulations
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Search verified chemical salts and import directly into your store inventory
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(searchQuery);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by brand name, generic salt, or formulation (e.g. Paracetamol, Augmentin, Metformin)..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Search</span>
            </button>
          </form>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar text-xs">
            <span className="text-[11px] font-semibold text-slate-400">Popular:</span>
            {["Paracetamol", "Amoxicillin", "Metformin", "Ciprofloxacin", "Azithromycin", "Pantoprazole"].map(
              (term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setSearchQuery(term);
                    handleSearch(term);
                  }}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-600 text-[11px] font-medium transition cursor-pointer"
                >
                  {term}
                </button>
              )
            )}
          </div>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage("")}
              className="text-rose-700 hover:text-rose-900"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Results List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">
                Searching 150,000+ formulations in DrugCentral...
              </p>
            </div>
          ) : medicines.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <Pill className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No medicines found</p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching for a different generic chemical name or formulation.
              </p>
            </div>
          ) : (
            medicines.map((m) => {
              const isImporting = importingId === m.id;
              const price = customPrice[m.id] !== undefined ? customPrice[m.id] : 50;

              return (
                <div
                  key={m.id}
                  className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-indigo-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">{m.productName}</span>
                      <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {m.dosageForm}
                      </span>
                      <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                        {m.route}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-medium">
                      Generic: <strong className="text-slate-700">{m.genericName || m.productName}</strong>
                    </p>

                    {m.activeIngredients && m.activeIngredients.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-1 text-[11px] text-slate-600">
                        <span className="text-slate-400 font-semibold">Active Composition:</span>
                        {m.activeIngredients.map((ai, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded-md bg-slate-50 border border-slate-200 font-mono text-[10px]"
                          >
                            {ai.name} {ai.quantity ? `${ai.quantity}${ai.unit || ""}` : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions & Price */}
                  <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-auto">
                    <div className="text-right">
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">
                        Store MRP (₹)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={price}
                        onChange={(e) =>
                          setCustomPrice((prev) => ({
                            ...prev,
                            [m.id]: Number(e.target.value),
                          }))
                        }
                        className="w-20 px-2 py-1 text-center font-bold text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={isImporting}
                      onClick={() => handleImport(m)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Importing...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Import</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Found {medicines.length} formulations</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-bold transition cursor-pointer"
          >
            Close Catalog
          </button>
        </div>
      </div>
    </div>
  );
}

