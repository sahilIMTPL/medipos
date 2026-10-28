"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Activity,
  Calendar,
  Phone,
  AlertTriangle,
  Stethoscope,
  ChevronRight,
  User,
  X,
  FileText,
  Pill,
} from "lucide-react";
import { doctorApi, DoctorAuthUser, PatientClinicalDossier } from "@/lib/api/doctor.api";

interface DoctorPatientsHistoryViewProps {
  doctor: DoctorAuthUser | null;
  onSelectPatientForConsultation: (patient: any) => void;
}

export default function DoctorPatientsHistoryView({
  doctor,
  onSelectPatientForConsultation,
}: DoctorPatientsHistoryViewProps) {
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Selected dossier for full slide-over
  const [selectedDossier, setSelectedDossier] = useState<PatientClinicalDossier | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);

  useEffect(() => {
    loadPatients();
  }, [doctor?.storeId]);

  const loadPatients = async (q?: string) => {
    setIsLoading(true);
    try {
      const res = await doctorApi.getAllPatients({
        storeId: doctor?.storeId,
        q: q || undefined,
      });
      if (res.success && res.customers) {
        setPatients(res.customers);
      }
    } catch (err) {
      console.error("Failed to load patients", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDossier = async (patient: any) => {
    setLoadingDossier(true);
    try {
      const res = await doctorApi.getPatientClinicalHistory({
        customerId: patient.id,
        query: patient.name,
        storeId: doctor?.storeId,
      });
      if (res.success && res.patient) {
        setSelectedDossier(res.patient);
      } else {
        setSelectedDossier({
          id: patient.id,
          name: patient.name,
          phone: patient.phone,
          address: patient.address,
          chronicDiseases: patient.chronicDiseases || [],
          allergies: patient.allergies || [],
          totalVisits: patient.salesInvoices?.length || 1,
          pastVisits: [],
          previouslyGivenMedicines: [],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDossier(false);
    }
  };

  const filtered = patients.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Page Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5 stroke-2" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Patient Clinical History & Dossier Archive
            </h1>
            <p className="text-xs text-slate-500">
              Access patient medical records, past diagnoses, chronic conditions, and previous prescriptions
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            placeholder="Search by name, phone or ID..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
          />
        </div>
      </div>

      {/* Patients Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading patient records...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No patient records found matching &quot;{searchQuery}&quot;.
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs min-w-[850px] whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="pb-3 pl-2 min-w-[200px]">Patient Details</th>
                  <th className="pb-3 min-w-[140px]">Contact Number</th>
                  <th className="pb-3 min-w-[160px]">Chronic Conditions</th>
                  <th className="pb-3 min-w-[150px]">Known Allergies</th>
                  <th className="pb-3 min-w-[100px]">Past Visits</th>
                  <th className="pb-3 text-right pr-2 min-w-[120px]">Clinical Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((pt) => {
                  const visitsCount = pt.salesInvoices?.length || 0;
                  return (
                    <tr key={pt.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 pl-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                            {pt.name?.charAt(0) || "P"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{pt.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">ID: {pt.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 font-medium text-slate-600">
                        {pt.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {pt.phone}
                          </span>
                        ) : (
                          <span className="text-slate-400">Not recorded</span>
                        )}
                      </td>

                      <td className="py-3">
                        {pt.chronicDiseases && pt.chronicDiseases.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {pt.chronicDiseases.map((d: string) => (
                              <span
                                key={d}
                                className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">None recorded</span>
                        )}
                      </td>

                      <td className="py-3">
                        {pt.allergies && pt.allergies.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {pt.allergies.map((a: string) => (
                              <span
                                key={a}
                                className="px-2 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200"
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-emerald-600 font-medium text-[11px]">NKDA (No Allergies)</span>
                        )}
                      </td>

                      <td className="py-3">
                        <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {visitsCount} {visitsCount === 1 ? "Visit" : "Visits"}
                        </span>
                      </td>

                      <td className="py-3 text-right pr-2">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenDossier(pt)}
                            className="px-2 py-1 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold border border-slate-200 transition cursor-pointer"
                          >
                            View Dossier
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectPatientForConsultation(pt)}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <Stethoscope className="w-3 h-3" />
                            <span>Consult</span>
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

      {/* Patient Dossier Slide-Over Modal */}
      {selectedDossier && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex justify-end z-50 animate-in fade-in">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-lg">Patient Clinical Dossier</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDossier(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Overview Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-base font-bold text-slate-900">{selectedDossier.name}</h4>
                  <p className="text-slate-500">Phone: {selectedDossier.phone || "Not recorded"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSelectPatientForConsultation(selectedDossier);
                    setSelectedDossier(null);
                  }}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Start Consultation</span>
                </button>
              </div>

              {selectedDossier.address && (
                <p className="text-slate-600">Address: {selectedDossier.address}</p>
              )}
            </div>

            {/* Previously Prescribed Medicines */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                <Pill className="w-4 h-4 text-indigo-600" />
                <span>Previously Given Medicines</span>
              </h4>

              {selectedDossier.previouslyGivenMedicines?.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                  No previous prescriptions recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDossier.previouslyGivenMedicines.map((pm, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-xs flex items-center justify-between shadow-2xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{pm.productName}</p>
                        {pm.genericName && (
                          <p className="text-[10px] text-slate-500">Salt: {pm.genericName}</p>
                        )}
                        <p className="text-[11px] text-slate-600 mt-1">
                          {pm.lastDosage} • {pm.lastFrequency} • {pm.lastDuration}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(pm.lastPrescribedDate).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
