"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import {
  BarChart2,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  DollarSign,
  Calendar,
  Download,
  Printer,
  RefreshCw,
  Clock,
  ShieldCheck,
  Package,
  Layers,
  ArrowUpRight,
  CreditCard,
  Percent,
} from "lucide-react";
import {
  api,
  SalesReportResponse,
  PurchaseReportResponse,
  InventoryValuationResponse,
  ExpiryScheduleResponse,
  ProfitLossResponse,
  GstReportResponse,
} from "@/lib/api";
import GstComplianceCenter from "@/components/GstComplianceCenter";

type ReportTab = "SALES" | "EXPIRY" | "VALUATION" | "PROFIT_LOSS" | "GST";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("SALES");
  const [loading, setLoading] = useState(true);

  // Date Filter Preset
  const [datePreset, setDatePreset] = useState<"ALL" | "TODAY" | "WEEK" | "MONTH">("ALL");

  // Report States
  const [salesReport, setSalesReport] = useState<SalesReportResponse | null>(null);
  const [expiryReport, setExpiryReport] = useState<ExpiryScheduleResponse | null>(null);
  const [valuationReport, setValuationReport] = useState<InventoryValuationResponse | null>(null);
  const [profitLossReport, setProfitLossReport] = useState<ProfitLossResponse | null>(null);
  const [gstReport, setGstReport] = useState<GstReportResponse | null>(null);

  // Filter params
  const getDateRange = () => {
    const now = new Date();
    if (datePreset === "TODAY") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const end = now.toISOString();
      return { from: start, to: end };
    }
    if (datePreset === "WEEK") {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      return { from: start, to: now.toISOString() };
    }
    if (datePreset === "MONTH") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      return { from: start, to: now.toISOString() };
    }
    return {};
  };

  const loadCurrentTab = async () => {
    setLoading(true);
    const range = getDateRange();

    try {
      if (activeTab === "SALES") {
        const res = await api.getSalesReport(range);
        setSalesReport(res);
      } else if (activeTab === "EXPIRY") {
        const res = await api.getExpiryScheduleReport();
        setExpiryReport(res);
      } else if (activeTab === "VALUATION") {
        const res = await api.getInventoryValuationReport();
        setValuationReport(res);
      } else if (activeTab === "PROFIT_LOSS") {
        const res = await api.getProfitLossReport(range);
        setProfitLossReport(res);
      } else if (activeTab === "GST") {
        const res = await api.getGstReport(range);
        setGstReport(res);
      }
    } catch (err) {
      console.error("Failed to load report", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentTab();
  }, [activeTab, datePreset]);

  // Export CSV handler
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = `report_${activeTab.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (activeTab === "SALES" && salesReport) {
      headers = ["Invoice #", "Date", "Customer", "Items", "Subtotal", "Discount", "GST Tax", "Grand Total", "Payment Mode"];
      rows = salesReport.invoices.map((inv) => [
        inv.invoiceNumber,
        new Date(inv.date).toLocaleDateString(),
        inv.customerName,
        inv.itemCount,
        inv.subtotal,
        inv.discount,
        inv.tax,
        inv.grandTotal,
        inv.paymentMethod,
      ]);
    } else if (activeTab === "EXPIRY" && expiryReport) {
      headers = ["Batch Number", "Product Name", "Generic", "Expiry Date", "Days Left", "Available Qty", "Cost Value at Risk"];
      const allExpiry = [
        ...expiryReport.expired,
        ...expiryReport.expiring30,
        ...expiryReport.expiring60,
        ...expiryReport.expiring90,
      ];
      rows = allExpiry.map((b) => [
        b.batchNumber,
        b.productName,
        b.genericName || "N/A",
        b.expiryDate,
        b.daysLeft,
        b.availableQty,
        b.costVal,
      ]);
    } else if (activeTab === "VALUATION" && valuationReport) {
      headers = ["Batch Number", "Product", "Category", "Expiry", "Stock Qty", "Purchase Cost Rate", "MRP Rate", "Total Cost Value", "Total Retail Value"];
      rows = valuationReport.batches.map((b) => [
        b.batchNumber,
        b.productName,
        b.category,
        b.expiryDate,
        b.availableQty,
        b.purchasePrice,
        b.mrp,
        b.costTotal,
        b.retailTotal,
      ]);
    }

    if (rows.length === 0) return;

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <AppLayout activeMenuId="reports">
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200">
              <BarChart2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports</h1>
              <p className="text-sm text-slate-500">
                Sales summaries, stock valuation, and tax reports
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-2 cursor-pointer"
            >
              <Download className="h-4 w-4 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-2 cursor-pointer"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={loadCurrentTab}
              className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition shadow-2xs cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tab Switcher & Date Range Presets */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs no-print">
          {/* Main 5 Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full md:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab("SALES")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                activeTab === "SALES"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Sales
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("EXPIRY")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                activeTab === "EXPIRY"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Expiry Schedule
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("VALUATION")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                activeTab === "VALUATION"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Stock Valuation
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("PROFIT_LOSS")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                activeTab === "PROFIT_LOSS"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Profit & Loss
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("GST")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                activeTab === "GST"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              GST Reconciliation
            </button>
          </div>

          {/* Date Filter Buttons (Only shown on period-dependent tabs) */}
          {(activeTab === "SALES" || activeTab === "PROFIT_LOSS" || activeTab === "GST") && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={() => setDatePreset("ALL")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  datePreset === "ALL" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => setDatePreset("TODAY")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  datePreset === "TODAY" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDatePreset("WEEK")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  datePreset === "WEEK" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                This Week
              </button>
              <button
                type="button"
                onClick={() => setDatePreset("MONTH")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  datePreset === "MONTH" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                This Month
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: SALES & TURNOVER */}
        {activeTab === "SALES" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Net Revenue</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  ₹{salesReport?.summary.totalNet.toFixed(2) || "0.00"}
                </div>
                <span className="text-xs text-slate-500 mt-1 block">
                  {salesReport?.summary.invoiceCount || 0} completed invoices
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Discounts Given</span>
                <div className="text-2xl font-black text-rose-600 mt-1">
                  - ₹{salesReport?.summary.totalDiscount.toFixed(2) || "0.00"}
                </div>
                <span className="text-xs text-slate-500 mt-1 block">Item & bill-level reductions</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">GST Tax Collected</span>
                <div className="text-2xl font-black text-indigo-600 mt-1">
                  ₹{salesReport?.summary.totalTax.toFixed(2) || "0.00"}
                </div>
                <span className="text-xs text-slate-500 mt-1 block">Output CGST & SGST liability</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Bill Value</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  ₹{salesReport?.summary.invoiceCount ? (salesReport.summary.totalNet / salesReport.summary.invoiceCount).toFixed(2) : "0.00"}
                </div>
                <span className="text-xs text-slate-500 mt-1 block">Per customer ticket average</span>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h2 className="font-bold text-slate-900 text-sm">Payment Methods Breakdown</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {Object.entries(salesReport?.summary.paymentBreakdown || {}).map(([mode, amt]) => (
                  <div key={mode} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">{mode}</span>
                    <span className="text-base font-extrabold text-slate-900 mt-1 block">
                      ₹{amt.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Selling Medicines */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-900 text-sm">Top 10 Fast-Moving Medicines</h2>
                <span className="text-xs text-slate-400">By sales volume & revenue</span>
              </div>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left text-xs min-w-[550px] whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="px-4 py-3 min-w-[240px]">Medicine Name</th>
                      <th className="px-4 py-3 min-w-[110px] text-right">Units Sold</th>
                      <th className="px-4 py-3 min-w-[160px] text-right">Total Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salesReport?.topSellingProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-bold text-slate-900">{p.name}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-600">{p.quantity}</td>
                        <td className="px-4 py-3 text-right font-extrabold text-slate-900">₹{p.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900 text-sm">Itemized Sales Invoices</h2>
              </div>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left text-xs min-w-[950px] whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="px-4 py-3 min-w-[130px]">Invoice #</th>
                      <th className="px-4 py-3 min-w-[110px]">Date</th>
                      <th className="px-4 py-3 min-w-[150px]">Customer</th>
                      <th className="px-4 py-3 min-w-[70px]">Items</th>
                      <th className="px-4 py-3 min-w-[90px] text-right">Subtotal</th>
                      <th className="px-4 py-3 min-w-[90px] text-right">Discount</th>
                      <th className="px-4 py-3 min-w-[90px] text-right">GST</th>
                      <th className="px-4 py-3 min-w-[110px] text-right">Grand Total</th>
                      <th className="px-4 py-3 min-w-[110px]">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salesReport?.invoices.slice(0, 50).map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-600">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 text-slate-500">{new Date(inv.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{inv.customerName}</td>
                        <td className="px-4 py-3 text-slate-600">{inv.itemCount}</td>
                        <td className="px-4 py-3 text-right text-slate-600">₹{inv.subtotal.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-rose-600">-₹{inv.discount.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-slate-600">₹{inv.tax.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-black text-slate-900">₹{inv.grandTotal.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {inv.paymentMethod}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FEFO EXPIRY SCHEDULE */}
        {activeTab === "EXPIRY" && (
          <div className="space-y-6">
            {/* Expiry Risk Buckets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-2xs bg-rose-50/20">
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Already Expired</span>
                <div className="text-2xl font-black text-rose-700 mt-1">
                  {expiryReport?.summary.expiredCount || 0} Batches
                </div>
                <span className="text-xs text-rose-600 font-bold mt-1 block">
                  Value at Risk: ₹{expiryReport?.summary.expiredRiskValue.toFixed(2) || "0.00"}
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs bg-amber-50/20">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Expiring &lt; 30 Days</span>
                <div className="text-2xl font-black text-amber-700 mt-1">
                  {expiryReport?.summary.expiring30Count || 0} Batches
                </div>
                <span className="text-xs text-amber-600 font-bold mt-1 block">
                  Value at Risk: ₹{expiryReport?.summary.riskValue30.toFixed(2) || "0.00"}
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expiring in 31–60 Days</span>
                <div className="text-2xl font-black text-slate-800 mt-1">
                  {expiryReport?.summary.expiring60Count || 0} Batches
                </div>
                <span className="text-xs text-slate-500 font-bold mt-1 block">
                  Value: ₹{expiryReport?.summary.riskValue60.toFixed(2) || "0.00"}
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Risk Valuation</span>
                <div className="text-2xl font-black text-indigo-700 mt-1">
                  ₹{expiryReport?.summary.totalRiskValue.toFixed(2) || "0.00"}
                </div>
                <span className="text-xs text-slate-500 mt-1 block">All near-expiry inventory cost</span>
              </div>
            </div>

            {/* Expired Batches Table */}
            {expiryReport && expiryReport.expired.length > 0 && (
              <div className="bg-white rounded-2xl border border-rose-200 shadow-2xs overflow-hidden">
                <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <h2 className="font-bold text-rose-900 text-sm">Expired Batches Requiring Immediate Disposition</h2>
                  </div>
                  <span className="text-xs font-bold text-rose-700">Sales Restricted</span>
                </div>
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left text-xs min-w-[680px] whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                      <tr>
                        <th className="px-4 py-3 min-w-[130px]">Batch Number</th>
                        <th className="px-4 py-3 min-w-[180px]">Medicine</th>
                        <th className="px-4 py-3 min-w-[110px]">Expiry Date</th>
                        <th className="px-4 py-3 min-w-[110px] text-right">Available Qty</th>
                        <th className="px-4 py-3 min-w-[120px] text-right">Cost at Risk</th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expiryReport.expired.map((b) => (
                      <tr key={b.id} className="hover:bg-rose-50/40">
                        <td className="px-4 py-3 font-mono font-bold text-rose-600">{b.batchNumber}</td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 block">{b.productName}</span>
                          <span className="text-[10px] text-slate-400">{b.genericName}</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-rose-600">{b.expiryDate}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800">{b.availableQty} {b.unit}s</td>
                        <td className="px-4 py-3 text-right font-extrabold text-rose-700">₹{b.costVal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Near-Expiry Batches (<60 Days) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-sm">FEFO Priority Batches (Expiring within 60 Days)</h2>
              <span className="text-xs text-slate-400">Prioritize these on POS billing</span>
            </div>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs min-w-[720px] whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-3 min-w-[130px]">Batch Number</th>
                    <th className="px-4 py-3 min-w-[180px]">Medicine</th>
                    <th className="px-4 py-3 min-w-[110px]">Expiry Date</th>
                    <th className="px-4 py-3 min-w-[90px]">Days Left</th>
                    <th className="px-4 py-3 min-w-[100px] text-right">Stock Qty</th>
                    <th className="px-4 py-3 min-w-[110px] text-right">Cost Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...(expiryReport?.expiring30 || []), ...(expiryReport?.expiring60 || [])].map((b) => (
                    <tr key={b.id} className="hover:bg-amber-50/30">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{b.batchNumber}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{b.productName}</span>
                        <span className="text-[10px] text-slate-400">{b.genericName}</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-amber-600">{b.expiryDate}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {b.daysLeft} days
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">{b.availableQty} {b.unit}s</td>
                      <td className="px-4 py-3 text-right font-extrabold text-slate-900">₹{b.costVal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

        {/* TAB 3: STOCK VALUATION */}
        {activeTab === "VALUATION" && (
          <div className="space-y-6">
            {/* Valuation Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inventory Cost Valuation</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  ₹{valuationReport?.summary.costValuation.toFixed(2) || "0.00"}
                </div>
                <span className="text-xs text-slate-500 mt-1 block">Total purchase acquisition capital</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inventory Retail Value (MRP)</span>
                <div className="text-2xl font-black text-indigo-700 mt-1">
                  ₹{valuationReport?.summary.retailValuation.toFixed(2) || "0.00"}
                </div>
                <span className="text-xs text-slate-500 mt-1 block">Total gross sales value at MRP</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Potential Gross Margin</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  ₹{valuationReport?.summary.potentialGrossProfit.toFixed(2) || "0.00"}
                </div>
                <span className="text-xs text-slate-500 mt-1 block">Expected profit upon full sell-through</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Margin %</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {valuationReport?.summary.marginPercentage || 0}%
                </div>
                <span className="text-xs text-slate-500 mt-1 block">Weighted retail markup</span>
              </div>
            </div>

            {/* Category Valuation Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h2 className="font-bold text-slate-900 text-sm">Valuation by Medicine Category</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {valuationReport?.summary.categoryBreakdown.map((cat, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="font-bold text-xs text-slate-800 block truncate">{cat.categoryName}</span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-[11px] text-slate-500">{cat.stockCount} units</span>
                      <span className="text-xs font-extrabold text-indigo-600">₹{cat.retailVal.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Batches Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900 text-sm">Active Stock Valuation Ledger</h2>
              </div>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left text-xs min-w-[920px] whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="px-4 py-3 min-w-[180px]">Medicine</th>
                      <th className="px-4 py-3 min-w-[110px]">Batch</th>
                      <th className="px-4 py-3 min-w-[120px]">Category</th>
                      <th className="px-4 py-3 min-w-[110px] text-right">Available Qty</th>
                      <th className="px-4 py-3 min-w-[90px] text-right">Cost Rate</th>
                      <th className="px-4 py-3 min-w-[90px] text-right">MRP</th>
                      <th className="px-4 py-3 min-w-[100px] text-right">Cost Value</th>
                      <th className="px-4 py-3 min-w-[110px] text-right">Retail Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {valuationReport?.batches.slice(0, 50).map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-bold text-slate-900">{b.productName}</td>
                        <td className="px-4 py-3 font-mono text-slate-600">{b.batchNumber}</td>
                        <td className="px-4 py-3 text-slate-500">{b.category}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800">{b.availableQty} {b.unit}s</td>
                        <td className="px-4 py-3 text-right text-slate-600">₹{b.purchasePrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">₹{b.mrp.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-700">₹{b.costTotal.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-extrabold text-indigo-700">₹{b.retailTotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PROFIT & LOSS */}
        {activeTab === "PROFIT_LOSS" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs max-w-2xl mx-auto space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="font-bold text-lg text-slate-900">Income & Expense Summary</h2>
                <p className="text-xs text-slate-500">Period: {profitLossReport?.report.period.from} to {profitLossReport?.report.period.to}</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Gross Sales Turnover</span>
                  <span className="font-bold text-slate-900">₹{profitLossReport?.report.grossRevenue.toFixed(2) || "0.00"}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100 text-rose-600">
                  <span>Less: Customer Discounts Allowed</span>
                  <span className="font-bold">- ₹{profitLossReport?.report.totalDiscount.toFixed(2) || "0.00"}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100 font-bold bg-slate-50 px-3 rounded-lg">
                  <span className="text-slate-800">Net Sales Revenue</span>
                  <span className="text-slate-900">₹{profitLossReport?.report.netRevenue.toFixed(2) || "0.00"}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
                  <span>Less: Cost of Goods Sold (COGS at batch purchase price)</span>
                  <span className="font-bold text-slate-800">- ₹{profitLossReport?.report.costOfGoodsSold.toFixed(2) || "0.00"}</span>
                </div>

                <div className="flex justify-between py-3 border-t-2 border-slate-200 text-base">
                  <span className="font-black text-slate-900">Gross Operating Profit</span>
                  <span className="font-black text-emerald-600">
                    ₹{profitLossReport?.report.grossProfit.toFixed(2) || "0.00"}
                  </span>
                </div>

                <div className="flex justify-between py-2 bg-emerald-50 text-emerald-800 px-3 rounded-xl font-bold text-xs">
                  <span>Operating Gross Profit Margin</span>
                  <span>{profitLossReport?.report.grossMarginPercent || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: GST COMPLIANCE & DIGILOCKER CENTER */}
        {activeTab === "GST" && <GstComplianceCenter />}
      </div>
    </AppLayout>
  );
}
