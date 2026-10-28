"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Download,
  ClipboardList,
  Edit,
  X,
  FileText,
  Clock,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";
import {
  api,
  InventoryOverviewStats,
  StockLedgerItem,
  ReconciliationWorksheetItem,
  CategoryItem,
} from "@/lib/api";
import { useStore } from "@/context/StoreContext";

export default function StockLedgerView() {
  const { currentStore } = useStore();
  const [activeTab, setActiveTab] = useState<"LEDGER" | "RECONCILIATION">("LEDGER");

  // Overview Stats (Screen 26)
  const [stats, setStats] = useState<InventoryOverviewStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Stock Movement Ledger (Screen 27)
  const [movements, setMovements] = useState<StockLedgerItem[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [movementTypeFilter, setMovementTypeFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMovements, setTotalMovements] = useState(0);

  // Reconciliation Worksheet (Screens 28 & 29)
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [worksheet, setWorksheet] = useState<ReconciliationWorksheetItem[]>([]);
  const [worksheetLoading, setWorksheetLoading] = useState(false);
  const [worksheetSearch, setWorksheetSearch] = useState("");
  const [countedQuantities, setCountedQuantities] = useState<{ [batchId: string]: number }>({});
  const [itemReasons, setItemReasons] = useState<{ [batchId: string]: string }>({});
  const [generalAuditNotes, setGeneralAuditNotes] = useState("Periodic physical stock verification");
  const [submittingRecon, setSubmittingRecon] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reconciliationSuccess, setReconciliationSuccess] = useState<string | null>(null);

  // Quick Single Batch Adjustment Modal (Screen 28)
  const [quickAdjustBatch, setQuickAdjustBatch] = useState<ReconciliationWorksheetItem | null>(null);
  const [quickCountedQty, setQuickCountedQty] = useState(0);
  const [quickReason, setQuickReason] = useState("Stock audit discrepancy");
  const [submittingQuick, setSubmittingQuick] = useState(false);

  // Load Inventory Overview Stats
  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.getInventoryOverview();
      if (res.success) {
        setStats(res.overview);
      }
    } catch (err) {
      console.error("Failed to fetch inventory overview stats", err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Load Stock Movement Ledger
  const loadLedger = async (page = 1) => {
    setLedgerLoading(true);
    try {
      const res = await api.getStockLedger({
        q: searchQuery || undefined,
        movementType: movementTypeFilter !== "ALL" ? movementTypeFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 25,
      });
      if (res.success) {
        setMovements(res.movements);
        setCurrentPage(res.page);
        setTotalPages(res.totalPages || 1);
        setTotalMovements(res.total);
      }
    } catch (err) {
      console.error("Failed to load stock ledger", err);
    } finally {
      setLedgerLoading(false);
    }
  };

  // Load Reconciliation Worksheet
  const loadWorksheet = async () => {
    setWorksheetLoading(true);
    try {
      const [res, catRes] = await Promise.all([
        api.getReconciliationWorksheet({
          categoryId: selectedCategory !== "ALL" ? selectedCategory : undefined,
        }),
        api.getCategories(),
      ]);

      if (res.success) {
        setWorksheet(res.worksheet);
        // Initialize counted quantities with current systemQty
        const initialCounts: { [batchId: string]: number } = {};
        res.worksheet.forEach((item) => {
          initialCounts[item.batchId] = item.systemQty;
        });
        setCountedQuantities(initialCounts);
      }

      if (catRes.categories) {
        setCategories(catRes.categories);
      }
    } catch (err) {
      console.error("Failed to load reconciliation worksheet", err);
    } finally {
      setWorksheetLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadLedger(1);
  }, [currentStore?.id]);

  useEffect(() => {
    if (activeTab === "RECONCILIATION") {
      loadWorksheet();
    }
  }, [activeTab, selectedCategory, currentStore?.id]);

  const handleSearchLedger = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadLedger(1);
  };

  const handleResetLedgerFilters = () => {
    setSearchQuery("");
    setMovementTypeFilter("ALL");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
    setTimeout(() => {
      loadLedger(1);
    }, 0);
  };

  // Export Ledger to CSV
  const handleExportCsv = () => {
    if (movements.length === 0) return;
    const headers = [
      "Timestamp",
      "Product Name",
      "Generic Name",
      "SKU",
      "Batch Number",
      "Expiry Date",
      "Movement Type",
      "Inflow/Outflow",
      "Quantity",
      "Unit",
      "Base Units",
      "Current Batch Stock",
      "Reference Doc",
      "Performed By",
      "Reason",
    ];

    const rows = movements.map((m) => [
      `"${new Date(m.createdAt).toLocaleString("en-IN")}"`,
      `"${m.productName}"`,
      `"${m.genericName || ""}"`,
      `"${m.sku}"`,
      `"${m.batchNumber}"`,
      `"${m.expiryDate || "N/A"}"`,
      `"${m.movementType}"`,
      `"${m.isInflow ? "INFLOW (+)" : m.isOutflow ? "OUTFLOW (-)" : "ADJUSTMENT"}"`,
      m.quantity,
      `"${m.unitName}"`,
      m.baseQuantity,
      m.currentBatchStock,
      `"${m.referenceId}"`,
      `"${m.performedBy}"`,
      `"${m.reason || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MediPOS_Stock_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate reconciliation variances
  const variances = worksheet.map((item) => {
    const counted = countedQuantities[item.batchId] !== undefined ? countedQuantities[item.batchId] : item.systemQty;
    const variance = counted - item.systemQty;
    return {
      ...item,
      countedQty: counted,
      variance,
      reason: itemReasons[item.batchId] || "",
    };
  });

  const changedVariances = variances.filter((v) => v.variance !== 0);
  const totalSurplusUnits = changedVariances
    .filter((v) => v.variance > 0)
    .reduce((sum, v) => sum + v.variance, 0);
  const totalDeficitUnits = changedVariances
    .filter((v) => v.variance < 0)
    .reduce((sum, v) => sum + Math.abs(v.variance), 0);

  // Submit Bulk Reconciliation
  const handleConfirmReconciliation = async () => {
    if (changedVariances.length === 0) return;
    setSubmittingRecon(true);
    try {
      const itemsToSubmit = changedVariances.map((v) => ({
        batchId: v.batchId,
        countedQty: v.countedQty,
        reason: v.reason || generalAuditNotes,
      }));

      const res = await api.submitStockReconciliation({
        notes: generalAuditNotes,
        items: itemsToSubmit,
      });

      if (res.success) {
        setReconciliationSuccess(
          `Reconciliation committed successfully! ${res.adjustedCount} batch(es) adjusted under Reference #${res.auditRef}.`
        );
        setShowReviewModal(false);
        loadStats();
        loadWorksheet();
        loadLedger(1);
      }
    } catch (err: any) {
      alert(err.message || "Failed to submit stock reconciliation");
    } finally {
      setSubmittingRecon(false);
    }
  };

  // Submit Single Batch Quick Adjustment
  const handleQuickAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAdjustBatch) return;

    setSubmittingQuick(true);
    try {
      const res = await api.submitStockReconciliation({
        notes: quickReason,
        items: [
          {
            batchId: quickAdjustBatch.batchId,
            countedQty: Math.max(0, quickCountedQty),
            reason: quickReason,
          },
        ],
      });

      if (res.success) {
        setQuickAdjustBatch(null);
        loadStats();
        if (activeTab === "RECONCILIATION") {
          loadWorksheet();
        } else {
          loadLedger(1);
        }
      }
    } catch (err: any) {
      alert(err.message || "Failed to adjust batch stock");
    } finally {
      setSubmittingQuick(false);
    }
  };

  // Filter worksheet for display
  const filteredWorksheet = variances.filter((item) => {
    if (!worksheetSearch) return true;
    const q = worksheetSearch.toLowerCase();
    return (
      item.productName.toLowerCase().includes(q) ||
      item.genericName.toLowerCase().includes(q) ||
      item.batchNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Inventory
              </h1>
              <p className="text-xs text-slate-500">
                Stock levels, valuation, and movements
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadStats();
              if (activeTab === "LEDGER") loadLedger(currentPage);
              else loadWorksheet();
            }}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-sm font-medium transition cursor-pointer shadow-xs"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setActiveTab("RECONCILIATION")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition shadow-xs cursor-pointer ${
              activeTab === "RECONCILIATION"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>Physical Stock Count</span>
          </button>
        </div>
      </div>

      {/* Inventory Overview & Valuation KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Valuation at Cost */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Valuation (Cost)
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            ₹{stats ? stats.totalValuationCost.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0.00"}
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
            <span>Purchase value across batches</span>
          </div>
        </div>

        {/* KPI 2: Valuation at MRP */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Valuation (MRP)
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            ₹{stats ? stats.totalValuationMrp.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0.00"}
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600 font-medium">
            {stats && stats.totalValuationCost > 0 ? (
              <span>
                Margin: ₹{(stats.totalValuationMrp - stats.totalValuationCost).toLocaleString("en-IN", { minimumFractionDigits: 0 })}{" "}
                ({(((stats.totalValuationMrp - stats.totalValuationCost) / stats.totalValuationCost) * 100).toFixed(1)}%)
              </span>
            ) : (
              <span>Retail value</span>
            )}
          </div>
        </div>

        {/* KPI 3: Units & Batches */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Total In Stock
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {stats ? stats.totalBaseUnits.toLocaleString("en-IN") : "0"} <span className="text-xs font-normal text-slate-500">Units</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium">
              {stats?.totalProducts || 0} Products
            </span>
            <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium">
              {stats?.totalBatches || 0} Batches
            </span>
          </div>
        </div>

        {/* KPI 4: Stock Health & Alerts */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Stock Alerts
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
              <span>{stats?.lowStockCount || 0} Low Stock</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg">
              <Clock className="h-4 w-4" />
              <span>{stats?.nearExpiryCount || 0} Near Expiry</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Expired batches:</span>
            <span className="font-semibold text-rose-600">{stats?.expiredCount || 0}</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Header */}
      <div className="flex items-center border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab("LEDGER")}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === "LEDGER"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Stock Movements</span>
          <span className="px-2 py-1 rounded-full text-[11px] bg-slate-100 text-slate-700 font-semibold">
            {totalMovements}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("RECONCILIATION")}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === "RECONCILIATION"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          <span>Physical Stock Count</span>
          {changedVariances.length > 0 && (
            <span className="px-2 py-1 rounded-full text-[11px] bg-amber-100 text-amber-800 font-bold border border-amber-200">
              {changedVariances.length} variance(s)
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: Stock Movements */}
      {activeTab === "LEDGER" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <form onSubmit={handleSearchLedger} className="flex flex-col md:flex-row gap-3 items-center">
              {/* Search */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by medicine name, batch number, or reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Movement Type Dropdown */}
              <div className="w-full md:w-56">
                <select
                  value={movementTypeFilter}
                  onChange={(e) => {
                    setMovementTypeFilter(e.target.value);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Movements</option>
                  <option value="PURCHASE">Purchases (In)</option>
                  <option value="SALE">Sales (Out)</option>
                  <option value="SALE_RETURN">Sales Returns</option>
                  <option value="PURCHASE_RETURN">Purchase Returns</option>
                  <option value="ADJUSTMENT">Stock Adjustments</option>
                  <option value="EXPIRED_DISPOSAL">Expired Disposals</option>
                  <option value="DAMAGE">Damages & Breakages</option>
                </select>
              </div>

              {/* Date Filters */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title="Start Date"
                />
                <span className="text-slate-400 text-xs">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title="End Date"
                />
              </div>

              {/* Search & Reset Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetLedgerFilters}
                  className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={movements.length === 0}
                  className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-50 text-slate-600 rounded-lg text-xs font-medium transition flex items-center gap-2 cursor-pointer"
                  title="Export to CSV"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">CSV</span>
                </button>
              </div>
            </form>
          </div>

          {/* Ledger Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs min-w-[1280px] whitespace-nowrap">
                <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 min-w-[120px]">Date & Time</th>
                    <th className="py-3 px-4 min-w-[220px]">Medicine Name</th>
                    <th className="py-3 px-4 min-w-[120px]">Batch #</th>
                    <th className="py-3 px-4 min-w-[100px]">Type</th>
                    <th className="py-3 px-4 text-right min-w-[110px]">Movement Qty</th>
                    <th className="py-3 px-4 text-right min-w-[100px]">Base Units</th>
                    <th className="py-3 px-4 text-right min-w-[100px]">Balance</th>
                    <th className="py-3 px-4 min-w-[130px]">Reference</th>
                    <th className="py-3 px-4 min-w-[100px]">User</th>
                    <th className="py-3 px-4 min-w-[180px]">Reason / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {ledgerLoading ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
                          <span>Loading stock movements...</span>
                        </div>
                      </td>
                    </tr>
                  ) : movements.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Package className="h-8 w-8 text-slate-300 stroke-[2]" />
                          <span className="text-sm font-semibold text-slate-600">No stock movements found</span>
                          <span className="text-xs text-slate-400">
                            Try adjusting your search criteria or date filter.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    movements.map((m) => {
                      // Movement Type Styling
                      let badgeBg = "bg-slate-100 text-slate-700 border-slate-200";
                      let typeLabel: string = m.movementType;
                      let icon = null;

                      if (m.movementType === "PURCHASE") {
                        badgeBg = "bg-emerald-50 text-emerald-700 border-emerald-200";
                        typeLabel = "Purchase";
                        icon = <ArrowDownLeft className="h-3 w-3 inline mr-1 text-emerald-600" />;
                      } else if (m.movementType === "SALE") {
                        badgeBg = "bg-indigo-50 text-indigo-700 border-indigo-200";
                        typeLabel = "Sale";
                        icon = <ArrowUpRight className="h-3 w-3 inline mr-1 text-indigo-600" />;
                      } else if (m.movementType === "SALE_RETURN") {
                        badgeBg = "bg-teal-50 text-teal-700 border-teal-200";
                        typeLabel = "Sale Return";
                        icon = <ArrowDownLeft className="h-3 w-3 inline mr-1 text-teal-600" />;
                      } else if (m.movementType === "PURCHASE_RETURN") {
                        badgeBg = "bg-rose-50 text-rose-700 border-rose-200";
                        typeLabel = "Purchase Return";
                        icon = <ArrowUpRight className="h-3 w-3 inline mr-1 text-rose-600" />;
                      } else if (m.movementType === "ADJUSTMENT") {
                        badgeBg = "bg-amber-50 text-amber-700 border-amber-200";
                        typeLabel = "Adjustment";
                        icon = <SlidersHorizontal className="h-3 w-3 inline mr-1 text-amber-600" />;
                      } else if (m.movementType === "EXPIRED_DISPOSAL" || m.movementType === "DAMAGE") {
                        badgeBg = "bg-red-50 text-red-700 border-red-200";
                        typeLabel = m.movementType === "DAMAGE" ? "Damage" : "Disposal";
                        icon = <ShieldAlert className="h-3 w-3 inline mr-1 text-red-600" />;
                      }

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition">
                          {/* Timestamp */}
                          <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-500">
                            <div className="font-medium text-slate-800">{new Date(m.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</div>
                            <div className="text-[11px] text-slate-400">{new Date(m.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                          </td>

                          {/* Product Details */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{m.productName}</div>
                            {m.genericName && (
                              <div className="text-[11px] text-slate-500 line-clamp-1">{m.genericName}</div>
                            )}
                          </td>

                          {/* Batch & Expiry */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                              {m.batchNumber}
                            </span>
                            {m.expiryDate && (
                              <div className="text-[11px] text-slate-400 mt-1">Exp: {m.expiryDate}</div>
                            )}
                          </td>

                          {/* Movement Type */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full border ${badgeBg}`}>
                              {icon}
                              {typeLabel}
                            </span>
                          </td>

                          {/* Quantity */}
                          <td className="py-3 px-4 whitespace-nowrap text-right font-medium">
                            <span
                              className={
                                m.isInflow
                                  ? "text-emerald-600 font-bold"
                                  : m.isOutflow
                                  ? "text-rose-600 font-bold"
                                  : "text-amber-600 font-bold"
                              }
                            >
                              {m.isInflow ? "+" : m.isOutflow ? "-" : "±"}
                              {m.quantity} {m.unitName}
                            </span>
                          </td>

                          {/* Base Quantity */}
                          <td className="py-3 px-4 whitespace-nowrap text-right font-mono text-xs text-slate-600">
                            {m.baseQuantity}
                          </td>

                          {/* Batch Stock Now */}
                          <td className="py-3 px-4 whitespace-nowrap text-right font-mono text-xs font-bold text-slate-900">
                            {m.currentBatchStock}
                          </td>

                          {/* Reference */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                              {m.referenceId}
                            </span>
                          </td>

                          {/* Performed By */}
                          <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-600">
                            {m.performedBy}
                          </td>

                          {/* Reason */}
                          <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate" title={m.reason}>
                            {m.reason || "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Showing {movements.length} of {totalMovements} records
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (currentPage > 1) {
                      loadLedger(currentPage - 1);
                    }
                  }}
                  disabled={currentPage <= 1 || ledgerLoading}
                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-medium text-slate-700 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => {
                    if (currentPage < totalPages) {
                      loadLedger(currentPage + 1);
                    }
                  }}
                  disabled={currentPage >= totalPages || ledgerLoading}
                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Physical Stock Count */}
      {activeTab === "RECONCILIATION" && (
        <div className="space-y-4">
          {/* Success Notification */}
          {reconciliationSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span className="text-xs font-semibold text-emerald-800">
                  {reconciliationSuccess}
                </span>
              </div>
              <button
                onClick={() => setReconciliationSuccess(null)}
                className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Worksheet Controls & Filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
              {/* Category Filter */}
              <div className="w-full sm:w-56">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by medicine name or batch #..."
                  value={worksheetSearch}
                  onChange={(e) => setWorksheetSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Quick Stats of Pending Variances */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <div className="text-right">
                <div className="text-xs text-slate-500">Variances:</div>
                <div className="text-xs font-bold flex items-center gap-2">
                  <span className="text-emerald-600">+{totalSurplusUnits} Surplus</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-rose-600">-{totalDeficitUnits} Deficit</span>
                </div>
              </div>

              <button
                onClick={() => setShowReviewModal(true)}
                disabled={changedVariances.length === 0}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Save Count ({changedVariances.length})</span>
              </button>
            </div>
          </div>

          {/* Worksheet Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs min-w-[980px] whitespace-nowrap">
                <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 min-w-[220px]">Medicine Name</th>
                    <th className="py-3 px-4 min-w-[140px]">Batch # & Expiry</th>
                    <th className="py-3 px-4 text-right min-w-[110px]">System Stock</th>
                    <th className="py-3 px-4 min-w-[140px]">Counted Qty</th>
                    <th className="py-3 px-4 text-center min-w-[110px]">Status</th>
                    <th className="py-3 px-4 min-w-[160px]">Notes</th>
                    <th className="py-3 px-4 text-center min-w-[100px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {worksheetLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
                          <span>Loading stock worksheet...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredWorksheet.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Package className="h-8 w-8 text-slate-300 stroke-[2]" />
                          <span className="text-sm font-semibold text-slate-600">No active batches found</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredWorksheet.map((item) => {
                      const isChanged = item.variance !== 0;

                      return (
                        <tr
                          key={item.batchId}
                          className={`hover:bg-slate-50/80 transition ${
                            isChanged ? "bg-amber-50/40" : ""
                          }`}
                        >
                          {/* Medicine Name & Category */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">
                              {item.productName}
                            </div>
                            <div className="text-[11px] text-slate-500">{item.genericName}</div>
                          </td>

                          {/* Batch & Expiry */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                              {item.batchNumber}
                            </span>
                            <div className="text-[11px] text-slate-400 mt-1">Exp: {item.expiryDate}</div>
                          </td>

                          {/* System Stock */}
                          <td className="py-3 px-4 whitespace-nowrap text-right">
                            <div className="text-xs font-bold text-slate-900 font-mono">
                              {item.systemQty} <span className="text-[10px] font-normal text-slate-500">{item.baseUnit}</span>
                            </div>
                          </td>

                          {/* Physical Counted Qty Input */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                value={item.countedQty}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  setCountedQuantities((prev) => ({
                                    ...prev,
                                    [item.batchId]: isNaN(val) ? 0 : Math.max(0, val),
                                  }));
                                }}
                                className={`w-20 bg-white border rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right ${
                                  item.variance !== 0 ? "border-amber-400 text-amber-800 bg-amber-50/60" : "border-slate-200"
                                }`}
                              />
                              <span className="text-[11px] text-slate-500 font-medium">
                                {item.baseUnit}
                              </span>
                            </div>
                          </td>

                          {/* Variance Status Badge */}
                          <td className="py-3 px-4 whitespace-nowrap text-center">
                            {item.variance === 0 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                <CheckCircle2 className="h-3 w-3 text-slate-400" />
                                <span>Matched</span>
                              </span>
                            ) : item.variance > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <ArrowDownLeft className="h-3 w-3 text-emerald-600" />
                                <span>+{item.variance} Surplus</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                <ArrowUpRight className="h-3 w-3 text-rose-600" />
                                <span>{item.variance} Deficit</span>
                              </span>
                            )}
                          </td>

                          {/* Reason Input */}
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              placeholder="Reason / note"
                              value={itemReasons[item.batchId] || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setItemReasons((prev) => ({
                                  ...prev,
                                  [item.batchId]: val,
                                }));
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>

                          {/* Quick Action Button */}
                          <td className="py-3 px-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => {
                                setQuickAdjustBatch(item);
                                setQuickCountedQty(item.systemQty);
                                setQuickReason("Stock audit adjustment");
                              }}
                              className="px-2 py-1 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-lg border border-slate-200 transition shadow-2xs cursor-pointer"
                              title="Quick Stock Adjustment"
                            >
                              <Edit className="h-3 w-3 inline mr-1" />
                              <span>Adjust</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Total count footer */}
            <div className="p-3 bg-slate-50/50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <div>
                Total Batches: <strong className="text-slate-800">{worksheet.length}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Review & Commit Reconciliation Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white text-slate-900">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Confirm Stock Count
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review and commit physical stock adjustments
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* General Audit Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Audit Notes / Reason
                </label>
                <input
                  type="text"
                  value={generalAuditNotes}
                  onChange={(e) => setGeneralAuditNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Monthly Physical Stock Verification"
                />
              </div>

              {/* Variances List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  Batches to Adjust ({changedVariances.length})
                </div>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {changedVariances.map((item) => (
                    <div key={item.batchId} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-900">{item.productName}</div>
                        <div className="text-slate-500">
                          Batch: <span className="font-mono text-slate-800 font-semibold">{item.batchNumber}</span> | System: {item.systemQty} → Counted: {item.countedQty} {item.baseUnit}
                        </div>
                        {item.reason && (
                          <div className="text-[11px] text-amber-700 italic mt-1">Note: {item.reason}</div>
                        )}
                      </div>
                      <div className="text-right">
                        {item.variance > 0 ? (
                          <span className="font-bold text-emerald-600 font-mono text-xs">
                            +{item.variance} Surplus
                          </span>
                        ) : (
                          <span className="font-bold text-rose-600 font-mono text-xs">
                            {item.variance} Deficit
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Summary */}
              <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between text-xs border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[11px] block">Batches Changed</span>
                  <span className="font-bold text-slate-900 text-sm">{changedVariances.length}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Surplus Added</span>
                  <span className="font-bold text-emerald-600 text-sm">+{totalSurplusUnits} units</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Deficit Deducted</span>
                  <span className="font-bold text-rose-600 text-sm">-{totalDeficitUnits} units</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReconciliation}
                disabled={submittingRecon}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                {submittingRecon ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Applying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm & Apply</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Single Batch Quick Adjustment Modal */}
      {quickAdjustBatch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white text-slate-900">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <Edit className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Quick Stock Adjustment
                  </h3>
                  <p className="text-xs text-slate-500">
                    Update batch stock with an audit reason
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickAdjustBatch(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAdjustSubmit} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 text-sm">
                  {quickAdjustBatch.productName}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Batch: <span className="font-mono text-slate-800 font-semibold">{quickAdjustBatch.batchNumber}</span> | Exp: {quickAdjustBatch.expiryDate}
                </div>
                <div className="text-xs text-indigo-700 mt-1 font-semibold">
                  Current System Stock: <strong>{quickAdjustBatch.systemQty} {quickAdjustBatch.baseUnit}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Physical Count ({quickAdjustBatch.baseUnit})
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={quickCountedQty}
                  onChange={(e) => setQuickCountedQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="text-xs mt-1">
                  {quickCountedQty - quickAdjustBatch.systemQty !== 0 ? (
                    quickCountedQty > quickAdjustBatch.systemQty ? (
                      <span className="text-emerald-600 font-medium">
                        Surplus of +{quickCountedQty - quickAdjustBatch.systemQty} {quickAdjustBatch.baseUnit} will be added.
                      </span>
                    ) : (
                      <span className="text-rose-600 font-medium">
                        Deficit of {quickCountedQty - quickAdjustBatch.systemQty} {quickAdjustBatch.baseUnit} will be deducted.
                      </span>
                    )
                  ) : (
                    <span className="text-slate-400">No variance in quantity.</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Adjustment
                </label>
                <select
                  value={quickReason}
                  onChange={(e) => setQuickReason(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Stock audit discrepancy">Physical Count Discrepancy</option>
                  <option value="Damaged / broken container">Damaged / Broken Container</option>
                  <option value="Shelf spillage or loose strip loss">Spillage or Loose Strip Loss</option>
                  <option value="Expired batch write-off">Expired Batch Write-Off</option>
                  <option value="Supplier invoice discrepancy">Supplier Invoice Discrepancy</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickAdjustBatch(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingQuick}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  {submittingQuick ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Save Adjustment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
