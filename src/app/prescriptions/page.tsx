"use client";

import React, { useState, useEffect, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import {
  ClipboardList,
  Search,
  FileText,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  X,
  Stethoscope,
  Building,
  Phone,
  Pill,
  Download,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { api, PrescriptionListItem } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function PrescriptionsPage() {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<PrescriptionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Dispensed" | "Pending">("ALL");

  // New Prescription Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAddress, setPatientAddress] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [doctorRegNo, setDoctorRegNo] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [prescriptionDate, setPrescriptionDate] = useState("");
  const [medicineInput, setMedicineInput] = useState("");
  const [medicinesList, setMedicinesList] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  const loadPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await api.getPrescriptions();
      if (res.success && res.prescriptions) {
        setPrescriptions(res.prescriptions);
      }
    } catch (err) {
      console.error("Failed to load prescriptions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
    setPrescriptionDate(new Date().toISOString().split("T")[0]);
  }, []);

  const handleAddMedicine = () => {
    const trimmed = medicineInput.trim();
    if (!trimmed) return;
    if (!medicinesList.includes(trimmed)) {
      setMedicinesList([...medicinesList, trimmed]);
    }
    setMedicineInput("");
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicinesList(medicinesList.filter((_, i) => i !== index));
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName.trim() || !patientName.trim()) {
      setFormError("Patient name and Doctor name are required.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      await api.createPrescription({
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim() || undefined,
        patientAddress: patientAddress.trim() || undefined,
        doctorName: doctorName.trim(),
        doctorRegNo: doctorRegNo.trim() || undefined,
        clinicName: clinicName.trim() || undefined,
        prescriptionDate,
        medicines: medicinesList,
        notes: notes.trim() || undefined,
      });

      setIsModalOpen(false);
      // Reset form
      setPatientName("");
      setPatientPhone("");
      setPatientAddress("");
      setDoctorName("");
      setDoctorRegNo("");
      setClinicName("");
      setMedicinesList([]);
      setNotes("");

      loadPrescriptions();
    } catch (err: any) {
      setFormError(err.message || "Failed to record prescription");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this prescription?")) return;
    try {
      await api.deletePrescription(id);
      loadPrescriptions();
    } catch (err: any) {
      alert(err.message || "Cannot delete prescription");
    }
  };

  // Export Schedule H1 Register for FDA drug inspector audit
  const handleExportScheduleH1 = () => {
    if (prescriptions.length === 0) {
      alert("No prescriptions available to export.");
      return;
    }

    const headers = [
      "Rx Number",
      "Date",
      "Patient Name",
      "Patient Phone",
      "Patient Address",
      "Doctor Name",
      "Doctor Reg No (MCI)",
      "Clinic / Hospital",
      "Dispensed Status",
      "Medicines / Salt",
      "Linked Sales Invoices",
    ];

    const rows = prescriptions.map((p) => [
      `"${p.rxNumber}"`,
      `"${p.date}"`,
      `"${p.patientName}"`,
      `"${p.patientPhone || "N/A"}"`,
      `"${p.patientAddress || "N/A"}"`,
      `"${p.doctorName}"`,
      `"${p.doctorRegNo || "N/A"}"`,
      `"${p.clinicName || "N/A"}"`,
      `"${p.status}"`,
      `"${p.medicines.join(" | ")}"`,
      `"${p.salesInvoices.map((s) => s.invoiceNumber).join(", ") || "None"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Schedule_H1_Drug_Register_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return prescriptions.filter((p) => {
      const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;

      return (
        p.patientName.toLowerCase().includes(q) ||
        p.doctorName.toLowerCase().includes(q) ||
        (p.doctorRegNo && p.doctorRegNo.toLowerCase().includes(q)) ||
        p.rxNumber.toLowerCase().includes(q) ||
        (p.clinicName && p.clinicName.toLowerCase().includes(q)) ||
        p.medicines.some((m) => m.toLowerCase().includes(q))
      );
    });
  }, [prescriptions, search, statusFilter]);

  return (
    <AppLayout activeMenuId="prescriptions">
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200 shadow-sm">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Prescriptions
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                  {prescriptions.length} records
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Doctor prescriptions and customer records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportScheduleH1}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Download className="h-4 w-4 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Prescription</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Prescriptions</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{prescriptions.length}</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Stethoscope className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dispensed at POS</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {prescriptions.filter((p) => p.status === "Dispensed").length}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Dispensing</p>
              <p className="text-2xl font-black text-amber-600 mt-1">
                {prescriptions.filter((p) => p.status === "Pending").length}
              </p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient, doctor, registration no, or medicine..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            {(["ALL", "Dispensed", "Pending"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statusFilter === st
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {st === "ALL" ? "All Prescriptions" : st}
              </button>
            ))}
          </div>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="p-16 text-center text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-600" />
            Loading prescription records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <ClipboardList className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-base">No Prescriptions Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search
                ? `No prescription matches "${search}". Try searching by patient name or doctor registration number.`
                : "No prescriptions recorded yet. Click 'Record New Prescription' to add doctor prescription details."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((rx) => (
              <div
                key={rx.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded">
                        {rx.rxNumber}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base mt-2">{rx.patientName}</h3>
                      {rx.patientPhone && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{rx.patientPhone}</span>
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        rx.status === "Dispensed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {rx.status}
                    </span>
                  </div>

                  {/* Doctor Info */}
                  <div className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                      <span className="font-semibold text-slate-800">{rx.doctorName}</span>
                    </div>
                    {rx.doctorRegNo && rx.doctorRegNo !== "N/A" && (
                      <div className="flex items-center gap-2 text-slate-500 pl-5">
                        <span className="font-mono text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-600">
                          Reg No: {rx.doctorRegNo}
                        </span>
                      </div>
                    )}
                    {rx.clinicName && (
                      <div className="flex items-center gap-2 text-slate-500 pl-5">
                        <Building className="h-3 w-3 text-slate-400" />
                        <span>{rx.clinicName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-500 pl-5">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span>Date: {rx.prescriptionDate || rx.date}</span>
                    </div>
                  </div>

                  {/* Prescribed Drugs */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Prescribed Medicines / Salt:
                    </span>
                    <ul className="text-xs text-slate-700 space-y-1">
                      {rx.medicines.map((m, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Pill className="h-3 w-3 text-indigo-500 flex-shrink-0" />
                          <span className="truncate">{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {rx.salesInvoices.length > 0 && (
                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                      <span>Billed on:</span>
                      <span className="font-mono font-semibold text-indigo-600">
                        {rx.salesInvoices.map((s) => s.invoiceNumber).join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      router.push(`/pos?patient=${encodeURIComponent(rx.patientName)}&doctor=${encodeURIComponent(rx.doctorName)}`);
                    }}
                    className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>Dispense in POS</span>
                  </button>
                  {rx.status !== "Dispensed" && (
                    <button
                      onClick={() => handleDelete(rx.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete Prescription"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Record New Prescription */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Record New Prescription</h3>
                    <p className="text-xs text-slate-500">Capture doctor credentials for Schedule H1 compliance</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePrescription} className="p-5 space-y-4 overflow-y-auto flex-1">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Patient Information */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Patient Details
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Patient Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Patel"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Patient Phone
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 9876543210"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Patient Address (Mandatory for Schedule X/Narcotics)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Flat 301, Shanti Arcade, Ahmedabad"
                      value={patientAddress}
                      onChange={(e) => setPatientAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Doctor Information */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Prescribing Doctor
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Doctor Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. A. K. Sharma (MD)"
                        value={doctorName}
                        onChange={(e) => setDoctorName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Doctor Reg No (MCI / State Council)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. G-24819"
                        value={doctorRegNo}
                        onChange={(e) => setDoctorRegNo(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Clinic / Hospital Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Apollo Clinic"
                        value={clinicName}
                        onChange={(e) => setClinicName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Prescription Date
                      </label>
                      <input
                        type="date"
                        value={prescriptionDate}
                        onChange={(e) => setPrescriptionDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Prescribed Medicines */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Prescribed Medicines
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Amoxicillin 500mg (10 Caps)"
                      value={medicineInput}
                      onChange={(e) => setMedicineInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddMedicine();
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddMedicine}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  {medicinesList.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl max-h-24 overflow-y-auto">
                      {medicinesList.map((m, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs"
                        >
                          <span>{m}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicine(idx)}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Doctor Notes / Dosage Instructions
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 1 Tablet twice daily after meals for 5 days"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Recording..." : "Save Prescription"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
