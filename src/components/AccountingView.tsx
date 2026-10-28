"use client";

import React, { useState, useEffect } from "react";
import {
  api,
  AccountingDashboardStats,
  AccountItem,
  JournalItemDto,
  JournalEntryDto,
  GeneralLedgerAccount,
  PartnerLedgerEntry,
  InvoiceDueItem,
  BillDueItem,
  UnreconciledItem,
  AccountingAuditLogItem,
} from "@/lib/api";
import { RegisterPaymentModal } from "./RegisterPaymentModal";
import {
  EditAccountModal,
  EditJournalModal,
  EditJournalEntryModal,
  EditPaymentModal,
} from "./AccountingEditModals";
import GstInvoiceDetailModal from "./GstInvoiceDetailModal";
import GstBillDetailModal from "./GstBillDetailModal";
import PaymentVoucherModal from "./PaymentVoucherModal";
import { useStore } from "@/context/StoreContext";

export const AccountingView: React.FC = () => {
  const { currentStore } = useStore();
  const [activeTab, setActiveTab] = useState<
    "overview" | "invoices" | "bills" | "general_ledger" | "partner_ledger" | "journals" | "reconciliation" | "change_logs"
  >("overview");

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AccountingDashboardStats | null>(null);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [journals, setJournals] = useState<JournalItemDto[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntryDto[]>([]);
  const [invoicesDue, setInvoicesDue] = useState<InvoiceDueItem[]>([]);
  const [billsDue, setBillsDue] = useState<BillDueItem[]>([]);
  const [generalLedger, setGeneralLedger] = useState<GeneralLedgerAccount[]>([]);
  const [partnerLedger, setPartnerLedger] = useState<PartnerLedgerEntry[]>([]);
  const [partnerTypeFilter, setPartnerTypeFilter] = useState<"CUSTOMER" | "SUPPLIER" | "ALL">("CUSTOMER");
  const [unreconciledItems, setUnreconciledItems] = useState<UnreconciledItem[]>([]);
  const [selectedForReconcile, setSelectedForReconcile] = useState<string[]>([]);
  const [auditLogs, setAuditLogs] = useState<AccountingAuditLogItem[]>([]);
  const [logEntityFilter, setLogEntityFilter] = useState<string>("ALL");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Detailed GST Document Modal states
  const [detailInvoiceId, setDetailInvoiceId] = useState<string | null>(null);
  const [detailBillId, setDetailBillId] = useState<string | null>(null);
  const [selectedPaymentVoucherId, setSelectedPaymentVoucherId] = useState<string | null>(null);

  // Modal State for Payment Registration
  const [paymentModalState, setPaymentModalState] = useState<{
    isOpen: boolean;
    type: "CUSTOMER_INVOICE" | "VENDOR_BILL";
    invoiceId: string;
    invoiceNumber: string;
    partnerName: string;
    partnerId?: string;
    grandTotal: number;
    paidAmount: number;
    remainingDue: number;
  }>({
    isOpen: false,
    type: "CUSTOMER_INVOICE",
    invoiceId: "",
    invoiceNumber: "",
    partnerName: "",
    partnerId: undefined,
    grandTotal: 0,
    paidAmount: 0,
    remainingDue: 0,
  });

  // Modal States for Editing Things
  const [selectedEditAccount, setSelectedEditAccount] = useState<AccountItem | null>(null);
  const [selectedEditJournal, setSelectedEditJournal] = useState<JournalItemDto | null>(null);
  const [selectedEditEntry, setSelectedEditEntry] = useState<JournalEntryDto | any | null>(null);
  const [selectedEditPayment, setSelectedEditPayment] = useState<{
    id: string;
    type: "CUSTOMER" | "VENDOR";
    amount: number;
    paymentMethod: string;
    date: string;
    ref?: string;
    notes?: string;
    targetName?: string;
  } | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "overview") {
        const res = await api.getAccountingDashboard();
        setStats(res.stats);
        setRecentEntries(res.recentEntries || []);
      } else if (activeTab === "invoices") {
        const res = await api.getInvoicesDue();
        setInvoicesDue(res.invoices || []);
      } else if (activeTab === "bills") {
        const res = await api.getBillsDue();
        setBillsDue(res.bills || []);
      } else if (activeTab === "general_ledger") {
        const res = await api.getGeneralLedger();
        setGeneralLedger(res.report || []);
      } else if (activeTab === "partner_ledger") {
        const res = await api.getPartnerLedger({ partnerType: partnerTypeFilter });
        setPartnerLedger(res.partners || []);
      } else if (activeTab === "journals") {
        const [jRes, eRes, aRes] = await Promise.all([
          api.getJournals(),
          api.getJournalEntries({ limit: 100 }),
          api.getChartOfAccounts(),
        ]);
        setJournals(jRes.journals || []);
        setJournalEntries(eRes.entries || []);
        setAccounts(aRes.accounts || []);
      } else if (activeTab === "reconciliation") {
        const res = await api.getUnreconciledItems();
        setUnreconciledItems(res.items || []);
        setSelectedForReconcile([]);
      } else if (activeTab === "change_logs") {
        const res = await api.getAccountingAuditLogs({
          entity: logEntityFilter !== "ALL" ? logEntityFilter : undefined,
          search: searchQuery || undefined,
        });
        setAuditLogs(res.logs || []);
      }
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "Failed to load accounting data" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, partnerTypeFilter, logEntityFilter, currentStore?.id]);

  const handleSyncHistorical = async () => {
    setLoading(true);
    try {
      const res = await api.syncHistoricalAccountingEntries();
      setFeedback({ type: "success", msg: res.message });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "Failed to sync historical entries" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReconcile = (id: string) => {
    setSelectedForReconcile((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExecuteReconciliation = async () => {
    if (selectedForReconcile.length < 2) return;
    setLoading(true);
    try {
      const res = await api.reconcileJournalItems(selectedForReconcile);
      setFeedback({
        type: "success",
        msg: `Successfully reconciled ${res.itemCount} items (Reference: ${res.matchingNumber})`,
      });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "Reconciliation failed" });
    } finally {
      setLoading(false);
    }
  };

  const formatLogDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  // Reconcile differences calculation
  const selectedItems = unreconciledItems.filter((i) => selectedForReconcile.includes(i.id));
  const reconcileDebits = selectedItems.reduce((s, i) => s + i.debit, 0);
  const reconcileCredits = selectedItems.reduce((s, i) => s + i.credit, 0);
  const reconcileDiff = Math.abs(reconcileDebits - reconcileCredits);

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-800">Accounting & Payments</h1>
            <span className="px-2 py-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded">
              Double-Entry Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Double-entry bookkeeping, multi-payments on invoices, vendor bills, partner ledgers, and change logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncHistorical}
            disabled={loading}
            className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition-colors"
            title="Scan past sales and purchases and create balancing journal entries"
          >
            ⚡ Sync Past Transactions
          </button>
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="px-3 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded text-xs flex items-center justify-between ${feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
            }`}
        >
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Subtab Navigation */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-3 py-2 rounded font-medium transition-colors whitespace-nowrap ${activeTab === "overview" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
        >
          Overview & KPIs
        </button>
        <button
          onClick={() => setActiveTab("invoices")}
          className={`px-3 py-2 rounded font-medium transition-colors whitespace-nowrap ${activeTab === "invoices" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
        >
          Customer Invoices Due
        </button>
        <button
          onClick={() => setActiveTab("bills")}
          className={`px-3 py-2 rounded font-medium transition-colors whitespace-nowrap ${activeTab === "bills" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
        >
          Vendor Bills Due
        </button>
        <button
          onClick={() => setActiveTab("partner_ledger")}
          className={`px-3 py-2 rounded font-medium transition-colors whitespace-nowrap ${activeTab === "partner_ledger" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
        >
          Partner Ledgers
        </button>
        <button
          onClick={() => setActiveTab("general_ledger")}
          className={`px-3 py-2 rounded font-medium transition-colors whitespace-nowrap ${activeTab === "general_ledger" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
        >
          General Ledger
        </button>
        <button
          onClick={() => setActiveTab("journals")}
          className={`px-3 py-2 rounded font-medium transition-colors whitespace-nowrap ${activeTab === "journals" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
        >
          Journals & COA
        </button>
        <button
          onClick={() => setActiveTab("reconciliation")}
          className={`px-3 py-2 rounded font-medium transition-colors whitespace-nowrap ${activeTab === "reconciliation" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
        >
          Reconciliation
        </button>
        <button
          onClick={() => setActiveTab("change_logs")}
          className={`px-3 py-2 rounded font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${activeTab === "change_logs" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
        >
          <span>Change Logs</span>
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & DASHBOARD */}
      {activeTab === "overview" && stats && (
        <div className="space-y-4">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Cash & Bank</span>
              <div className="text-base font-bold text-slate-800 mt-1">₹{stats.cashBankBalance.toFixed(2)}</div>
              <span className="text-[10px] text-slate-400">Operating liquidity</span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Accounts Receivable</span>
              <div className="text-base font-bold text-amber-600 mt-1">₹{stats.accountsReceivable.toFixed(2)}</div>
              <span className="text-[10px] text-amber-700 font-medium">{stats.openInvoicesCount} invoices unpaid</span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Accounts Payable</span>
              <div className="text-base font-bold text-rose-600 mt-1">₹{stats.accountsPayable.toFixed(2)}</div>
              <span className="text-[10px] text-rose-700 font-medium">{stats.openBillsCount} bills unpaid</span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Inventory Valuation</span>
              <div className="text-base font-bold text-slate-800 mt-1">₹{stats.inventoryValuation.toFixed(2)}</div>
              <span className="text-[10px] text-slate-400">Stock on hand asset</span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Sales Revenue</span>
              <div className="text-base font-bold text-emerald-600 mt-1">₹{stats.salesRevenue.toFixed(2)}</div>
              <span className="text-[10px] text-slate-400">Net revenue recognized</span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Net Profit (Est.)</span>
              <div
                className={`text-base font-bold mt-1 ${stats.netProfitEstimate >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
              >
                ₹{stats.netProfitEstimate.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-400">Rev - COGS - Exp</span>
            </div>
          </div>

          {/* Recent Journal Entries Table */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800">Recent Double-Entry Journal Entries</h3>
                <p className="text-[11px] text-slate-500">
                  Every transaction posts equal debits and credits across journals. Click edit on any entry to modify narration or date.
                </p>
              </div>
              <span className="px-2 py-1 text-[11px] bg-slate-200 text-slate-700 rounded font-medium">
                Last 10 Entries
              </span>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs min-w-[1050px] whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 min-w-[120px]">Entry #</th>
                    <th className="px-3 py-2 min-w-[100px]">Date</th>
                    <th className="px-3 py-2 min-w-[90px]">Journal</th>
                    <th className="px-3 py-2 min-w-[140px]">Reference</th>
                    <th className="px-3 py-2 min-w-[340px]">Account Lines (Debit / Credit)</th>
                    <th className="px-3 py-2 text-right min-w-[110px]">Amount</th>
                    <th className="px-3 py-2 text-center min-w-[70px]">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recentEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-slate-400">
                        No journal entries found. Click &quot;Sync Past Transactions&quot; to import sales & bills.
                      </td>
                    </tr>
                  ) : (
                    recentEntries.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-semibold text-indigo-600">{e.entryNumber}</td>
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{e.date}</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-1 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded border border-slate-200">
                            {e.journalCode}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-700 font-medium">{e.reference || "—"}</td>
                        <td className="px-3 py-2">
                          <div className="space-y-1">
                            {e.items.map((it: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-[11px] gap-2">
                                <span className="text-slate-700 truncate max-w-xs">
                                  <span className="text-slate-400">{it.accountCode}</span> {it.accountName}
                                  {it.partnerName ? ` (${it.partnerName})` : ""}
                                </span>
                                <span className="font-mono text-slate-600">
                                  {it.debit > 0 ? (
                                    <span className="text-emerald-700 font-semibold">Dr ₹{it.debit.toFixed(2)}</span>
                                  ) : (
                                    <span className="text-slate-600">Cr ₹{it.credit.toFixed(2)}</span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-800">
                          ₹{e.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => setSelectedEditEntry(e)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                            title="Edit Voucher Details"
                          >
                            ✎
                          </button>
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

      {/* TAB 2: CUSTOMER INVOICES DUE */}
      {activeTab === "invoices" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search invoice or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1 text-xs border border-slate-300 rounded w-64 text-slate-800"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-700"
              >
                <option value="ALL">All Due Invoices</option>
                <option value="UNPAID">Unpaid Only</option>
                <option value="PARTIAL">Partially Paid Only</option>
              </select>
            </div>
            <div className="text-xs text-slate-500">
              Showing <strong>{invoicesDue.length}</strong> open customer invoices
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs min-w-[1150px] whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 min-w-[130px]">Invoice #</th>
                    <th className="px-3 py-2 min-w-[110px]">Date</th>
                    <th className="px-3 py-2 min-w-[200px]">Customer</th>
                    <th className="px-3 py-2 text-right min-w-[110px]">Total</th>
                    <th className="px-3 py-2 text-right min-w-[110px]">Paid</th>
                    <th className="px-3 py-2 text-right min-w-[110px]">Balance Due</th>
                    <th className="px-3 py-2 text-center min-w-[120px]">Status</th>
                    <th className="px-3 py-2 min-w-[240px]">Recorded Payments (Installments)</th>
                    <th className="px-3 py-2 text-center min-w-[100px]">Action</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-slate-200">
                {invoicesDue.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-6 text-center text-slate-400">
                      No unpaid customer invoices. All invoices are settled!
                    </td>
                  </tr>
                ) : (
                  invoicesDue
                    .filter((inv) => {
                      if (statusFilter !== "ALL" && inv.paymentStatus !== statusFilter) return false;
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        inv.invoiceNumber.toLowerCase().includes(q) ||
                        inv.customerName.toLowerCase().includes(q) ||
                        inv.customerPhone.includes(q)
                      );
                    })
                    .map((inv) => (
                      <tr
                        key={inv.id}
                        onClick={() => setDetailInvoiceId(inv.id)}
                        className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                        title="Click row to view GST Tax Invoice"
                      >
                        <td className="px-3 py-2 font-semibold text-indigo-600 group-hover:underline">{inv.invoiceNumber}</td>
                        <td className="px-3 py-2 text-slate-600">{inv.invoiceDate}</td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-slate-800">{inv.customerName}</div>
                          {inv.customerPhone && (
                            <div className="text-[11px] text-slate-400">{inv.customerPhone}</div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-700">₹{inv.grandTotal.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-emerald-600 font-medium">
                          ₹{inv.paidAmount.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-rose-600">
                          ₹{inv.remainingDue.toFixed(2)}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-1 text-[10px] rounded font-semibold uppercase ${inv.paymentStatus === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : inv.paymentStatus === "PARTIAL"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                          >
                            {inv.paymentStatus}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {inv.payments && inv.payments.length > 0 ? (
                            <div className="space-y-1">
                              {inv.payments.map((p) => (
                                <div key={p.id} className="flex items-center justify-between text-[10px] bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                  <span>
                                    ₹{p.amount.toFixed(2)} via {p.paymentMethod} on {p.date}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedPaymentVoucherId(p.id);
                                      }}
                                      className="text-emerald-700 hover:text-emerald-900 font-bold ml-1 hover:underline cursor-pointer"
                                      title="View Official GST Payment Voucher"
                                    >
                                      Receipt ➔
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedEditPayment({
                                          id: p.id,
                                          type: "CUSTOMER",
                                          amount: p.amount,
                                          paymentMethod: p.paymentMethod,
                                          date: p.date,
                                          ref: p.ref,
                                          targetName: `Invoice #${inv.invoiceNumber} (${inv.customerName})`,
                                        });
                                      }}
                                      className="text-indigo-600 hover:text-indigo-800 font-medium ml-1 cursor-pointer"
                                    >
                                      ✎
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">No payments yet</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailInvoiceId(inv.id);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded text-[11px] font-medium transition cursor-pointer"
                              title="View GST Registered Tax Invoice"
                            >
                              View
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPaymentModalState({
                                  isOpen: true,
                                  type: "CUSTOMER_INVOICE",
                                  invoiceId: inv.id,
                                  invoiceNumber: inv.invoiceNumber,
                                  partnerName: inv.customerName,
                                  partnerId: inv.customerId || undefined,
                                  grandTotal: inv.grandTotal,
                                  paidAmount: inv.paidAmount,
                                  remainingDue: inv.remainingDue,
                                });
                              }}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium shadow-xs transition cursor-pointer"
                            >
                              + Pay
                            </button>
                          </div>
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

      {/* TAB 3: VENDOR BILLS DUE */}
      {activeTab === "bills" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search bill # or supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1 text-xs border border-slate-300 rounded w-64 text-slate-800"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-700"
              >
                <option value="ALL">All Due Bills</option>
                <option value="UNPAID">Unpaid Only</option>
                <option value="PARTIAL">Partially Paid Only</option>
              </select>
            </div>
            <div className="text-xs text-slate-500">
              Showing <strong>{billsDue.length}</strong> open vendor bills
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs min-w-[1200px] whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 min-w-[130px]">Bill / Pur #</th>
                    <th className="px-3 py-2 min-w-[130px]">Supplier Bill Ref</th>
                    <th className="px-3 py-2 min-w-[110px]">Date</th>
                    <th className="px-3 py-2 min-w-[200px]">Supplier</th>
                    <th className="px-3 py-2 text-right min-w-[110px]">Total Amount</th>
                    <th className="px-3 py-2 text-right min-w-[110px]">Paid</th>
                    <th className="px-3 py-2 text-right min-w-[110px]">Balance Due</th>
                    <th className="px-3 py-2 text-center min-w-[120px]">Status</th>
                    <th className="px-3 py-2 min-w-[240px]">Recorded Disbursements</th>
                    <th className="px-3 py-2 text-center min-w-[100px]">Action</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-slate-200">
                {billsDue.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-6 text-center text-slate-400">
                      No unpaid vendor bills. All distributor accounts are settled!
                    </td>
                  </tr>
                ) : (
                  billsDue
                    .filter((b) => {
                      if (statusFilter !== "ALL" && b.paymentStatus !== statusFilter) return false;
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        b.invoiceNumber.toLowerCase().includes(q) ||
                        b.supplierInvoiceNumber.toLowerCase().includes(q) ||
                        b.supplierName.toLowerCase().includes(q)
                      );
                    })
                    .map((b) => (
                      <tr
                        key={b.id}
                        onClick={() => setDetailBillId(b.id)}
                        className="hover:bg-emerald-50/50 transition-colors cursor-pointer group"
                        title="Click row to view GST Vendor Bill"
                      >
                        <td className="px-3 py-2 font-semibold text-indigo-600 group-hover:underline">{b.invoiceNumber}</td>
                        <td className="px-3 py-2 text-slate-700 font-medium">
                          {b.supplierInvoiceNumber || "—"}
                        </td>
                        <td className="px-3 py-2 text-slate-600">{b.invoiceDate}</td>
                        <td className="px-3 py-2">
                          <div className="font-semibold text-slate-800">{b.supplierName}</div>
                          {b.supplierPhone && (
                            <div className="text-[11px] text-slate-400">{b.supplierPhone}</div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-700">₹{b.totalAmount.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-emerald-600 font-medium">
                          ₹{b.paidAmount.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-rose-600">
                          ₹{b.remainingDue.toFixed(2)}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-1 text-[10px] rounded font-semibold uppercase ${b.paymentStatus === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : b.paymentStatus === "PARTIAL"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                          >
                            {b.paymentStatus}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {b.payments && b.payments.length > 0 ? (
                            <div className="space-y-1">
                              {b.payments.map((p) => (
                                <div key={p.id} className="flex items-center justify-between text-[10px] bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                  <span>
                                    ₹{p.amount.toFixed(2)} via {p.paymentMethod} on {p.date}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedPaymentVoucherId(p.id);
                                      }}
                                      className="text-emerald-700 hover:text-emerald-900 font-bold ml-1 hover:underline cursor-pointer"
                                      title="View Official GST Payment Voucher"
                                    >
                                      Voucher ➔
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedEditPayment({
                                          id: p.id,
                                          type: "VENDOR",
                                          amount: p.amount,
                                          paymentMethod: p.paymentMethod,
                                          date: p.date,
                                          ref: p.ref,
                                          targetName: `Bill #${b.supplierInvoiceNumber || b.invoiceNumber} (${b.supplierName})`,
                                        });
                                      }}
                                      className="text-indigo-600 hover:text-indigo-800 font-medium ml-1 cursor-pointer"
                                    >
                                      ✎
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">No disbursements yet</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailBillId(b.id);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded text-[11px] font-medium transition cursor-pointer"
                              title="View GST Registered Vendor Bill & GRN"
                            >
                              View
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPaymentModalState({
                                  isOpen: true,
                                  type: "VENDOR_BILL",
                                  invoiceId: b.id,
                                  invoiceNumber: b.supplierInvoiceNumber || b.invoiceNumber,
                                  partnerName: b.supplierName || (b as any).supplier?.businessName || "Vendor",
                                  partnerId: b.supplierId || (b as any).supplier?.id,
                                  grandTotal: b.totalAmount,
                                  paidAmount: b.paidAmount,
                                  remainingDue: b.remainingDue,
                                });
                              }}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-medium shadow-xs transition cursor-pointer"
                            >
                              + Pay
                            </button>
                          </div>
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

      {/* TAB 4: PARTNER LEDGERS */}
      {activeTab === "partner_ledger" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPartnerTypeFilter("CUSTOMER")}
                className={`px-3 py-1 rounded text-xs font-semibold ${partnerTypeFilter === "CUSTOMER"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
              >
                Customer / Debtor Ledger
              </button>
              <button
                onClick={() => setPartnerTypeFilter("SUPPLIER")}
                className={`px-3 py-1 rounded text-xs font-semibold ${partnerTypeFilter === "SUPPLIER"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
              >
                Vendor / Creditor Ledger
              </button>
            </div>
            <div className="text-xs text-slate-500">
              Showing <strong>{partnerLedger.length}</strong> active partner ledger accounts
            </div>
          </div>

          <div className="space-y-3">
            {partnerLedger.length === 0 ? (
              <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-slate-400 text-xs">
                No ledger activity found for {partnerTypeFilter.toLowerCase()}s. Transactions will appear here as
                invoices and payments are posted.
              </div>
            ) : (
              partnerLedger.map((partner) => (
                <div key={partner.partnerKey} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs">{partner.partnerName}</span>
                        <span className="px-2 py-1 text-[10px] font-semibold bg-slate-200 text-slate-700 rounded">
                          {partner.partnerType}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Total {partner.lines.length} statement line(s) recorded
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px]">Total Debit:</span>{" "}
                        <span className="font-semibold text-slate-700">₹{partner.totalDebit.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Total Credit:</span>{" "}
                        <span className="font-semibold text-slate-700">₹{partner.totalCredit.toFixed(2)}</span>
                      </div>
                      <div className="bg-white px-3 py-1 rounded border border-slate-200">
                        <span className="text-slate-500 text-[10px]">Ending Balance:</span>{" "}
                        <span
                          className={`font-bold ${partner.balance > 0 ? "text-rose-600" : "text-emerald-600"
                            }`}
                        >
                          ₹{partner.balance.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full text-left text-xs min-w-[1000px] whitespace-nowrap">
                      <thead className="bg-slate-100 text-slate-600 font-medium border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2 min-w-[100px]">Date</th>
                          <th className="px-3 py-2 min-w-[120px]">Entry #</th>
                          <th className="px-3 py-2 min-w-[130px]">Reference</th>
                          <th className="px-3 py-2 min-w-[90px]">Journal</th>
                          <th className="px-3 py-2 min-w-[240px]">Memo / Label</th>
                          <th className="px-3 py-2 text-right min-w-[110px]">Debit</th>
                          <th className="px-3 py-2 text-right min-w-[110px]">Credit</th>
                          <th className="px-3 py-2 text-right min-w-[120px]">Running Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {partner.lines.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{l.date}</td>
                            <td className="px-3 py-2 font-mono text-indigo-600 font-medium">{l.entryNumber}</td>
                            <td className="px-3 py-2 font-medium text-slate-700">{l.reference || "—"}</td>
                            <td className="px-3 py-2">
                              <span className="px-1 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                {l.journalCode}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-slate-600 max-w-xs truncate">{l.label}</td>
                            <td className="px-3 py-2 text-right text-emerald-700 font-medium">
                              {l.debit > 0 ? `₹${l.debit.toFixed(2)}` : "—"}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-700 font-medium">
                              {l.credit > 0 ? `₹${l.credit.toFixed(2)}` : "—"}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-slate-800">
                              ₹{l.runningBalance.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: GENERAL LEDGER */}
      {activeTab === "general_ledger" && (
        <div className="space-y-3">
          <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>
              <strong>General Ledger:</strong> Complete double-entry chart accounts with debit/credit balance
              movements.
            </span>
            <span className="text-slate-400">{generalLedger.length} Accounts tracked</span>
          </div>

          <div className="space-y-3">
            {generalLedger.map((acc) => (
              <div key={acc.accountId} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-indigo-700 font-bold text-xs">{acc.accountCode}</span>
                    <span className="font-semibold text-slate-800 text-xs">{acc.accountName}</span>
                    <span className="px-2 py-1 text-[10px] rounded bg-slate-200 text-slate-700 font-semibold">
                      {acc.accountType}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-500">
                      Debits: <strong className="text-slate-700">₹{acc.totalDebit.toFixed(2)}</strong>
                    </span>
                    <span className="text-slate-500">
                      Credits: <strong className="text-slate-700">₹{acc.totalCredit.toFixed(2)}</strong>
                    </span>
                    <span className="text-slate-500">
                      Balance: <strong className="text-indigo-700">₹{acc.endingBalance.toFixed(2)}</strong>
                    </span>
                  </div>
                </div>

                {acc.lines.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-xs">No entries recorded in this period.</div>
                ) : (
                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full text-left text-xs min-w-[1000px] whitespace-nowrap">
                      <thead className="bg-slate-100 text-slate-600 font-medium border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-1 min-w-[100px]">Date</th>
                          <th className="px-3 py-1 min-w-[120px]">Entry #</th>
                          <th className="px-3 py-1 min-w-[130px]">Reference</th>
                          <th className="px-3 py-1 min-w-[160px]">Partner</th>
                          <th className="px-3 py-1 min-w-[220px]">Label</th>
                          <th className="px-3 py-1 text-right min-w-[110px]">Debit</th>
                          <th className="px-3 py-1 text-right min-w-[110px]">Credit</th>
                          <th className="px-3 py-1 text-right min-w-[120px]">Running Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {acc.lines.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-50">
                            <td className="px-3 py-1 text-slate-600 whitespace-nowrap">{l.date}</td>
                            <td className="px-3 py-1 font-mono text-indigo-600">{l.entryNumber}</td>
                            <td className="px-3 py-1 text-slate-700 font-medium">{l.reference || "—"}</td>
                            <td className="px-3 py-1 text-slate-700">{l.partnerName || "—"}</td>
                            <td className="px-3 py-1 text-slate-600 truncate max-w-xs">{l.label}</td>
                            <td className="px-3 py-1 text-right text-emerald-700 font-medium">
                              {l.debit > 0 ? `₹${l.debit.toFixed(2)}` : "—"}
                            </td>
                            <td className="px-3 py-1 text-right text-slate-700 font-medium">
                              {l.credit > 0 ? `₹${l.credit.toFixed(2)}` : "—"}
                            </td>
                            <td className="px-3 py-1 text-right font-bold text-slate-800">
                              ₹{l.balance.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: JOURNALS & CHART OF ACCOUNTS */}
      {activeTab === "journals" && (
        <div className="space-y-4">
          {/* Journals Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {journals.map((j) => (
              <div key={j.id} className="bg-white p-3 rounded-lg border border-slate-200 relative group">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-indigo-600 text-xs bg-indigo-50 px-2 py-1 rounded">
                    {j.code}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="px-2 py-1 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded uppercase">
                      {j.type}
                    </span>
                    <button
                      onClick={() => setSelectedEditJournal(j)}
                      className="text-slate-400 hover:text-indigo-600 p-1 text-xs"
                      title="Edit Journal"
                    >
                      ✎
                    </button>
                  </div>
                </div>
                <h4 className="font-semibold text-slate-800 text-xs mt-2">{j.name}</h4>
                <div className="text-[11px] text-slate-500 mt-1">
                  Default: {j.defaultAccount || "Configured automatically"}
                </div>
                <div className="text-[11px] font-medium text-slate-700 mt-2">
                  Total Entries: <strong>{j.entryCount}</strong>
                </div>
              </div>
            ))}
          </div>

          {/* Chart of Accounts Table with Edit Action */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800">Chart of Accounts (COA)</h3>
                <p className="text-[11px] text-slate-500">
                  Standardized chart of accounts. Click edit to adjust display name, notes, or calibrate balances.
                </p>
              </div>
              <span className="text-xs text-slate-500">{accounts.length} Accounts Active</span>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs min-w-[850px] whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 min-w-[90px]">Code</th>
                    <th className="px-3 py-2 min-w-[200px]">Account Name</th>
                    <th className="px-3 py-2 min-w-[130px]">Category / Type</th>
                    <th className="px-3 py-2 min-w-[220px]">Description</th>
                    <th className="px-3 py-2 text-right min-w-[120px]">Current Balance</th>
                    <th className="px-3 py-2 text-center min-w-[90px]">Status</th>
                    <th className="px-3 py-2 text-center min-w-[70px]">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {accounts.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono font-bold text-indigo-700">{a.code}</td>
                      <td className="px-3 py-2 font-semibold text-slate-800">{a.name}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-1 text-[10px] rounded font-semibold uppercase ${a.type === "ASSET"
                              ? "bg-blue-100 text-blue-800"
                              : a.type === "LIABILITY"
                                ? "bg-rose-100 text-rose-800"
                                : a.type === "INCOME"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : a.type === "EXPENSE"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-purple-100 text-purple-800"
                            }`}
                        >
                          {a.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-500 text-[11px]">{a.description || "—"}</td>
                      <td className="px-3 py-2 text-right font-bold text-slate-800">
                        ₹{a.currentBalance.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`px-2 py-1 text-[10px] rounded font-semibold ${a.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"
                            }`}
                        >
                          {a.isActive ? "Active" : "Archived"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => setSelectedEditAccount(a)}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                          title="Edit Account Details"
                        >
                          ✎
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: RECONCILIATION */}
      {activeTab === "reconciliation" && (
        <div className="space-y-3">
          {/* Action Bar */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <h3 className="font-bold text-slate-800">Bank & Ledger Reconciliation</h3>
              <p className="text-[11px] text-slate-500">
                Match payment receipts with invoices or vendor disbursements with supplier bills.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-50 border border-slate-200 px-3 py-1 rounded text-right">
                <span className="text-[10px] text-slate-500">Selected: </span>
                <span className="font-semibold text-slate-800">{selectedForReconcile.length} items</span> •{" "}
                <span className="text-[10px] text-slate-500">Debits: </span>
                <span className="font-semibold text-emerald-600">₹{reconcileDebits.toFixed(2)}</span> •{" "}
                <span className="text-[10px] text-slate-500">Credits: </span>
                <span className="font-semibold text-slate-700">₹{reconcileCredits.toFixed(2)}</span> •{" "}
                <span className="text-[10px] text-slate-500">Difference: </span>
                <span
                  className={`font-bold ${reconcileDiff === 0 && selectedForReconcile.length >= 2
                      ? "text-emerald-600"
                      : "text-rose-600"
                    }`}
                >
                  ₹{reconcileDiff.toFixed(2)}
                </span>
              </div>

              <button
                onClick={handleExecuteReconciliation}
                disabled={selectedForReconcile.length < 2 || reconcileDiff > 0.05 || loading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium disabled:opacity-50 transition-colors shadow-sm"
              >
                Reconcile ({selectedForReconcile.length})
              </button>
            </div>
          </div>

          {/* Unreconciled Items Table */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs min-w-[1000px] whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 w-10 text-center">Select</th>
                    <th className="px-3 py-2 min-w-[100px]">Date</th>
                    <th className="px-3 py-2 min-w-[120px]">Entry #</th>
                    <th className="px-3 py-2 min-w-[130px]">Reference</th>
                    <th className="px-3 py-2 min-w-[180px]">Account</th>
                    <th className="px-3 py-2 min-w-[160px]">Partner</th>
                    <th className="px-3 py-2 min-w-[180px]">Memo</th>
                    <th className="px-3 py-2 text-right min-w-[100px]">Debit</th>
                    <th className="px-3 py-2 text-right min-w-[100px]">Credit</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-slate-200">
                {unreconciledItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-6 text-center text-slate-400">
                      All journal items are fully reconciled!
                    </td>
                  </tr>
                ) : (
                  unreconciledItems.map((it) => {
                    const isSelected = selectedForReconcile.includes(it.id);
                    return (
                      <tr
                        key={it.id}
                        onClick={() => handleToggleReconcile(it.id)}
                        className={`cursor-pointer transition-colors ${isSelected ? "bg-indigo-50/70" : "hover:bg-slate-50"
                          }`}
                      >
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleReconcile(it.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{it.date}</td>
                        <td className="px-3 py-2 font-mono text-indigo-600 font-medium">{it.entryNumber}</td>
                        <td className="px-3 py-2 font-medium text-slate-700">{it.reference || "—"}</td>
                        <td className="px-3 py-2">
                          <span className="font-mono text-slate-500">{it.accountCode}</span> {it.accountName}
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-800">{it.partnerName}</td>
                        <td className="px-3 py-2 text-slate-500 truncate max-w-xs">{it.label}</td>
                        <td className="px-3 py-2 text-right font-medium text-emerald-700">
                          {it.debit > 0 ? `₹${it.debit.toFixed(2)}` : "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-700">
                          {it.credit > 0 ? `₹${it.credit.toFixed(2)}` : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: CHANGE LOGS & AUDIT TRAIL */}
      {activeTab === "change_logs" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search change logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1 text-xs border border-slate-300 rounded w-64 text-slate-800"
              />
              <select
                value={logEntityFilter}
                onChange={(e) => setLogEntityFilter(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-700"
              >
                <option value="ALL">All Entities</option>
                <option value="Account">Accounts Only</option>
                <option value="Journal">Journals Only</option>
                <option value="JournalEntry">Journal Entries Only</option>
                <option value="SalesPayment">Customer Receipts Only</option>
                <option value="SupplierPayment">Vendor Payments Only</option>
              </select>
            </div>
            <div className="text-xs text-slate-500">
              Showing <strong>{auditLogs.length}</strong> recorded audit change event(s)
            </div>
          </div>

          <div className="space-y-2">
            {auditLogs.length === 0 ? (
              <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-slate-400 text-xs">
                No change logs recorded yet. When you edit any Account, Journal, Voucher, or Payment, a chronological
                audit entry with previous and new values will be documented here.
              </div>
            ) : (
              auditLogs.map((log) => {
                const changes = log.details?.changes || [];
                return (
                  <div key={log.id} className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                          {log.action.replace("UPDATE_", "UPDATED ")}
                        </span>
                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-semibold text-[10px] uppercase border border-slate-200">
                          {log.entity}
                        </span>
                        {log.details?.accountCode && (
                          <span className="text-slate-600 font-mono text-[11px]">
                            #{log.details.accountCode} - {log.details.accountName}
                          </span>
                        )}
                        {log.details?.journalCode && (
                          <span className="text-slate-600 font-mono text-[11px]">
                            [{log.details.journalCode}] {log.details.journalName}
                          </span>
                        )}
                        {log.details?.entryNumber && (
                          <span className="text-slate-600 font-mono text-[11px]">
                            {log.details.entryNumber} {log.details.reference ? `(${log.details.reference})` : ""}
                          </span>
                        )}
                        {log.details?.invoiceNumber && (
                          <span className="text-slate-600 font-medium text-[11px]">
                            Invoice: {log.details.invoiceNumber} • {log.details.customerName}
                          </span>
                        )}
                        {log.details?.billNumber && (
                          <span className="text-slate-600 font-medium text-[11px]">
                            Bill: {log.details.billNumber} • {log.details.supplierName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                        <span>Updated by <strong>{log.actorName}</strong> ({log.actorRole})</span>
                        <span>•</span>
                        <span className="text-slate-600 font-medium">{formatLogDate(log.createdAt)}</span>
                      </div>
                    </div>

                    {/* Diff breakdown */}
                    {changes.length > 0 ? (
                      <div className="space-y-1 pt-1">
                        <div className="text-[11px] font-medium text-slate-500">Modified Fields:</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {changes.map((c, cIdx) => (
                            <div key={cIdx} className="bg-slate-50 p-2 rounded border border-slate-200 text-[11px] flex items-center justify-between">
                              <span className="font-semibold text-slate-700">{c.label}:</span>
                              <div className="flex items-center gap-1 font-mono">
                                <span className="text-rose-600 line-through bg-rose-50 px-1 rounded">
                                  {c.from !== null && c.from !== undefined ? String(c.from) : "None"}
                                </span>
                                <span className="text-slate-400">➔</span>
                                <span className="text-emerald-700 font-bold bg-emerald-50 px-1 rounded">
                                  {c.to !== null && c.to !== undefined ? String(c.to) : "None"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">Record saved with standard updates.</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Register Payment Modal */}
      <RegisterPaymentModal
        isOpen={paymentModalState.isOpen}
        onClose={() => setPaymentModalState((p) => ({ ...p, isOpen: false }))}
        type={paymentModalState.type}
        invoiceId={paymentModalState.invoiceId}
        invoiceNumber={paymentModalState.invoiceNumber}
        partnerName={paymentModalState.partnerName}
        partnerId={paymentModalState.partnerId}
        grandTotal={paymentModalState.grandTotal}
        paidAmount={paymentModalState.paidAmount}
        remainingDue={paymentModalState.remainingDue}
        onPaymentSuccess={() => {
          setFeedback({
            type: "success",
            msg: `Payment registered successfully on ${paymentModalState.invoiceNumber}`,
          });
          loadData();
        }}
      />

      {/* Edit Account Modal */}
      <EditAccountModal
        isOpen={!!selectedEditAccount}
        onClose={() => setSelectedEditAccount(null)}
        account={selectedEditAccount}
        onSuccess={() => {
          setFeedback({ type: "success", msg: "Account updated and change logged." });
          loadData();
        }}
      />

      {/* Edit Journal Modal */}
      <EditJournalModal
        isOpen={!!selectedEditJournal}
        onClose={() => setSelectedEditJournal(null)}
        journal={selectedEditJournal}
        accounts={accounts}
        onSuccess={() => {
          setFeedback({ type: "success", msg: "Journal updated and change logged." });
          loadData();
        }}
      />

      {/* Edit Journal Entry Modal */}
      <EditJournalEntryModal
        isOpen={!!selectedEditEntry}
        onClose={() => setSelectedEditEntry(null)}
        entry={selectedEditEntry}
        onSuccess={() => {
          setFeedback({ type: "success", msg: "Journal entry voucher updated and change logged." });
          loadData();
        }}
      />

      {/* Edit Payment Modal */}
      <EditPaymentModal
        isOpen={!!selectedEditPayment}
        onClose={() => setSelectedEditPayment(null)}
        payment={selectedEditPayment}
        onSuccess={() => {
          setFeedback({ type: "success", msg: "Payment updated, balances recalculated, and change logged." });
          loadData();
        }}
      />

      {/* Detailed GST Tax Invoice Modal */}
      {detailInvoiceId && (
        <GstInvoiceDetailModal
          invoiceId={detailInvoiceId}
          onClose={() => setDetailInvoiceId(null)}
        />
      )}

      {/* Detailed GST Vendor Bill Modal */}
      {detailBillId && (
        <GstBillDetailModal
          billId={detailBillId}
          onClose={() => setDetailBillId(null)}
        />
      )}

      {/* Detailed GST Payment Voucher Modal */}
      {selectedPaymentVoucherId && (
        <PaymentVoucherModal
          paymentId={selectedPaymentVoucherId}
          onClose={() => setSelectedPaymentVoucherId(null)}
          onViewInvoice={(invId) => {
            setSelectedPaymentVoucherId(null);
            setDetailInvoiceId(invId);
          }}
          onViewBill={(billId) => {
            setSelectedPaymentVoucherId(null);
            setDetailBillId(billId);
          }}
        />
      )}
    </div>
  );
};
