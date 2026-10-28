"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Search,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  DollarSign,
  CreditCard,
  FileText,
} from "lucide-react";
import { api, PurchaseItemDetail, SupplierItem } from "@/lib/api";
import GstBillDetailModal from "./GstBillDetailModal";
import { RegisterPaymentModal } from "./RegisterPaymentModal";
import { useStore } from "@/context/StoreContext";

interface PurchasesHistoryViewProps {
  onNavigateToNewPurchase: () => void;
}

export default function PurchasesHistoryView({
  onNavigateToNewPurchase,
}: PurchasesHistoryViewProps) {
  const { currentStore } = useStore();
  const [purchases, setPurchases] = useState<PurchaseItemDetail[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("ALL");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("ALL");

  // Details Modal
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);

  // Register Payment Modal
  const [paymentModalState, setPaymentModalState] = useState<{
    isOpen: boolean;
    purchase: any | null;
  }>({
    isOpen: false,
    purchase: null,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [pData, sData] = await Promise.all([
        api.getPurchases({
          q: searchQuery || undefined,
          supplierId: selectedSupplier !== "ALL" ? selectedSupplier : undefined,
          paymentStatus: selectedPaymentStatus !== "ALL" ? selectedPaymentStatus : undefined,
          storeId: currentStore?.id || undefined,
        }),
        api.getSuppliers({ storeId: currentStore?.id || undefined }),
      ]);

      if (pData.purchases) setPurchases(pData.purchases);
      if (sData.suppliers) setSuppliers(sData.suppliers);
    } catch (err) {
      console.error("Failed to load purchase invoices", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSupplier, selectedPaymentStatus, currentStore?.id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // KPI Calculations
  const totalInvoices = purchases.length;
  const totalAmountSum = purchases.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0);
  const totalPaidSum = purchases.reduce((sum, p) => sum + Number(p.paidAmount || 0), 0);
  const totalDueSum = purchases.reduce((sum, p) => sum + Number(p.balanceDue || 0), 0);

  return (
    <div className="p-4 max-w-[1600px] mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Purchases</h1>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700">
              {totalInvoices} invoices
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Track supplier bills and purchases</p>
        </div>

        <button
          onClick={onNavigateToNewPurchase}
          className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-2xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Purchase</span>
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Bills</span>
            <FileText className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{totalInvoices}</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Purchases</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            ₹{totalAmountSum.toFixed(2)}
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Amount Paid</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-600">
            ₹{totalPaidSum.toFixed(2)}
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Dues</span>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </div>
          <div
            className={`text-xl font-bold ${
              totalDueSum > 0 ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            ₹{totalDueSum.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search voucher #, bill #, supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="px-2 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
          >
            <option value="ALL">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.businessName}
              </option>
            ))}
          </select>

          <select
            value={selectedPaymentStatus}
            onChange={(e) => setSelectedPaymentStatus(e.target.value)}
            className="px-2 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
          >
            <option value="ALL">All Status</option>
            <option value="PAID">Paid</option>
            <option value="PARTIAL">Partial</option>
            <option value="UNPAID">Unpaid</option>
          </select>

          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedSupplier("ALL");
              setSelectedPaymentStatus("ALL");
              loadData();
            }}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition"
            title="Reset Filters & Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs min-w-[1320px] whitespace-nowrap">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4 text-center w-12 text-slate-400">#</th>
                <th className="py-3 px-4 min-w-[140px]">Voucher #</th>
                <th className="py-3 px-4 min-w-[130px]">Supplier Bill #</th>
                <th className="py-3 px-4 min-w-[220px]">Supplier</th>
                <th className="py-3 px-4 min-w-[120px]">Date</th>
                <th className="py-3 px-4 text-center min-w-[70px]">Items</th>
                <th className="py-3 px-4 text-right min-w-[120px]">Invoice Total</th>
                <th className="py-3 px-4 text-right min-w-[120px]">Paid Amount</th>
                <th className="py-3 px-4 text-right min-w-[120px]">Balance Due</th>
                <th className="py-3 px-4 text-center min-w-[120px]">Status</th>
                <th className="py-3 px-4 text-center min-w-[110px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading purchase history...</span>
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    <ShoppingBag className="h-6 w-6 mx-auto mb-2 text-slate-300" />
                    <span>No purchase invoices found matching your query.</span>
                  </td>
                </tr>
              ) : (
                purchases.map((purchase, index) => (
                  <tr
                    key={purchase.id}
                    onClick={() => setSelectedPurchaseId(purchase.id)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    title="Click row to view purchase details"
                  >
                    {/* # Index Column */}
                    <td className="py-3 px-4 text-center text-xs font-medium text-slate-400">
                      {index + 1}
                    </td>

                    {/* Voucher # */}
                    <td className="py-3 px-4 font-semibold text-blue-600 hover:text-blue-700 hover:underline font-mono text-xs">
                      {purchase.invoiceNumber}
                    </td>

                    {/* Supplier Bill # */}
                    <td className="py-3 px-4 font-medium text-slate-600 font-mono text-xs">
                      {purchase.supplierInvoiceNumber || "—"}
                    </td>

                    {/* Supplier with Initials Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100/60 flex items-center justify-center font-bold text-xs shrink-0">
                          {purchase.supplierName
                            ? (purchase.supplierName.trim().slice(0, 2)).toUpperCase()
                            : "SP"}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 text-xs">
                            {purchase.supplierName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {purchase.supplierPhone || purchase.supplierGstin || "Distributor"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-700 text-xs">
                      {purchase.invoiceDate}
                    </td>

                    {/* Items */}
                    <td className="py-3 px-4 text-center font-medium text-slate-600 text-xs">
                      {purchase.itemCount}
                    </td>

                    {/* Invoice Total */}
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 font-mono text-xs">
                      ₹{purchase.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Paid */}
                    <td className="py-3 px-4 text-right text-emerald-600 font-semibold font-mono text-xs">
                      ₹{purchase.paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Balance Due */}
                    <td className="py-3 px-4 text-right font-semibold font-mono text-xs">
                      <span
                        className={
                          purchase.balanceDue > 0.01 ? "text-rose-600" : "text-emerald-600"
                        }
                      >
                        ₹{purchase.balanceDue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Status Pill Badge with Dot */}
                    <td className="py-3 px-4 text-center">
                      {purchase.paymentStatus === "PAID" ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>Fully Paid</span>
                        </span>
                      ) : purchase.paymentStatus === "PARTIAL" ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>Partially Paid</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          <span>Unpaid</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPurchaseId(purchase.id);
                          }}
                          className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {purchase.balanceDue > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPaymentModalState({
                                isOpen: true,
                                purchase,
                              });
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-2xs"
                            title="Register Payment to Supplier"
                          >
                            Pay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedPurchaseId && (
        <GstBillDetailModal
          billId={selectedPurchaseId}
          onClose={() => setSelectedPurchaseId(null)}
          onPayBill={(bill) => {
            setPaymentModalState({
              isOpen: true,
              purchase: bill,
            });
          }}
        />
      )}

      {/* Register Payment Modal */}
      {paymentModalState.isOpen && paymentModalState.purchase && (
        <RegisterPaymentModal
          isOpen={paymentModalState.isOpen}
          onClose={() => setPaymentModalState({ isOpen: false, purchase: null })}
          type="VENDOR_BILL"
          invoiceId={paymentModalState.purchase.id}
          invoiceNumber={paymentModalState.purchase.supplierInvoiceNumber || paymentModalState.purchase.invoiceNumber}
          partnerName={paymentModalState.purchase.supplierName || (paymentModalState.purchase as any).supplier?.businessName || "Vendor"}
          partnerId={paymentModalState.purchase.supplierId || (paymentModalState.purchase as any).supplier?.id}
          grandTotal={paymentModalState.purchase.totalAmount}
          paidAmount={paymentModalState.purchase.paidAmount}
          remainingDue={paymentModalState.purchase.balanceDue}
          onPaymentSuccess={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
}
