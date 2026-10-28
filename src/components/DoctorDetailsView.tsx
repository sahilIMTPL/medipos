"use client";

import React, { useState } from "react";
import {
  UserCheck,
  Building,
  Mail,
  Phone,
  Clock,
  Award,
  ShieldCheck,
  Edit3,
  CheckCircle2,
  FileCheck,
  Stethoscope,
} from "lucide-react";
import { doctorApi, DoctorAuthUser } from "@/lib/api/doctor.api";

interface DoctorDetailsViewProps {
  doctor: DoctorAuthUser | null;
  onUpdateDoctor: (updated: DoctorAuthUser) => void;
}

export default function DoctorDetailsView({
  doctor,
  onUpdateDoctor,
}: DoctorDetailsViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(doctor?.name || "Dr. Rajesh Sharma, MD");
  const [mciNumber, setMciNumber] = useState(doctor?.mciNumber || "MCI-48291/2012");
  const [specialization, setSpecialization] = useState(doctor?.specialization || "Consultant Physician & Internal Medicine");
  const [clinicName, setClinicName] = useState(doctor?.clinicName || "MedCare Multi-Speciality OPD Clinic");
  const [email, setEmail] = useState(doctor?.email || "dr.sharma@medcare.com");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [timings, setTimings] = useState("Mon - Sat: 09:00 AM - 01:00 PM, 05:00 PM - 08:30 PM");
  const [consultationFee, setConsultationFee] = useState("₹ 500");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: DoctorAuthUser = {
      id: doctor?.id || "doc-active",
      name: name.trim(),
      mciNumber: mciNumber.trim(),
      specialization: specialization.trim(),
      clinicName: clinicName.trim(),
      email: email.trim(),
      storeId: doctor?.storeId,
      storeName: doctor?.storeName,
    };

    localStorage.setItem("medcare_doctor_session", JSON.stringify(updated));
    onUpdateDoctor(updated);
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5 stroke-2" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Doctor Profile & Clinical Credentials
            </h1>
            <p className="text-xs text-slate-500">
              Verified Medical Practitioner Registration, OPD Timings, and Digital Rx Stamp
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Edit3 className="w-4 h-4" />
          <span>{isEditing ? "Cancel Editing" : "Edit Profile"}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Doctor credentials successfully updated and linked to active eRx desk!</span>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-2xs">
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  MCI / State Medical Council Reg No.
                </label>
                <input
                  type="text"
                  required
                  value={mciNumber}
                  onChange={(e) => setMciNumber(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Specialization / Department</label>
                <input
                  type="text"
                  required
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hospital / Clinic Name</label>
                <input
                  type="text"
                  required
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">OPD Consultation Timings</label>
                <input
                  type="text"
                  value={timings}
                  onChange={(e) => setTimings(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Consultation Fee</label>
                <input
                  type="text"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Save Doctor Profile
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Top Identity Block */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                DR
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{name}</h2>
                  <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Practitioner
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">{specialization}</p>
                <p className="text-xs text-indigo-600 font-mono font-semibold">
                  MCI / SMC Registration: {mciNumber}
                </p>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Clinic / Hospital</span>
                <p className="font-bold text-slate-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-400" />
                  {clinicName}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Connected Pharmacy</span>
                <p className="font-bold text-indigo-600 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-indigo-500" />
                  {doctor?.storeName || "City Medical Store"}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Registered Email</span>
                <p className="font-semibold text-slate-800 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {email}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Direct Phone</span>
                <p className="font-semibold text-slate-800 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {phone}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Consultation Timings</span>
                <p className="font-semibold text-slate-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {timings}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Consultation Fee</span>
                <p className="font-bold text-emerald-700 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-500" />
                  {consultationFee}
                </p>
              </div>
            </div>

            {/* Official Stamp & Digital Prescription Header Preview */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                <span>Prescription Letterhead & Official Stamp Preview</span>
              </h3>
              <div className="p-5 border border-dashed border-indigo-200 rounded-2xl bg-indigo-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{clinicName}</h4>
                  <p className="text-xs text-slate-700 font-semibold">{name}</p>
                  <p className="text-[11px] text-slate-500">{specialization} • Reg No: {mciNumber}</p>
                </div>
                <div className="p-3 border-2 border-indigo-400 rounded-xl text-center text-[10px] font-mono text-indigo-800 bg-white shadow-2xs font-bold leading-tight">
                  <p>★ CERTIFIED eRx ★</p>
                  <p>{name}</p>
                  <p>{mciNumber}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
