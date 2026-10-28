"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Sparkles, Save, AlertCircle, RefreshCw, Database, Check } from "lucide-react";
import { api, ProductItem, CategoryItem, DrugCentralProduct } from "@/lib/api";

interface AddEditProductModalProps {
  productToEdit?: ProductItem | null;
  categories: CategoryItem[];
  manufacturers: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddEditProductModal({
  productToEdit,
  categories,
  manufacturers,
  onClose,
  onSuccess,
}: AddEditProductModalProps) {
  const isEditMode = Boolean(productToEdit);

  // Form State
  const [name, setName] = useState(productToEdit?.name || "");
  const [brandName, setBrandName] = useState(productToEdit?.brandName || "");
  const [categoryId, setCategoryId] = useState(productToEdit?.categoryId || "");
  const [dosageForm, setDosageForm] = useState(productToEdit?.dosageForm || "Tablet");
  const [packDescription, setPackDescription] = useState(productToEdit?.packDescription || "Strip (10)");
  const [unitsPerPack, setUnitsPerPack] = useState(10);

  const [sku, setSku] = useState(productToEdit?.sku || "");
  const [barcode, setBarcode] = useState(productToEdit?.barcode || "");
  const [mrp, setMrp] = useState(productToEdit?.mrp !== undefined ? productToEdit.mrp : 0);
  const [purchasePrice, setPurchasePrice] = useState(
    productToEdit?.defaultPurchasePrice !== undefined ? productToEdit.defaultPurchasePrice : 0
  );
  const [reorderLevel, setReorderLevel] = useState(
    productToEdit?.reorderLevel !== undefined ? productToEdit.reorderLevel : 10
  );
  const [isPrescriptionRequired, setIsPrescriptionRequired] = useState(
    productToEdit?.isPrescriptionRequired || false
  );
  const [isActive, setIsActive] = useState(
    productToEdit?.isActive !== undefined ? productToEdit.isActive : true
  );

  // Opening batch (only for new product)
  const [hasOpeningStock, setHasOpeningStock] = useState(false);
  const [initialBatchNumber, setInitialBatchNumber] = useState("");
  const [initialExpiryDate, setInitialExpiryDate] = useState("");
  const [initialQuantity, setInitialQuantity] = useState(10);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // DrugCentral Autocomplete State
  const [drugSuggestions, setDrugSuggestions] = useState<DrugCentralProduct[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [verifiedDrug, setVerifiedDrug] = useState<DrugCentralProduct | null>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionContainerRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        suggestionContainerRef.current &&
        !suggestionContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // DrugCentral live search as user types medicine name
  useEffect(() => {
    if (isEditMode) return;
    if (!name || name.trim().length < 2) {
      setDrugSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await api.searchDrugCentral(name.trim(), 6);
        if (res.success && res.medicines) {
          setDrugSuggestions(res.medicines);
          setShowSuggestions(res.medicines.length > 0);
        }
      } catch {
        // ignore network error
      } finally {
        setLoadingSuggestions(false);
      }
    }, 250);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [name, isEditMode]);

  const handleSelectDrugSuggestion = (drug: DrugCentralProduct) => {
    setName(drug.productName);
    setBrandName(drug.productName);
    setVerifiedDrug(drug);
    setShowSuggestions(false);

    // Auto-map dosage form
    const rawForm = (drug.dosageForm || "").toUpperCase();
    if (rawForm.includes("CAPSULE")) {
      setDosageForm("Capsule");
      setPackDescription("Strip (10)");
      setUnitsPerPack(10);
    } else if (
      rawForm.includes("SYRUP") ||
      rawForm.includes("SUSPENSION") ||
      rawForm.includes("SOLUTION") ||
      rawForm.includes("ELIXIR")
    ) {
      setDosageForm("Syrup");
      setPackDescription("Bottle (100ml)");
      setUnitsPerPack(1);
    } else if (rawForm.includes("INJECTION")) {
      setDosageForm("Injection");
      setPackDescription("Vial (1)");
      setUnitsPerPack(1);
    } else if (
      rawForm.includes("OINTMENT") ||
      rawForm.includes("CREAM") ||
      rawForm.includes("GEL")
    ) {
      setDosageForm("Ointment");
      setPackDescription("Tube (30g)");
      setUnitsPerPack(1);
    } else if (rawForm.includes("DROP")) {
      setDosageForm("Drops");
      setPackDescription("Bottle (15ml)");
      setUnitsPerPack(1);
    } else {
      setDosageForm("Tablet");
      setPackDescription("Strip (10)");
      setUnitsPerPack(10);
    }

    setIsPrescriptionRequired(true);
  };

  useEffect(() => {
    if (!isEditMode && !sku && name) {
      const initials = name
        .replace(/[^a-zA-Z]/g, "")
        .slice(0, 3)
        .toUpperCase();
      const randomNum = Math.floor(100 + Math.random() * 900);
      setSku(`MED-${initials}-${randomNum}`);
    }
  }, [name, isEditMode, sku]);

  const handleGenerateBarcode = () => {
    const generated = `890${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    setBarcode(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Please enter the medicine name");
      return;
    }
    if (mrp <= 0) {
      setErrorMsg("Please enter a valid price (MRP)");
      return;
    }

    setLoading(true);
    try {
      if (isEditMode && productToEdit) {
        await api.updateProduct(productToEdit.id, {
          name: name.trim(),
          brandName: brandName.trim() || undefined,
          categoryId: categoryId || undefined,
          dosageForm,
          packDescription: packDescription.trim(),
          barcode: barcode.trim() || undefined,
          mrp: Number(mrp),
          defaultPurchasePrice: Number(purchasePrice),
          defaultSellingPrice: Number(mrp),
          reorderLevel: Number(reorderLevel),
          isPrescriptionRequired,
          isActive,
        });
      } else {
        await api.createProduct({
          name: name.trim(),
          brandName: brandName.trim() || undefined,
          categoryId: categoryId || undefined,
          dosageForm,
          packDescription: packDescription.trim(),
          unitsPerPack: Number(unitsPerPack || 10),
          sku: sku.trim() || `MED-${Date.now().toString().slice(-6)}`,
          barcode: barcode.trim() || undefined,
          mrp: Number(mrp),
          defaultPurchasePrice: Number(purchasePrice),
          defaultSellingPrice: Number(mrp),
          reorderLevel: Number(reorderLevel),
          isPrescriptionRequired,
          initialBatchNumber: hasOpeningStock ? initialBatchNumber.trim() : undefined,
          initialExpiryDate: hasOpeningStock ? initialExpiryDate : undefined,
          initialQuantity: hasOpeningStock ? Number(initialQuantity) : undefined,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg text-slate-900 leading-tight">
              {isEditMode ? "Edit Product" : "Add New Product"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter product details and pricing
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-5">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <div className="relative" ref={suggestionContainerRef}>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Medicine Name *
                  </label>
                  {!isEditMode && (
                    <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      <span>DrugCentral Auto-fill Enabled</span>
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol 500mg, Amoxicillin (type to search master database)..."
                    value={name}
                    onFocus={() => {
                      if (drugSuggestions.length > 0) setShowSuggestions(true);
                    }}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (verifiedDrug && e.target.value !== verifiedDrug.productName) {
                        setVerifiedDrug(null);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  />

                  {loadingSuggestions && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                    </div>
                  )}
                </div>

                {/* DrugCentral Verified Pill */}
                {verifiedDrug && (
                  <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>
                        Verified Formulation: <strong>{verifiedDrug.genericName || verifiedDrug.productName}</strong> ({verifiedDrug.dosageForm})
                      </span>
                    </div>
                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-1 rounded-md">
                      DrugCentral
                    </span>
                  </div>
                )}

                {/* Live Suggestions Dropdown */}
                {showSuggestions && drugSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-100">
                    <div className="px-3 py-2 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Verified DrugCentral Master Database Formulations</span>
                      <span>Click to Auto-fill</span>
                    </div>

                    {drugSuggestions.map((drug) => (
                      <button
                        key={drug.id}
                        type="button"
                        onClick={() => handleSelectDrugSuggestion(drug)}
                        className="w-full p-3 text-left hover:bg-indigo-50/70 transition flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-700 transition truncate">
                              {drug.productName}
                            </span>
                            <span className="px-2 py-1 rounded-md text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {drug.dosageForm}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 truncate mt-1">
                            Salt: {drug.genericName || drug.productName}
                          </p>

                          {drug.activeIngredients && drug.activeIngredients.length > 0 && (
                            <div className="text-[10px] text-slate-400 mt-1 font-mono truncate">
                              {drug.activeIngredients
                                .map((ai) => `${ai.name} ${ai.quantity || ""}${ai.unit || ""}`)
                                .join(" + ")}
                            </div>
                          )}
                        </div>

                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white rounded-lg text-xs font-semibold transition whitespace-nowrap">
                          Auto-fill
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Medicine Type
                  </label>
                  <select
                    value={dosageForm}
                    onChange={(e) => setDosageForm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Drops">Eye/Ear Drops</option>
                    <option value="Ointment">Cream / Ointment</option>
                    <option value="Inhaler">Inhaler</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pack Size
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Strip of 10, Bottle 100ml"
                    value={packDescription}
                    onChange={(e) => setPackDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Barcode
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Scan or enter barcode"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateBarcode}
                      title="Generate Barcode"
                      className="px-3 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing & Alerts */}
            <div className="pt-2 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    MRP / Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={mrp || ""}
                    onChange={(e) => setMrp(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cost Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={purchasePrice || ""}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Low Stock Alert
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Prescription Checkbox */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrescriptionRequired}
                  onChange={(e) => setIsPrescriptionRequired(e.target.checked)}
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Requires Doctor Prescription (Rx)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-600 font-medium">Active</span>
              </label>
            </div>

            {/* Opening Stock (Only for New Products) */}
            {!isEditMode && (
              <div className="border border-slate-200 rounded-xl p-3 space-y-3 bg-slate-50/50">
                <label className="flex items-center gap-3 cursor-pointer font-semibold text-xs text-slate-800">
                  <input
                    type="checkbox"
                    checked={hasOpeningStock}
                    onChange={(e) => setHasOpeningStock(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Add Initial Stock Now (Optional)</span>
                </label>

                {hasOpeningStock && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Batch Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. BATCH-01"
                        value={initialBatchNumber}
                        onChange={(e) => setInitialBatchNumber(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        value={initialExpiryDate}
                        onChange={(e) => setInitialExpiryDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Quantity (Packs)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={initialQuantity}
                        onChange={(e) => setInitialQuantity(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-sm shadow-indigo-600/20 flex items-center gap-2 transition cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{isEditMode ? "Save Changes" : "Save Product"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
