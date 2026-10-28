"use client";

import React, { useState, useEffect } from "react";
import {
  CornerUpLeft,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Printer,
  X,
  Truck,
  FileText,
  AlertTriangle,
  Receipt,
  Layers,
} from "lucide-react";
import {
  api,
  PurchaseReturnListItem,
  PurchaseReturnPrintDetail,
  SupplierItem,
  ProductItem,
} from "@/lib/api";
import { triggerPrint } from "@/lib/print";

export default function PurchaseReturnsView() {
  const [returns, setReturns] = useState<PurchaseReturnListItem[]>([]);
  const [totalDebit, setTotalDebit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Suppliers list for dropdown
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);

  // Create Return Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [purchaseInvoiceNumber, setPurchaseInvoiceNumber] = useState("");
  const [returnReason, setReturnReason] = useState("Damaged / broken container");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [eligibleItems, setEligibleItems] = useState<
    Array<{
      productId: string;
      productName: string;
      batchId: string;
      batchNumber: string;
      expiryDate: string;
      availableQty: number;
      unit: string;
      unitCost: number;
      returnQty: number;
    }>
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [lookupError, setLookupError] = useState("");

  // Debit Note Print Modal
  const [debitNote, setDebitNote] = useState<PurchaseReturnPrintDetail | null>(null);
  const [printFormat, setPrintFormat] = useState<"80mm" | "A4">("A4");

  const loadData = async () => {
    setLoading(true);
    try {
      const [retData, supData, prodData] = await Promise.all([
        api.getPurchaseReturns({
          q: searchQuery || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
        api.getSuppliers(),
        api.getProducts(),
      ]);

      if (retData.success) {
        setReturns(retData.returns);
        setTotalDebit(retData.totalDebit);
      }
      if (supData.suppliers) {
        setSuppliers(supData.suppliers);
      }
      if (prodData.products) {
        setProducts(prodData.products);
      }
    } catch (err) {
      console.error("Failed to load purchase returns data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // Lookup purchase invoice
  const handleLookupPurchase = async () => {
    if (!purchaseInvoiceNumber.trim()) return;
    setLookupError("");
    try {
      const res = await api.getPurchaseReturnEligibleInvoice(purchaseInvoiceNumber);
      if (res.success && res.invoice) {
        setSelectedSupplierId(res.invoice.supplierId);
        setEligibleItems(
          res.invoice.items.map((it) => ({
            ...it,
            returnQty: 0,
          }))
        );
      }
    } catch (err: any) {
      setLookupError(err.message || "Purchase invoice not found");
    }
  };

  // Add Item to Return from Master if not using invoice lookup
  const handleAddDirectBatchItem = (batchId: string) => {
    for (const p of products) {
      const b = p.batches?.find((x) => x.id === batchId);
      if (b) {
        if (eligibleItems.some((x) => x.batchId === b.id)) return;
        setEligibleItems((prev) => [
          ...prev,
          {
            productId: p.id,
            productName: p.name,
            batchId: b.id,
            batchNumber: b.batchNumber,
            expiryDate: b.expiryDate,
            availableQty: b.availableQty,
            unit: p.baseUnit,
            unitCost: b.purchasePrice,
            returnQty: 1,
          },
        ]);
        return;
      }
    }
  };

  const calculateDebitTotal = () => {
    return eligibleItems.reduce((sum, it) => sum + it.returnQty * it.unitCost, 0);
  };

  // Submit Purchase Return
  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      alert("Please select a supplier.");
      return;
    }

    const itemsToSubmit = eligibleItems
      .filter((it) => it.returnQty > 0)
      .map((it) => ({
        productId: it.productId,
        batchId: it.batchId,
        returnQty: it.returnQty,
        unitRate: it.unitCost,
        reason: returnReason,
      }));

    if (itemsToSubmit.length === 0) {
      alert("Please specify a return quantity of at least 1 for an item.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createPurchaseReturn({
        supplierId: selectedSupplierId,
        purchaseInvoiceId: purchaseInvoiceNumber || undefined,
        reason: returnReason,
        items: itemsToSubmit,
      });

      if (res.success) {
        setIsCreateModalOpen(false);
        setEligibleItems([]);
        setPurchaseInvoiceNumber("");
        await loadData();

        // Open debit note
        handleViewDebitNote(res.returnId);
      }
    } catch (err: any) {
      alert(err.message || "Failed to create purchase return");
    } finally {
      setSubmitting(false);
    }
  };

  // View Debit Note Print Modal
  const handleViewDebitNote = async (returnId: string) => {
    try {
      const res = await api.getPurchaseReturnDetails(returnId);
      if (res.success && res.debitNote) {
        setDebitNote(res.debitNote);
      }
    } catch (err: any) {
      alert(err.message || "Could not load debit note");
    }
  };

  const debitTotal = calculateDebitTotal();

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Purchase Returns
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Return damaged or expired medicines to suppliers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 shadow-2xs transition cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => {
              setEligibleItems([]);
              setPurchaseInvoiceNumber("");
              setLookupError("");
              setIsCreateModalOpen(true);
            }}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm shadow-indigo-950/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Purchase Return
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Debit Notes</span>
            <CornerUpLeft className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{returns.length}</div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Total Debit Value</span>
            <Receipt className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-700">₹{totalDebit.toFixed(2)}</div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-600 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Suppliers Returned</span>
            <Truck className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-indigo-700">
            {new Set(returns.map((r) => r.supplierId)).size}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search debit note #, vendor name, invoice #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 hover:bg-slate-100/50 focus:bg-white"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700"
          />
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs min-w-[1150px] whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3 py-2 min-w-[130px]">Debit Note #</th>
                <th className="px-3 py-2 min-w-[110px]">Date</th>
                <th className="px-3 py-2 min-w-[200px]">Supplier / Vendor</th>
                <th className="px-3 py-2 min-w-[140px]">Original Purchase</th>
                <th className="px-3 py-2 text-center min-w-[120px]">Batches Returned</th>
                <th className="px-3 py-2 text-right min-w-[120px]">Debit Total</th>
                <th className="px-3 py-2 min-w-[180px]">Reason</th>
                <th className="px-3 py-2 text-right min-w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading purchase returns...
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <CornerUpLeft className="h-7 w-7 mx-auto mb-2 text-slate-300" />
                    No purchase returns recorded yet.
                  </td>
                </tr>
              ) : (
                returns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-3 py-2 font-mono font-bold text-indigo-600">
                      {ret.returnNumber}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {new Date(ret.returnDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-semibold text-slate-900">{ret.supplierName}</div>
                      {ret.supplierGstin && (
                        <div className="text-[10px] text-slate-400">GST: {ret.supplierGstin}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-700">
                      {ret.purchaseInvoiceNumber}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="inline-block px-2 py-1 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {ret.itemCount} items
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-amber-700">
                      ₹{ret.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-slate-600 max-w-xs truncate" title={ret.reason}>
                      {ret.reason}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => handleViewDebitNote(ret.id)}
                        className="px-2 py-1 rounded border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 font-semibold text-xs transition flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Printer className="h-3 w-3" />
                        Debit Note
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Purchase Return Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="px-6 py-4 bg-white border-b border-slate-100 text-slate-900 flex items-center justify-between no-print print:hidden">
              <div>
                <h3 className="font-bold text-base text-slate-900">Create Purchase Return / Debit Note</h3>
                <p className="text-xs text-slate-500">
                  Deduct batch inventory stock and apply debit balance to vendor
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Supplier & Invoice Lookup Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Select Supplier *
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">-- Choose Vendor --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.businessName} (Bal: ₹{s.currentBalance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Optional: Purchase Invoice #
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. PUR-2026-0001"
                      value={purchaseInvoiceNumber}
                      onChange={(e) => setPurchaseInvoiceNumber(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleLookupPurchase}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-bold"
                    >
                      Fetch
                    </button>
                  </div>
                  {lookupError && (
                    <span className="text-[10px] text-rose-600 block mt-1">{lookupError}</span>
                  )}
                </div>
              </div>

              {/* Add Batch Direct Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select Medicine Batch to Return
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddDirectBatchItem(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:outline-none"
                >
                  <option value="">-- Pick active medicine batch from inventory --</option>
                  {products.map((p) =>
                    p.batches
                      ?.filter((b) => b.availableQty > 0)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {p.name} • Batch: {b.batchNumber} (Exp: {b.expiryDate} • Stock: {b.availableQty} {p.baseUnit}s)
                        </option>
                      ))
                  )}
                </select>
              </div>

              {/* Eligible Return Items Table */}
              {eligibleItems.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full text-left min-w-[700px] whitespace-nowrap">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-semibold uppercase">
                        <tr>
                          <th className="px-4 py-2 min-w-[200px]">Medicine / Batch</th>
                          <th className="px-3 py-2 text-center min-w-[100px]">Available Stock</th>
                          <th className="px-3 py-2 text-center min-w-[100px]">Return Qty</th>
                          <th className="px-3 py-2 text-right min-w-[90px]">Unit Rate</th>
                          <th className="px-4 py-2 text-right min-w-[100px]">Debit Total</th>
                          <th className="px-2 py-2 text-center min-w-[50px]"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {eligibleItems.map((it, idx) => {
                          const lineTotal = it.returnQty * it.unitCost;
                          return (
                            <tr key={it.batchId} className="hover:bg-slate-50/50">
                              <td className="px-4 py-2">
                                <div className="font-bold text-slate-900">{it.productName}</div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  B:{it.batchNumber} • Exp:{it.expiryDate}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-center font-semibold text-slate-700">
                                {it.availableQty} {it.unit}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  max={it.availableQty}
                                  value={it.returnQty}
                                  onChange={(e) => {
                                    const val = Math.max(
                                      1,
                                      Math.min(it.availableQty, parseInt(e.target.value, 10) || 1)
                                    );
                                    setEligibleItems((prev) => {
                                      const copy = [...prev];
                                      copy[idx].returnQty = val;
                                      return copy;
                                    });
                                  }}
                                  className="w-14 text-center px-2 py-1 border border-slate-300 rounded font-bold text-xs focus:outline-none"
                                />
                              </td>
                              <td className="px-3 py-2 text-right text-slate-700">
                                ₹{it.unitCost.toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-right font-bold text-amber-800">
                                ₹{lineTotal.toFixed(2)}
                              </td>
                              <td className="px-2 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEligibleItems((prev) => prev.filter((_, i) => i !== idx))
                                  }
                                  className="text-slate-400 hover:text-rose-600"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Reason Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Reason for Return to Supplier
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:outline-none"
                >
                  <option value="Damaged / broken container">Damaged / broken container</option>
                  <option value="Near expiry / rejected on delivery">Near expiry / rejected on delivery</option>
                  <option value="Supplier recall / quality advisory">Supplier recall / quality advisory</option>
                  <option value="Excess delivery against PO">Excess delivery against PO</option>
                  <option value="Slow moving stock return agreement">Slow moving stock return agreement</option>
                </select>
              </div>

              {/* Debit Summary Banner */}
              <div className="p-4 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-xs text-slate-500 block uppercase tracking-wider font-semibold">
                    Total Debit Note Amount
                  </span>
                  <span className="text-xs text-slate-600">
                    Will be deducted from supplier balance
                  </span>
                </div>
                <div className="text-2xl font-black text-amber-600">
                  ₹{debitTotal.toFixed(2)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || debitTotal <= 0}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-xs rounded-lg shadow-sm shadow-indigo-950/20 transition"
                >
                  {submitting ? "Creating Debit Note..." : "Confirm Return & Generate Debit Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Debit Note Print Modal */}
      {debitNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="px-6 py-4 bg-white border-b border-slate-100 text-slate-900 flex items-center justify-between no-print print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">{debitNote.returnNumber}</h3>
                  <p className="text-xs text-slate-500">Supplier Debit Note Voucher</p>
                </div>
              </div>

              <button
                onClick={() => setDebitNote(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto bg-slate-50 flex justify-center">
              <div id="printable-area" className="bg-white p-6 shadow border border-slate-200 text-slate-900 w-full text-xs space-y-4 print:border-none print:shadow-none print:p-0">
                {/* Header */}
                <div className="flex justify-between items-start pb-3 border-b border-slate-200">
                  <div>
                    <h2 className="font-extrabold text-sm uppercase text-slate-900">{debitNote.store.name}</h2>
                    <p className="text-slate-500 text-[11px]">{debitNote.store.address}, {debitNote.store.city}</p>
                    <p className="text-slate-500 text-[11px]">Ph: {debitNote.store.phone} • GSTIN: {debitNote.store.gstin}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-amber-700 text-sm block">DEBIT NOTE</span>
                    <span className="font-mono font-bold text-slate-800">{debitNote.returnNumber}</span>
                    <p className="text-slate-500 text-[10px]">Date: {new Date(debitNote.returnDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Vendor details */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div className="font-bold text-slate-900 uppercase">Vendor: {debitNote.supplier.name}</div>
                  <div className="text-slate-600 text-[11px]">GSTIN: {debitNote.supplier.gstin || "Unregistered"}</div>
                  <div className="text-slate-600 text-[11px]">Reason: {debitNote.reason}</div>
                </div>

                {/* Items */}
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left text-xs border border-slate-200 min-w-[340px]">
                    <thead className="bg-slate-100 text-slate-700 text-[11px] uppercase">
                      <tr>
                        <th className="px-3 py-2 min-w-[140px]">Medicine / Batch</th>
                        <th className="px-2 py-2 text-center min-w-[60px]">Qty</th>
                        <th className="px-3 py-2 text-right min-w-[70px]">Rate</th>
                        <th className="px-3 py-2 text-right min-w-[70px]">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {debitNote.items.map((it, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2">
                            <span className="font-bold">{it.productName}</span>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Batch: {it.batchNumber} • Exp: {it.expiryDate}
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center font-bold">
                            {it.returnQty} {it.unit}
                          </td>
                          <td className="px-3 py-2 text-right">₹{it.unitRate.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right font-bold">₹{it.totalAmount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total */}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-800">TOTAL DEBIT AMOUNT:</span>
                  <span className="font-black text-amber-700 text-base">₹{debitNote.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center no-print print:hidden">
              <button
                onClick={() => setDebitNote(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => triggerPrint("printable-area")}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm shadow-indigo-950/20 transition flex items-center gap-2 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                Print Debit Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
