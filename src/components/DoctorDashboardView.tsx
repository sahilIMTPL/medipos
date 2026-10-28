"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Users,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  ArrowRight,
  TrendingUp,
  Search,
  Calendar,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { doctorApi, DoctorAuthUser } from "@/lib/api/doctor.api";

interface DoctorDashboardViewProps {
  doctor: DoctorAuthUser | null;
  onNavigateToConsultation: () => void;
  onNavigateToPatients: () => void;
  onNavigateToPrescriptions: () => void;
}

export default function DoctorDashboardView({
  doctor,
  onNavigateToConsultation,
  onNavigateToPatients,
  onNavigateToPrescriptions,
}: DoctorDashboardViewProps) {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [pendingQueue, setPendingQueue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [rxRes, patRes, queueRes] = await Promise.all([
          doctorApi.getAllPrescriptions({ storeId: doctor?.storeId }),
          doctorApi.getAllPatients({ storeId: doctor?.storeId }),
          doctorApi.getPendingDoctorRxQueue({ storeId: doctor?.storeId }),
        ]);

        if (rxRes.success && rxRes.prescriptions) {
          setPrescriptions(rxRes.prescriptions);
        }
        if (patRes.success && patRes.customers) {
          setPatients(patRes.customers);
        }
        if (queueRes.success && queueRes.pendingRxList) {
          setPendingQueue(queueRes.pendingRxList);
        }
      } catch (err) {
        console.error("Dashboard data fetch error", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [doctor?.storeId]);

  const totalPrescriptions = prescriptions.length;
  const dispensedPrescriptions = prescriptions.filter((p) => p.isDispensed || p.salesInvoices?.length > 0).length;
  const pendingInQueue = pendingQueue.length;
  const totalPatientsCount = patients.length;

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans">
      {/* Light Clean Compact Welcome Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              {doctor?.name || "Dr. Rajesh Sharma, MD"}
            </h1>
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {doctor?.specialization || "Consultant Physician"}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Connected to <span className="font-semibold text-slate-700">{doctor?.storeName || "Medical Store"}</span> • OPD Consultation Desk
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToConsultation}
          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-2xs transition flex items-center gap-2 cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Stethoscope className="w-4 h-4" />
          <span>Start Consultation</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Today's Consultations */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Prescriptions Issued
            </span>
            <p className="text-xl font-bold text-slate-900 mt-1">{totalPrescriptions}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: Registered Patients */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Patients
            </span>
            <p className="text-xl font-bold text-slate-900 mt-1">{totalPatientsCount}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3: Dispensed by Pharmacy POS */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Dispensed at Counter
            </span>
            <p className="text-xl font-bold text-slate-900 mt-1">{dispensedPrescriptions}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Card 4: Waiting in POS Dispensing Queue */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Waiting in POS Queue
            </span>
            <p className="text-xl font-bold text-slate-900 mt-1">{pendingInQueue}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 2-Column Section: Recent Prescriptions & Fast Clinical Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Recent Prescriptions (8 Cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Prescriptions Beamed</h2>
              <p className="text-xs text-slate-500">Live eRx transmission status to connected pharmacy counter</p>
            </div>
            <button
              type="button"
              onClick={onNavigateToPrescriptions}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading prescription archive...</div>
          ) : prescriptions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No prescriptions issued yet. Start your first consultation above!
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs min-w-[700px] whitespace-nowrap">
                <thead>
                  <tr className="text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100">
                    <th className="pb-3 min-w-[130px]">Rx Reference</th>
                    <th className="pb-3 min-w-[180px]">Patient Name</th>
                    <th className="pb-3 min-w-[160px]">Diagnosis</th>
                    <th className="pb-3 min-w-[110px]">Date</th>
                    <th className="pb-3 text-right min-w-[120px]">Dispensing Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {prescriptions.slice(0, 7).map((rx) => {
                    const isDispensed = rx.isDispensed || rx.salesInvoices?.length > 0;
                    let diagnosisText = "General Consultation";
                    if (rx.notes) {
                      if (typeof rx.notes === "object" && rx.notes.diagnosis) {
                        diagnosisText = rx.notes.diagnosis;
                      } else if (typeof rx.notes === "string") {
                        try {
                          const parsed = JSON.parse(rx.notes);
                          if (parsed.diagnosis) diagnosisText = parsed.diagnosis;
                        } catch {
                          diagnosisText = rx.notes.split("\n")[0] || rx.notes;
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
                          : parsedDate.toLocaleDateString([], { month: "short", day: "numeric" });
                      } catch {
                        displayDate = String(rawDate);
                      }
                    }

                    return (
                      <tr key={rx.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 font-mono font-bold text-indigo-600">{rx.rxNumber}</td>
                        <td className="py-3 font-semibold text-slate-900">
                          {rx.patientName || rx.customer?.name || "Walk-in Patient"}
                        </td>
                        <td className="py-3 text-slate-500 truncate max-w-[180px]">
                          {diagnosisText}
                        </td>
                        <td className="py-3 text-slate-400">
                          {displayDate}
                        </td>
                        <td className="py-3 text-right">
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
                            {isDispensed ? "Dispensed" : "In Queue"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Quick Clinical Shortcuts (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Quick Clinical Shortcuts</h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={onNavigateToConsultation}
                className="w-full text-left p-3 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200/80 transition flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Stethoscope className="w-4 h-4 text-indigo-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">
                      New Consultation Desk
                    </p>
                    <p className="text-[10px] text-slate-500">Live formulary & triage</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={onNavigateToPatients}
                className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Patients Dossier</p>
                    <p className="text-[10px] text-slate-500">History, allergies & past visits</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={onNavigateToPrescriptions}
                className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Prescription Archive</p>
                    <p className="text-[10px] text-slate-500">Reprint & audit past digital Rx</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Pharmacy Bridge Card */}
          <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-5 text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Pharmacy Connection Active</span>
            </div>
            <p className="text-emerald-700 leading-relaxed text-[11px]">
              Every prescription you complete in the OPD Desk is transmitted over a secure bridge to{" "}
              <strong className="text-emerald-900">{doctor?.storeName || "City Medical Store"}</strong>.
              Cashiers at the counter load in-stock batches with 1 click!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
