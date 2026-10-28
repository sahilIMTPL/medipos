"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Truck,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { api, SupplierItem, ProductItem } from "@/lib/api";

interface PurchaseItemRow {
  productId: string;
  productName: string;
  sku: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  purchaseQty: number;
  unitRate: number;
  discountAmount: number;
  gstRate: number;
  mrp: number;
  unitsPerPack: number;
}

interface NewPurchaseViewProps {
  onBackToHistory: () => void;
  onSuccess: () => void;
}

export default function NewPurchaseView({ onBackToHistory, onSuccess }: NewPurchaseViewProps) {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form Header State
  const [supplierId, setSupplierId] = useState("");
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentRef, setPaymentRef] = useState("");

  // Items State
  const [items, setItems] = useState<PurchaseItemRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setInvoiceDate(new Date().toISOString().split("T")[0]);
    async function init() {
      setLoadingInitial(true);
      try {
        const [suppData, prodData] = await Promise.all([
          api.getSuppliers({ status: "ACTIVE" }),
          api.getProducts({ status: "ACTIVE" }),
        ]);

        if (suppData.suppliers && suppData.suppliers.length > 0) {
          setSuppliers(suppData.suppliers);
          setSupplierId(suppData.suppliers[0].id);
        }

        if (prodData.products && prodData.products.length > 0) {
          setProducts(prodData.products);
          // Add default first row
          const firstP = prodData.products[0];
          setItems([
            {
              productId: firstP.id,
              productName: firstP.name,
              sku: firstP.sku,
              batchNumber: `BAT-${firstP.sku.slice(-4)}-${new Date().getMonth() + 1}`,
              mfgDate: new Date().toISOString().split("T")[0],
              expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2))
                .toISOString()
                .split("T")[0],
              purchaseQty: 10,
              unitRate: firstP.defaultPurchasePrice || 25,
              discountAmount: 0,
              gstRate: firstP.gstRate || 12,
              mrp: firstP.mrp || 40,
              unitsPerPack: 10,
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to load initial purchase data", err);
      } finally {
        setLoadingInitial(false);
      }
    }
    init();
  }, []);

  const handleProductSelect = (index: number, selectedProdId: string) => {
    const prod = products.find((p) => p.id === selectedProdId);
    if (!prod) return;

    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        batchNumber: `BAT-${prod.sku.slice(-4)}-${Math.floor(100 + Math.random() * 900)}`,
        unitRate: prod.defaultPurchasePrice || 25,
        gstRate: prod.gstRate || 12,
        mrp: prod.mrp || 40,
      };
      return updated;
    });
  };

  const handleItemChange = (index: number, field: keyof PurchaseItemRow, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddRow = () => {
    if (products.length === 0) return;
    const defaultP = products[0];
    setItems((prev) => [
      ...prev,
      {
        productId: defaultP.id,
        productName: defaultP.name,
        sku: defaultP.sku,
        batchNumber: `BAT-${defaultP.sku.slice(-4)}-${Math.floor(100 + Math.random() * 900)}`,
        mfgDate: new Date().toISOString().split("T")[0],
        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2))
          .toISOString()
          .split("T")[0],
        purchaseQty: 10,
        unitRate: defaultP.defaultPurchasePrice || 25,
        discountAmount: 0,
        gstRate: defaultP.gstRate || 12,
        mrp: defaultP.mrp || 40,
        unitsPerPack: 10,
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Financial Calculations
  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let taxTotal = 0;

    for (const it of items) {
      const lineSub = Number(it.purchaseQty || 0) * Number(it.unitRate || 0);
      const disc = Number(it.discountAmount || 0);
      const taxable = Math.max(0, lineSub - disc);
      const tax = (taxable * Number(it.gstRate || 0)) / 100;

      subtotal += lineSub;
      totalDiscount += disc;
      taxTotal += tax;
    }

    const grandTotal = Math.max(0, subtotal - totalDiscount + taxTotal);
    return {
      subtotal: Number(subtotal.toFixed(2)),
      totalDiscount: Number(totalDiscount.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
    };
  };

  const totals = calculateTotals();
  const balanceDue = Math.max(0, totals.grandTotal - paidAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      setErrorMsg("Please select a supplier");
      return;
    }
    if (!supplierInvoiceNumber.trim()) {
      setErrorMsg("Supplier bill / invoice number is required");
      return;
    }
    if (items.length === 0) {
      setErrorMsg("Please add at least one medicine item");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      await api.createPurchase({
        supplierId,
        supplierInvoiceNumber: supplierInvoiceNumber.trim(),
        invoiceDate,
        paidAmount: Number(paidAmount || 0),
        paymentMethod,
        paymentReference: paymentRef.trim() || undefined,
        items: items.map((it) => ({
          productId: it.productId,
          batchNumber: it.batchNumber.trim().toUpperCase(),
          mfgDate: it.mfgDate || undefined,
          expiryDate: it.expiryDate,
          purchaseQty: Number(it.purchaseQty),
          unitRate: Number(it.unitRate),
          discountAmount: Number(it.discountAmount || 0),
          gstRate: Number(it.gstRate || 12),
          mrp: Number(it.mrp || 0),
          conversionFactor: Number(it.unitsPerPack || 10),
        })),
      });

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to record purchase receipt");
    } finally {
      setSaving(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-600" />
        Loading suppliers and medicine catalog...
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      {/* Page Title & Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToHistory}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg shadow-2xs transition cursor-pointer"
            title="Back to Purchase History"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              New Purchase
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter supplier bill and update stock
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToHistory}
            className="px-3 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-lg shadow-2xs flex items-center gap-2 transition cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Receiving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Post Purchase
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Invoice Details Header Card */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Select Supplier *
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-2 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.businessName} (Balance: ₹{Number(s.currentBalance).toFixed(0)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Supplier Bill / Invoice # *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. INV-9812"
              value={supplierInvoiceNumber}
              onChange={(e) => setSupplierInvoiceNumber(e.target.value.toUpperCase())}
              className="w-full px-2 py-2 border border-slate-200 rounded-lg text-slate-800 font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Invoice Date *
            </label>
            <input
              type="date"
              required
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-2 py-2 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-2 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="UPI">UPI / Net Banking</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Credit / Debit Card</option>
              <option value="CREDIT">On Credit (Pay Later)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
              Medicines &amp; Batch Receiving
            </h3>
            <span className="text-[11px] bg-white px-2 py-1 rounded border border-slate-200 text-slate-600 font-medium">
              {items.length} items
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddRow}
            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-200 flex items-center gap-1 transition cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            Add Row
          </button>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs min-w-[1050px] whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-3 py-2 min-w-[200px]">Medicine</th>
                <th className="px-3 py-2 min-w-[130px]">Batch No *</th>
                <th className="px-3 py-2 min-w-[130px]">Expiry Date *</th>
                <th className="px-3 py-2 text-center min-w-[100px]">Qty (Packs)</th>
                <th className="px-3 py-2 text-right min-w-[110px]">Cost Rate (₹)</th>
                <th className="px-3 py-2 text-right min-w-[90px]">Disc (₹)</th>
                <th className="px-3 py-2 text-center min-w-[90px]">GST %</th>
                <th className="px-3 py-2 text-right min-w-[100px]">MRP (₹)</th>
                <th className="px-3 py-2 text-right min-w-[110px]">Total (₹)</th>
                <th className="px-3 py-2 text-center min-w-[50px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.map((it, idx) => {
                const lineSub = it.purchaseQty * it.unitRate;
                const taxable = Math.max(0, lineSub - it.discountAmount);
                const tax = (taxable * it.gstRate) / 100;
                const lineTotal = taxable + tax;

                return (
                  <tr key={idx} className="hover:bg-slate-50/60 transition">
                    {/* Medicine dropdown */}
                    <td className="px-3 py-2">
                      <select
                        value={it.productId}
                        onChange={(e) => handleProductSelect(idx, e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-white text-slate-900 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Batch No */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        required
                        value={it.batchNumber}
                        onChange={(e) =>
                          handleItemChange(idx, "batchNumber", e.target.value.toUpperCase())
                        }
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-mono font-bold uppercase focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </td>

                    {/* Expiry Date */}
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        required
                        value={it.expiryDate}
                        onChange={(e) => handleItemChange(idx, "expiryDate", e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </td>

                    {/* Quantity */}
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min="1"
                        required
                        value={it.purchaseQty}
                        onChange={(e) =>
                          handleItemChange(idx, "purchaseQty", Math.max(1, Number(e.target.value)))
                        }
                        className="w-16 px-2 py-1 border border-slate-200 rounded text-xs font-bold text-center focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </td>

                    {/* Cost Rate */}
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={it.unitRate}
                        onChange={(e) =>
                          handleItemChange(idx, "unitRate", Math.max(0, Number(e.target.value)))
                        }
                        className="w-20 px-2 py-1 border border-slate-200 rounded text-xs text-right font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </td>

                    {/* Discount */}
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={it.discountAmount}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            "discountAmount",
                            Math.max(0, Number(e.target.value))
                          )
                        }
                        className="w-16 px-2 py-1 border border-slate-200 rounded text-xs text-right focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </td>

                    {/* GST % */}
                    <td className="px-3 py-2 text-center">
                      <select
                        value={it.gstRate}
                        onChange={(e) => handleItemChange(idx, "gstRate", Number(e.target.value))}
                        className="px-2 py-1 border border-slate-200 rounded text-xs bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                        <option value={28}>28%</option>
                      </select>
                    </td>

                    {/* MRP */}
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={it.mrp}
                        onChange={(e) =>
                          handleItemChange(idx, "mrp", Math.max(0, Number(e.target.value)))
                        }
                        className="w-20 px-2 py-1 border border-slate-200 rounded text-xs text-right font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </td>

                    {/* Line Total */}
                    <td className="px-3 py-2 text-right font-bold text-slate-900">
                      ₹{lineTotal.toFixed(2)}
                    </td>

                    {/* Remove button */}
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        disabled={items.length <= 1}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 disabled:opacity-20 transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer Calculation Grid */}
      <div className="flex justify-end">
        <div className="w-full max-w-md bg-white rounded-xl p-3 border border-slate-200 shadow-2xs space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal (Gross Item Total):</span>
            <span className="font-semibold text-slate-800">₹{totals.subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>Trade / Line Discount:</span>
            <span className="font-semibold text-slate-800">-₹{totals.totalDiscount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>GST Tax Amount (CGST + SGST):</span>
            <span className="font-semibold text-slate-800">+₹{totals.taxTotal.toFixed(2)}</span>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
            <span>Net Payable (Grand Total):</span>
            <span className="text-indigo-600 font-extrabold">₹{totals.grandTotal.toFixed(2)}</span>
          </div>

          <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Amount Paid (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Math.max(0, Number(e.target.value)))}
                className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm font-bold text-emerald-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <span className="block text-slate-500 font-medium mb-1">Balance Due</span>
              <div
                className={`text-sm font-bold ${
                  balanceDue > 0 ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                ₹{balanceDue.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
