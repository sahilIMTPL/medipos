"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import {
  ScrollText,
  Search,
  Filter,
  RefreshCw,
  Download,
  Calendar,
  User,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Clock,
  Activity,
} from "lucide-react";
import { api, AuditLogItem } from "@/lib/api";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedAction, setSelectedAction] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Inspector Modal State
  const [inspectLog, setInspectLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs({
        action: selectedAction !== "ALL" ? selectedAction : undefined,
        search: search.trim() || undefined,
        page,
        limit: 25,
      });

      if (res.success) {
        setLogs(res.logs || []);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalCount(res.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, selectedAction]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const actionCategories = [
    { id: "ALL", label: "All Events" },
    { id: "CREATE_SALE", label: "Sales Checkout" },
    { id: "CREATE_SALE_RETURN", label: "Sales Returns" },
    { id: "CREATE_PURCHASE", label: "Purchases" },
    { id: "UPDATE_STORE_SETTINGS", label: "Settings Changes" },
    { id: "BACKUP_EXPORT", label: "Backup Exports" },
  ];

  const getActionBadge = (action: string) => {
    if (action.includes("SALE_RETURN")) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    if (action.includes("SALE")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (action.includes("PURCHASE")) {
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }
    if (action.includes("SETTING")) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ["Timestamp", "Action", "Entity", "Entity ID", "Actor", "Role", "IP Address", "Details"];
    const rows = logs.map((l) => [
      new Date(l.createdAt).toLocaleString(),
      l.action,
      l.entity,
      l.entityId || "N/A",
      l.actorName,
      l.actorRole,
      l.ipAddress || "Local",
      JSON.stringify(l.details || {}).replace(/"/g, '""'),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_log_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout activeMenuId="audit-logs">
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200">
              <ScrollText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activity Logs</h1>
              <p className="text-sm text-slate-500">
                Recent store actions and system events
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={logs.length === 0}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <Download className="h-4 w-4 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={fetchLogs}
              className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition shadow-2xs cursor-pointer"
              title="Refresh Logs"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by action, invoice number, entity ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />
            </form>

            <div className="text-xs text-slate-500 font-semibold whitespace-nowrap">
              Total Logged Events: <span className="text-slate-900 font-bold">{totalCount}</span>
            </div>
          </div>

          {/* Action Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            {actionCategories.map((act) => (
              <button
                key={act.id}
                type="button"
                onClick={() => {
                  setSelectedAction(act.id);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex-shrink-0 ${
                  selectedAction === act.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
                }`}
              >
                {act.label}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-20 text-center text-slate-400">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-600" />
              Loading audit trail records...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-20 text-center text-slate-400">
              <Activity className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-600">No audit events found.</p>
              <p className="text-xs text-slate-400 mt-1">
                Perform transactions or modify settings to generate activity records.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs min-w-[950px] whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-3 min-w-[170px]">Timestamp</th>
                    <th className="px-4 py-3 min-w-[150px]">Actor / User</th>
                    <th className="px-4 py-3 min-w-[140px]">Action Type</th>
                    <th className="px-4 py-3 min-w-[130px]">Target Entity</th>
                    <th className="px-4 py-3 min-w-[160px]">Entity Reference</th>
                    <th className="px-4 py-3 min-w-[110px]">IP Address</th>
                    <th className="px-4 py-3 min-w-[90px] text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-mono">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                            {log.actorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block leading-tight">{log.actorName}</span>
                            <span className="text-[10px] text-slate-400">{log.actorRole}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold border uppercase ${getActionBadge(log.action)}`}>
                          {log.action.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {log.entity}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                        {log.entityId ? (
                          <span className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-medium">
                            {log.entityId.slice(0, 16)}...
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">
                        {log.ipAddress || "127.0.0.1"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setInspectLog(log)}
                          className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                Page {page} of {totalPages}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Details Inspector Modal */}
        {inspectLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="px-6 py-4 bg-white border-b border-slate-100 text-slate-900 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Audit Event Inspector</h3>
                  <p className="text-xs text-slate-500">
                    {inspectLog.action} • {inspectLog.entity}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectLog(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Actor</span>
                    <span className="text-slate-800 font-bold">{inspectLog.actorName} ({inspectLog.actorRole})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Timestamp</span>
                    <span className="text-slate-800">{new Date(inspectLog.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">IP Address</span>
                    <span className="font-mono text-slate-800">{inspectLog.ipAddress || "Localhost"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Entity ID</span>
                    <span className="font-mono text-slate-800 truncate block">{inspectLog.entityId || "N/A"}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-700 font-bold block mb-1 uppercase tracking-wider text-[11px]">
                    Payload & Metadata
                  </span>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[11px] overflow-x-auto max-h-64 custom-scrollbar">
                    {JSON.stringify(inspectLog.details || {}, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInspectLog(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
