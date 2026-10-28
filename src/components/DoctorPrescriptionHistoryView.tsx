"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  X,
  Stethoscope,
  Pill,
} from "lucide-react";
import { doctorApi, DoctorAuthUser } from "@/lib/api/doctor.api";
import { triggerPrint } from "@/lib/print";

interface DoctorPrescriptionHistoryViewProps {
  doctor: DoctorAuthUser | null;
}

export default function DoctorPrescriptionHistoryView({
  doctor,
}: DoctorPrescriptionHistoryViewProps) {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DISPENSED" | "QUEUE">("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Modal to inspect past prescription details
  const [activeRx, setActiveRx] = useState<any | null>(null);

  useEffect(() => {
    loadPrescriptions();
  }, [doctor?.storeId]);

  const loadPrescriptions = async () => {
    setIsLoading(true);
    try {
      const res = await doctorApi.getAllPrescriptions({
        storeId: doctor?.storeId,
      });
      if (res.success && res.prescriptions) {
        setPrescriptions(res.prescriptions);
      }
    } catch (err) {
      console.error("Failed to load prescriptions", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = prescriptions.filter((rx) => {
    const isDispensed = rx.isDispensed || rx.salesInvoices?.length > 0;
    if (statusFilter === "DISPENSED" && !isDispensed) return false;
    if (statusFilter === "QUEUE" && isDispensed) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      rx.rxNumber?.toLowerCase().includes(q) ||
      rx.customer?.name?.toLowerCase().includes(q) ||
      rx.customer?.phone?.includes(q) ||
      rx.notes?.diagnosis?.toLowerCase().includes(q) ||
      (typeof rx.notes === "string" && rx.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Page Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5 stroke-2" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Prescription History & Digital eRx Archive
            </h1>
            <p className="text-xs text-slate-500">
              Audit trail of all issued digital prescriptions, counter dispensing status, and printable records
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Status Filter Buttons */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === "ALL" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
              }`}
            >
              All ({prescriptions.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("QUEUE")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === "QUEUE" ? "bg-white text-amber-700 shadow-2xs" : "text-slate-500"
              }`}
            >
              In Queue
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("DISPENSED")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === "DISPENSED" ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-500"
              }`}
            >
              Dispensed
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Rx # or patient..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading prescription archive...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No prescriptions found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs min-w-[850px] whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="pb-3 pl-2 min-w-[140px]">Rx Number</th>
                  <th className="pb-3 min-w-[200px]">Patient Name</th>
                  <th className="pb-3 min-w-[180px]">Diagnosis</th>
                  <th className="pb-3 min-w-[120px]">Date Prescribed</th>
                  <th className="pb-3 min-w-[120px]">Dispensing Status</th>
                  <th className="pb-3 text-right pr-2 min-w-[110px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((rx) => {
                  const isDispensed = rx.isDispensed || rx.salesInvoices?.length > 0;
                  const patientName = rx.patientName || rx.customer?.name || "Walk-in Patient";

                  let diag = "General Consultation";
                  if (rx.notes) {
                    if (typeof rx.notes === "object" && rx.notes.diagnosis) {
                      diag = rx.notes.diagnosis;
                    } else if (typeof rx.notes === "string") {
                      try {
                        const parsed = JSON.parse(rx.notes);
                        if (parsed.diagnosis) diag = parsed.diagnosis;
                      } catch {
                        diag = rx.notes.split("\n")[0] || rx.notes;
                      }
                    }
                  }

                  const rawDate = rx.prescriptionDate || rx.date || rx.createdAt;
                  let displayDate = "Recent";
                  if (rawDate) {
                    try {
                      const parsedDate = new Date(rawDate);
                      displayDate = isNaN(parsedDate.getTime())
                        ? String(rawDate)
                        : parsedDate.toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          });
                    } catch {
                      displayDate = String(rawDate);
                    }
                  }

                  return (
                    <tr key={rx.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 pl-2 font-mono font-bold text-indigo-600">
                        {rx.rxNumber}
                      </td>

                      <td className="py-3 font-semibold text-slate-900">
                        {patientName}
                      </td>

                      <td className="py-3 text-slate-500 truncate max-w-[200px]">
                        {diag}
                      </td>

                      <td className="py-3 text-slate-500">
                        {displayDate}
                      </td>

                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            isDispensed
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isDispensed ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                            }`}
                          />
                          {isDispensed ? "Dispensed at Counter" : "Waiting in POS Queue"}
                        </span>
                      </td>

                      <td className="py-3 text-right pr-2">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveRx(rx)}
                            className="px-2 py-1 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold border border-slate-200 transition cursor-pointer"
                          >
                            View Rx Slip
                          </button>

                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg border border-slate-200 transition cursor-pointer"
                            title="Print Prescription"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Prescription Details Modal */}
      {activeRx && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div id="printable-area" className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 print:border-none print:shadow-none print:p-0">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Digital Prescription Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveRx(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Rx Reference:</span>
                <span className="font-mono font-bold text-indigo-600">{activeRx.rxNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Patient Name:</span>
                <span className="font-bold text-slate-900">{activeRx.customer?.name || "Walk-in Patient"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Doctor Reg:</span>
                <span className="text-slate-700 font-mono">{activeRx.doctorRegNo || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Diagnosis:</span>
                <span className="font-semibold text-slate-800">
                  {activeRx.notes?.diagnosis || activeRx.notes || "General Consultation"}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2 no-print print:hidden">
              <button
                type="button"
                onClick={() => setActiveRx(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => triggerPrint("printable-area")}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/20 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Rx
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
