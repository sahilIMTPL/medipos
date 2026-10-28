"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Stethoscope,
  Search,
  User,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Heart,
  Activity,
  Thermometer,
  Scale,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Send,
  RotateCcw,
  Pill,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  Phone,
  RefreshCw,
  LogOut,
  X,
  Utensils,
  Download,
  Store,
  Layers,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import {
  doctorApi,
  DoctorAuthUser,
  DoctorFormularyMedicine,
  PatientClinicalDossier,
  PatientPastMedicine,
  PrescribedMedicineInput,
} from "@/lib/api/doctor.api";
import { useStore } from "@/context/StoreContext";
import GenericSubstituteModal from "./GenericSubstituteModal";
import { triggerPrint } from "@/lib/print";
import { useRouter } from "next/navigation";

const COMMON_SYMPTOMS_LIST = [
  "Fever",
  "Cough",
  "Cold",
  "Throat Pain",
  "Headache",
  "Body Ache",
  "Abdominal Pain",
  "Nausea",
  "Vomiting",
  "Others",
];

const COMMON_DIAGNOSES = [
  "Acute Bronchitis",
  "Upper Respiratory Tract Infection (URTI)",
  "Type 2 Diabetes Mellitus",
  "Essential Hypertension",
  "GERD / Acid Peptic Disease",
  "Allergic Rhinitis",
  "Acute Gastroenteritis",
  "Urinary Tract Infection (UTI)",
  "Osteoarthritis / Joint Pain",
  "Migraine Headache",
  "Typhoid Fever",
  "Skin Dermatitis / Fungal Infection",
];

const DOSAGE_OPTIONS = [
  "1 Tablet",
  "2 Tablets",
  "1 Capsule",
  "5 ml Syrup",
  "10 ml Syrup",
  "1 Sachet",
  "1 Injection",
  "2 Drops",
  "Apply Locally",
];

const FREQUENCIES = [
  { code: "OD", label: "OD (Once Daily)", factor: 1 },
  { code: "BD", label: "BD (Twice Daily)", factor: 2 },
  { code: "TDS", label: "TDS (Thrice Daily)", factor: 3 },
  { code: "QID", label: "QID (4 Times Daily)", factor: 4 },
  { code: "SOS", label: "SOS (As Needed)", factor: 1 },
  { code: "HS", label: "HS (At Bedtime)", factor: 1 },
];

const TIMINGS = [
  "After Food (PC)",
  "Before Food (AC)",
  "With Food",
  "Empty Stomach",
  "At Bedtime",
];

const DURATIONS = [
  { label: "3 Days", days: 3 },
  { label: "5 Days", days: 5 },
  { label: "7 Days", days: 7 },
  { label: "10 Days", days: 10 },
  { label: "15 Days", days: 15 },
  { label: "1 Month (30d)", days: 30 },
];

export interface DoctorPanelViewProps {
  initialDoctor?: DoctorAuthUser | null;
  preselectedPatient?: any;
  preselectedMedicine?: any;
  onNavigateToTab?: (tab: string) => void;
}

export default function DoctorPanelView({
  initialDoctor,
  preselectedPatient,
  preselectedMedicine,
  onNavigateToTab,
}: DoctorPanelViewProps = {}) {
  const router = useRouter();
  const { currentStore } = useStore();

  // Doctor Details
  const [doctorName, setDoctorName] = useState(initialDoctor?.name || "Dr. Rajesh Sharma, MD");
  const [doctorRegNo, setDoctorRegNo] = useState(initialDoctor?.mciNumber || "MCI-48291/2012");
  const [clinicName, setClinicName] = useState(initialDoctor?.clinicName || "MedCare Multi-Speciality Clinic");
  const [specialization, setSpecialization] = useState(initialDoctor?.specialization || "Consultant Physician");
  const [isEditingDoctor, setIsEditingDoctor] = useState(false);
  const [isDoctorMenuOpen, setIsDoctorMenuOpen] = useState(false);

  const targetStoreId = initialDoctor?.storeId || currentStore?.id;
  const targetStoreName = initialDoctor?.storeName || currentStore?.name || "City Medical Store";

  useEffect(() => {
    if (initialDoctor) {
      setDoctorName(initialDoctor.name);
      setDoctorRegNo(initialDoctor.mciNumber);
      setClinicName(initialDoctor.clinicName);
      setSpecialization(initialDoctor.specialization);
    } else {
      const session = doctorApi.getStoredDoctorSession();
      if (session) {
        setDoctorName(session.name);
        setDoctorRegNo(session.mciNumber);
        setClinicName(session.clinicName);
        setSpecialization(session.specialization);
      }
    }
  }, [initialDoctor]);

  useEffect(() => {
    if (preselectedPatient) {
      setPatientName(preselectedPatient.name || "");
      if (preselectedPatient.phone) setPatientPhone(preselectedPatient.phone);
      if (preselectedPatient.address) setPatientAddress(preselectedPatient.address);
      if (preselectedPatient.allergies?.length) setAllergies(preselectedPatient.allergies);
      setSelectedCustomerId(preselectedPatient.id);
    }
  }, [preselectedPatient]);

  useEffect(() => {
    if (preselectedMedicine) {
      setSelectedProduct(preselectedMedicine);
      setCustomMedName(preselectedMedicine.name);
      setMedSearchQuery(preselectedMedicine.name);
    }
  }, [preselectedMedicine]);

  const handleSignOut = () => {
    doctorApi.clearDoctorSession();
    router.push("/doctor/login");
  };

  // Patient Info
  const [patientSearch, setPatientSearch] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState<"Male" | "Female" | "Other" | "">("");
  const [patientAddress, setPatientAddress] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Patient Clinical Dossier / History
  const [patientDossier, setPatientDossier] = useState<PatientClinicalDossier | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  // Vitals (empty default placeholders like mockup)
  const [bpSystolic, setBpSystolic] = useState("");
  const [bpDiastolic, setBpDiastolic] = useState("");
  const [pulse, setPulse] = useState("");
  const [temperature, setTemperature] = useState("");
  const [weight, setWeight] = useState("");
  const [spo2, setSpo2] = useState("");
  const [bloodSugar, setBloodSugar] = useState("");

  // Clinical Assessment
  const [diagnosis, setDiagnosis] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergyInput, setNewAllergyInput] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");

  // Medicine Search & Formulary Catalog
  const [medicineCatalog, setMedicineCatalog] = useState<DoctorFormularyMedicine[]>([]);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [medSearchQuery, setMedSearchQuery] = useState("");
  const [isMedDropdownOpen, setIsMedDropdownOpen] = useState(false);

  // Prescription Form Draft Item
  const [selectedProduct, setSelectedProduct] = useState<DoctorFormularyMedicine | null>(null);
  const [customMedName, setCustomMedName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [timing, setTiming] = useState("");
  const [durationDays, setDurationDays] = useState<number | "">("");
  const [instructions, setInstructions] = useState("");

  // Prescribed Medicines List
  const [prescribedItems, setPrescribedItems] = useState<
    Array<
      PrescribedMedicineInput & {
        stockStatus?: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
        totalBaseQty?: number;
        packQty?: number;
        mrp?: number;
      }
    >
  >([]);

  // Modals & Submission State
  const [submittingRx, setSubmittingRx] = useState(false);
  const [issuedRxDetails, setIssuedRxDetails] = useState<{
    rxNumber: string;
    patientName: string;
    itemsCount: number;
    createdAt: string;
  } | null>(null);

  // Substitute finder modal state
  const [substituteTarget, setSubstituteTarget] = useState<any>(null);
  const [isSubstituteModalOpen, setIsSubstituteModalOpen] = useState(false);

  // Load medicines catalog
  const loadFormulary = async (search?: string) => {
    setLoadingMedicines(true);
    try {
      const res = await doctorApi.getDoctorMedicines({
        storeId: targetStoreId || currentStore?.id,
        q: search || undefined,
        limit: 100,
      });
      if (res.success) {
        setMedicineCatalog(res.medicines);
      }
    } catch (err) {
      console.error("Failed to load medicines", err);
    } finally {
      setLoadingMedicines(false);
    }
  };

  useEffect(() => {
    loadFormulary();
  }, [targetStoreId, currentStore?.id]);

  // Lookup Patient Clinical History
  const handleLookupPatient = async (queryToSearch: string) => {
    const q = queryToSearch.trim();
    if (!q) return;

    setLoadingDossier(true);
    try {
      const res = await doctorApi.getPatientClinicalHistory({
        query: q,
        storeId: targetStoreId || currentStore?.id,
      });

      if (res.success && res.patient) {
        const p = res.patient;
        setPatientDossier(p);
        setSelectedCustomerId(p.id);
        setPatientName(p.name);
        if (p.phone) setPatientPhone(p.phone);
        if (p.address) setPatientAddress(p.address);
        if (p.allergies && p.allergies.length > 0) {
          setAllergies(p.allergies);
        }
        setShowHistoryDrawer(true);
      } else {
        setPatientDossier(null);
        alert("No clinical record found for: " + q + ". You can register this as a new patient.");
      }
    } catch (err) {
      console.error("Error looking up patient", err);
    } finally {
      setLoadingDossier(false);
    }
  };

  // Re-prescribe a past medicine with 1 click
  const handleReprescribeMedicine = (pastMed: PatientPastMedicine) => {
    const matched = medicineCatalog.find(
      (m) =>
        m.name.toLowerCase() === pastMed.productName.toLowerCase() ||
        m.name.toLowerCase().includes(pastMed.productName.toLowerCase())
    );

    const newItem = {
      productId: matched?.id,
      productName: matched?.name || pastMed.productName,
      genericName: matched?.genericName || pastMed.genericName,
      dosage: pastMed.lastDosage.includes("Tablet") ? pastMed.lastDosage : "1 Tablet",
      frequency: pastMed.lastFrequency.length <= 4 ? pastMed.lastFrequency : "BD",
      timing: pastMed.lastTiming !== "-" ? pastMed.lastTiming : "After Food (PC)",
      duration: pastMed.lastDuration !== "-" ? pastMed.lastDuration : "5 Days",
      quantity: 10,
      instructions: "Take with water as directed previously",
      stockStatus: matched?.stockStatus || "OUT_OF_STOCK",
      totalBaseQty: matched?.totalBaseQty || 0,
      packQty: matched?.packQty || 0,
      mrp: matched?.mrp || 0,
    };

    setPrescribedItems((prev) => [...prev, newItem]);
  };

  // Toggle Symptom
  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  // Add Allergy
  const handleAddAllergy = () => {
    if (!newAllergyInput.trim()) return;
    const clean = newAllergyInput.trim();
    if (!allergies.includes(clean)) {
      setAllergies((prev) => [...prev, clean]);
    }
    setNewAllergyInput("");
  };

  const removeAllergy = (al: string) => {
    setAllergies((prev) => prev.filter((a) => a !== al));
  };

  // Calculated Quantity for Current Form Item
  const calculatedQty = useMemo(() => {
    const freqObj = FREQUENCIES.find((f) => f.code === frequency);
    const timesPerDay = freqObj ? freqObj.factor : 1;
    const days = typeof durationDays === "number" ? durationDays : 5;
    return Math.max(1, timesPerDay * days);
  }, [frequency, durationDays]);

  // Add Item to Prescription Slip
  const handleAddMedicineToSlip = () => {
    const nameToAdd = selectedProduct ? selectedProduct.name : customMedName.trim();
    if (!nameToAdd) {
      alert("Please select or type a medicine name.");
      return;
    }

    const newItem = {
      productId: selectedProduct?.id,
      productName: nameToAdd,
      genericName: selectedProduct?.genericName || undefined,
      dosage: dosage || "1 Tablet",
      frequency: frequency || "BD",
      timing: timing || "After Food (PC)",
      duration: durationDays ? `${durationDays} Days` : "5 Days",
      quantity: calculatedQty,
      instructions: instructions.trim() || undefined,
      stockStatus: selectedProduct?.stockStatus || "OUT_OF_STOCK",
      totalBaseQty: selectedProduct?.totalBaseQty || 0,
      packQty: selectedProduct?.packQty || 0,
      mrp: selectedProduct?.mrp || 0,
    };

    setPrescribedItems((prev) => [...prev, newItem]);

    // Reset draft form
    setSelectedProduct(null);
    setCustomMedName("");
    setMedSearchQuery("");
    setIsMedDropdownOpen(false);
    setInstructions("");
  };

  const handleRemovePrescribedItem = (idx: number) => {
    setPrescribedItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit Prescription Directly to POS Queue
  const handleIssuePrescription = async () => {
    if (!patientName.trim()) {
      alert("Patient Full Name is required.");
      return;
    }
    if (!doctorName.trim()) {
      alert("Doctor Name is required.");
      return;
    }
    if (prescribedItems.length === 0) {
      alert("Please add at least one medicine to the prescription.");
      return;
    }

    setSubmittingRx(true);
    try {
      const payload = {
        storeId: targetStoreId || currentStore?.id,
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim() || undefined,
        patientAddress: patientAddress.trim() || undefined,
        patientAge: patientAge.trim() || undefined,
        patientGender: patientGender || undefined,
        customerId: selectedCustomerId || undefined,
        doctorName: doctorName.trim(),
        doctorRegNo: doctorRegNo.trim() || undefined,
        clinicName: clinicName.trim() || undefined,
        specialization: specialization.trim() || undefined,
        diagnosis: diagnosis.trim() || "General Consultation",
        symptoms: selectedSymptoms,
        vitals: {
          bp: bpSystolic && bpDiastolic ? `${bpSystolic}/${bpDiastolic} mmHg` : undefined,
          pulse: pulse ? `${pulse} bpm` : undefined,
          temp: temperature ? `${temperature} °F` : undefined,
          weight: weight ? `${weight} kg` : undefined,
          spo2: spo2 ? `${spo2} %` : undefined,
          bloodSugar: bloodSugar ? `${bloodSugar} mg/dL` : undefined,
        },
        allergies,
        clinicalNotes: clinicalNotes.trim() || undefined,
        items: prescribedItems.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          genericName: it.genericName,
          dosage: it.dosage,
          frequency: it.frequency,
          timing: it.timing,
          duration: it.duration,
          quantity: it.quantity,
          instructions: it.instructions,
        })),
      };

      const res = await doctorApi.createDoctorPrescription(payload);

      setIssuedRxDetails({
        rxNumber: res.rxNumber,
        patientName: patientName.trim(),
        itemsCount: prescribedItems.length,
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    } catch (err: any) {
      alert(err.message || "Failed to issue prescription");
    } finally {
      setSubmittingRx(false);
    }
  };

  // Reset after completed prescription or "New Patient"
  const handleResetForm = () => {
    setPatientSearch("");
    setPatientName("");
    setPatientPhone("");
    setPatientAge("");
    setPatientGender("");
    setPatientAddress("");
    setSelectedCustomerId(null);
    setPatientDossier(null);
    setBpSystolic("");
    setBpDiastolic("");
    setPulse("");
    setTemperature("");
    setWeight("");
    setSpo2("");
    setBloodSugar("");
    setDiagnosis("");
    setSelectedSymptoms([]);
    setAllergies([]);
    setClinicalNotes("");
    setPrescribedItems([]);
    setIssuedRxDetails(null);
    setShowHistoryDrawer(false);
    setSelectedProduct(null);
    setCustomMedName("");
    setMedSearchQuery("");
  };

  // Filtered Formulary Medicines for Search
  const filteredMedicines = useMemo(() => {
    const q = medSearchQuery.trim().toLowerCase();
    if (!q) return medicineCatalog.slice(0, 15);
    return medicineCatalog
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.genericName && m.genericName.toLowerCase().includes(q)) ||
          (m.brandName && m.brandName.toLowerCase().includes(q))
      )
      .slice(0, 20);
  }, [medicineCatalog, medSearchQuery]);

  return (
    <div className="space-y-5 pb-16 font-sans">
      {/* 1. TOP HEADER / DOCTOR CREDENTIALS BAR EXACTLY MATCHING MOCKUP */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:px-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left Side: Stethoscope Badge + Title */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#3b66f5] text-white flex items-center justify-center shadow-sm shrink-0">
            <Stethoscope className="w-6 h-6 stroke-2" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
              Doctor OPD Consultation & Digital Rx Desk
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-normal">
              Consult Patients • Create Prescriptions • Connected Pharmacy • Digital Records
            </p>
          </div>
        </div>

        {/* Right Side: Pharmacy Connected Badge, Doctor Account, Edit Profile, Sign Out */}
        <div className="flex items-center flex-wrap gap-3 w-full md:w-auto justify-end">
          {/* Pharmacy Connected Badge */}
          <div className="bg-[#edfbf4] border border-emerald-200/90 rounded-xl px-3 py-2 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <p className="text-xs font-bold text-emerald-800 leading-tight">Pharmacy Connected</p>
              <p className="text-[10px] text-emerald-600 font-medium">Real-time stock, formulary & eRx</p>
            </div>
          </div>

          {/* Doctor Account Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDoctorMenuOpen(!isDoctorMenuOpen)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 text-xs font-semibold text-slate-700 transition cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="truncate max-w-[130px]">{doctorName || "Doctor account"}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isDoctorMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-30 animate-in fade-in duration-100 text-xs space-y-2">
                <div className="pb-2 border-b border-slate-100">
                  <p className="font-bold text-slate-900">{doctorName}</p>
                  <p className="text-slate-500 text-[11px]">{specialization}</p>
                  <p className="text-indigo-600 font-mono text-[10px] mt-1">Reg: {doctorRegNo}</p>
                </div>
                <div className="pt-1">
                  <p className="text-[11px] text-slate-400">Connected Pharmacy Store:</p>
                  <p className="font-semibold text-slate-800">{targetStoreName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Edit Profile Button */}
          <button
            type="button"
            onClick={() => setIsEditingDoctor(!isEditingDoctor)}
            className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
          >
            {isEditingDoctor ? "Close Profile" : "Edit Profile"}
          </button>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleSignOut}
            className="bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition shadow-2xs cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-4 h-4 stroke-[2]" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Doctor Edit Drawer (if toggled) */}
      {isEditingDoctor && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs grid grid-cols-1 md:grid-cols-4 gap-3 text-xs animate-in fade-in duration-150">
          <div>
            <label className="text-slate-600 block mb-1 font-semibold">Doctor Full Name</label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
          <div>
            <label className="text-slate-600 block mb-1 font-semibold">Medical Reg No (MCI/SMC)</label>
            <input
              type="text"
              value={doctorRegNo}
              onChange={(e) => setDoctorRegNo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
            />
          </div>
          <div>
            <label className="text-slate-600 block mb-1 font-semibold">Specialization / Dept</label>
            <input
              type="text"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
          <div>
            <label className="text-slate-600 block mb-1 font-semibold">Hospital / Clinic Name</label>
            <input
              type="text"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        </div>
      )}

      {/* 2. MAIN 2-COLUMN WORKSPACE EXACTLY AS IN THE MOCKUP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ================= LEFT COLUMN (5 Columns) ================= */}
        <div className="lg:col-span-5 space-y-5">
          {/* CARD 1: Patient Clinical Dossier */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            {/* Header: Title + "New Patient" Link */}
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600 stroke-2" />
                Patient Clinical Dossier
              </h2>
              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition"
              >
                <FileText className="w-4 h-4" />
                <span>New Patient</span>
              </button>
            </div>

            {/* Search Input Row with Lookup Button */}
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1 flex items-center">
                <Search className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleLookupPatient(patientSearch);
                    }
                  }}
                  placeholder="Search patient by mobile number or name"
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
              <button
                type="button"
                disabled={loadingDossier}
                onClick={() => handleLookupPatient(patientSearch)}
                className="px-4 py-2 bg-[#4353ff] hover:bg-[#3444eb] disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
              >
                {loadingDossier ? "Searching..." : "Lookup"}
              </button>
            </div>

            {/* Patient Full Name * */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-2">
                Patient Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter patient full name"
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Phone Number *, Age *, Gender * */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-2">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-2">
                  Age <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Calendar className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    placeholder="Age"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-2">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value as any)}
                    className="w-full pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition appearance-none cursor-pointer"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown className="absolute right-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Drug Allergies & Contraindications Box */}
            <div className="bg-[#fff8f8] border border-rose-100 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 stroke-2" />
                  Drug Allergies & Contraindications
                </span>
                <span className="text-[10px] text-rose-400 font-medium">Important for patient safety</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 flex items-center">
                  <Pill className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={newAllergyInput}
                    onChange={(e) => setNewAllergyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddAllergy();
                      }
                    }}
                    placeholder="Enter known drug allergies or contraindications"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddAllergy}
                  className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  + Add
                </button>
              </div>

              {allergies.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {allergies.map((al) => (
                    <span
                      key={al}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700 border border-rose-200"
                    >
                      {al}
                      <button
                        type="button"
                        onClick={() => removeAllergy(al)}
                        className="hover:text-rose-900 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CARD 2: Patient Vital Signs (OPD Triage) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            {/* Header: Title + Document Icon */}
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500 stroke-2" />
                Patient Vital Signs (OPD Triage)
              </h2>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>

            {/* 6 Vitals in 2 Rows of 3 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Blood Pressure */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Pressure</label>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-900 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition">
                  <Heart className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={bpSystolic}
                    onChange={(e) => setBpSystolic(e.target.value)}
                    placeholder="120"
                    className="w-8 text-center font-medium focus:outline-none bg-transparent"
                  />
                  <span className="text-slate-400 px-1">/</span>
                  <input
                    type="text"
                    value={bpDiastolic}
                    onChange={(e) => setBpDiastolic(e.target.value)}
                    placeholder="80"
                    className="w-8 text-center font-medium focus:outline-none bg-transparent"
                  />
                  <span className="text-[10px] text-slate-400 ml-auto font-medium">mmHg</span>
                </div>
              </div>

              {/* 2. Pulse Rate */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pulse Rate</label>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-900 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition">
                  <Activity className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                    placeholder="72"
                    className="w-full font-medium focus:outline-none bg-transparent"
                  />
                  <span className="text-[10px] text-slate-400 ml-1 font-medium">bpm</span>
                </div>
              </div>

              {/* 3. Temperature */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Temperature</label>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-900 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition">
                  <Thermometer className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="98.4"
                    className="w-full font-medium focus:outline-none bg-transparent"
                  />
                  <span className="text-[10px] text-slate-400 ml-1 font-medium whitespace-nowrap">°F / °C</span>
                </div>
              </div>

              {/* 4. Body Weight */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Body Weight</label>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-900 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition">
                  <Scale className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="68"
                    className="w-full font-medium focus:outline-none bg-transparent"
                  />
                  <span className="text-[10px] text-slate-400 ml-1 font-medium">kg</span>
                </div>
              </div>

              {/* 5. SpO2 Level */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SpO2 Level</label>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-900 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition">
                  <span className="text-[11px] font-bold text-slate-400 mr-2 shrink-0">O₂</span>
                  <input
                    type="text"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    placeholder="99"
                    className="w-full font-medium focus:outline-none bg-transparent"
                  />
                  <span className="text-[10px] text-slate-400 ml-1 font-medium">%</span>
                </div>
              </div>

              {/* 6. Blood Sugar (RBS) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Sugar (RBS)</label>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-900 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition">
                  <Droplets className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={bloodSugar}
                    onChange={(e) => setBloodSugar(e.target.value)}
                    placeholder="110"
                    className="w-full font-medium focus:outline-none bg-transparent"
                  />
                  <span className="text-[10px] text-slate-400 ml-1 font-medium">mg/dL</span>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: Provisional Diagnosis & Symptoms */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600 stroke-2" />
              Provisional Diagnosis & Symptoms
            </h2>

            {/* Diagnosis Input */}
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Search or enter provisional diagnosis (ICD/SNOMED or text)"
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            {/* Common Symptoms (click to add) */}
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">Common Symptoms (click to add)</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_SYMPTOMS_LIST.map((sym) => {
                  const isSelected = selectedSymptoms.includes(sym);
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => toggleSymptom(sym)}
                      className={`px-3 py-2 rounded-full text-xs font-medium transition cursor-pointer border ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {isSelected ? `✓ ${sym}` : `+ ${sym}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN (7 Columns) ================= */}
        <div className="lg:col-span-7 space-y-5">
          {/* CARD 1: Live Pharmacy Stock Formulary & Rx Composer */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            {/* Header: Title + Refresh Stock */}
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Pill className="w-4 h-4 text-emerald-600 stroke-2" />
                Live Pharmacy Stock Formulary & Rx Composer
              </h2>
              <button
                type="button"
                onClick={() => loadFormulary()}
                className="text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-2 cursor-pointer transition"
              >
                <RefreshCw className={`w-4 h-4 ${loadingMedicines ? "animate-spin text-blue-600" : ""}`} />
                <span>Refresh Stock</span>
              </button>
            </div>

            {/* Medicine Search Row + Check live inventory Button */}
            <div className="flex items-center gap-2 relative">
              <div className="relative flex-1 flex items-center">
                <Search className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={medSearchQuery}
                  onFocus={() => setIsMedDropdownOpen(true)}
                  onChange={(e) => {
                    setMedSearchQuery(e.target.value);
                    setCustomMedName(e.target.value);
                    setIsMedDropdownOpen(true);
                  }}
                  placeholder="Search medicine by brand or generic name (e.g. Amoxicillin, Paracetamol)"
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsMedDropdownOpen(true)}
                className="px-3 py-2 bg-[#edfbf4] border border-emerald-200 text-emerald-700 hover:bg-emerald-100/60 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer whitespace-nowrap"
              >
                <Layers className="w-4 h-4" />
                <span>Check live inventory</span>
              </button>

              {/* Medicine Autocomplete Dropdown */}
              {isMedDropdownOpen && (
                <div className="absolute top-12 left-0 right-0 max-h-72 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-y-auto z-40 p-2 text-xs">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 text-[11px] font-semibold text-slate-500">
                    <span>Pharmacy Formulary Catalog ({filteredMedicines.length} results)</span>
                    <button
                      type="button"
                      onClick={() => setIsMedDropdownOpen(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {filteredMedicines.map((med) => {
                    const isAvailable = med.stockStatus === "IN_STOCK";
                    return (
                      <div
                        key={med.id}
                        onClick={() => {
                          setSelectedProduct(med);
                          setCustomMedName(med.name);
                          setMedSearchQuery(med.name);
                          setIsMedDropdownOpen(false);
                        }}
                        className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center justify-between transition group"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 group-hover:text-blue-600">
                              {med.name}
                            </p>
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded">
                              {med.dosageForm}
                            </span>
                          </div>
                          {med.genericName && (
                            <p className="text-[11px] text-slate-500 mt-1 font-medium">
                              Salt: {med.genericName}
                            </p>
                          )}
                        </div>

                        <div className="text-right flex items-center gap-3">
                          <span
                            className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                              isAvailable
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {isAvailable ? `In Stock (${med.totalBaseQty})` : "Out of Stock"}
                          </span>

                          {!isAvailable && med.genericName && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSubstituteTarget(med);
                                setIsSubstituteModalOpen(true);
                              }}
                              className="text-[10px] text-indigo-600 hover:underline font-semibold"
                            >
                              Find Substitute
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {filteredMedicines.length === 0 && (
                    <div className="p-4 text-center text-slate-400">
                      No matching medicine found. You can prescribe &quot;{medSearchQuery}&quot; as custom.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Product Badge (if chosen from catalog) */}
            {selectedProduct && (
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900">{selectedProduct.name}</span>
                    {selectedProduct.genericName && (
                      <span className="text-slate-500 ml-2">({selectedProduct.genericName})</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      selectedProduct.stockStatus === "IN_STOCK"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {selectedProduct.stockStatus === "IN_STOCK"
                      ? `In Stock (${selectedProduct.totalBaseQty})`
                      : "Out of Stock"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduct(null);
                      setCustomMedName("");
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Dosage, Frequency, Meal Timing, Duration in 4 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* 1. Dosage */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Dosage</label>
                <div className="relative flex items-center">
                  <Pill className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition appearance-none cursor-pointer"
                  >
                    <option value="">Select dosage</option>
                    {DOSAGE_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 2. Frequency */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Frequency</label>
                <div className="relative flex items-center">
                  <Clock className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition appearance-none cursor-pointer"
                  >
                    <option value="">Select frequency</option>
                    {FREQUENCIES.map((f) => (
                      <option key={f.code} value={f.code}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 3. Meal Timing */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Meal Timing</label>
                <div className="relative flex items-center">
                  <Utensils className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={timing}
                    onChange={(e) => setTiming(e.target.value)}
                    className="w-full pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition appearance-none cursor-pointer"
                  >
                    <option value="">Select timing</option>
                    {TIMINGS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 4. Duration */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Duration</label>
                <div className="relative flex items-center">
                  <Calendar className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition appearance-none cursor-pointer"
                  >
                    <option value="">Select duration</option>
                    {DURATIONS.map((dur) => (
                      <option key={dur.days} value={dur.days}>
                        {dur.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Instructions (for patient) Row + "+ Add to Rx Slip" Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 pt-1">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Instructions (for patient)
                </label>
                <div className="relative flex items-center">
                  <FileText className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="e.g. Take with water, after food, etc. (optional)"
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddMedicineToSlip}
                className="px-6 py-2 bg-[#4353ff] hover:bg-[#3444eb] text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap h-[38px]"
              >
                <Plus className="w-4 h-4 stroke-2" />
                <span>Add to Rx Slip</span>
              </button>
            </div>
          </div>

          {/* CARD 2: Active Prescription Slip */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            {/* Header: Rx Title + Clear All + Load from History */}
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="text-blue-600 font-serif italic font-bold text-base">Rx</span>
                <span>Active Prescription Slip ({prescribedItems.length} Medicines)</span>
              </h2>

              <div className="flex items-center gap-2">
                {prescribedItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPrescribedItems([])}
                    className="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200/80 rounded-lg flex items-center gap-1 cursor-pointer transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear All</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
                  className="px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1 cursor-pointer transition"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Load from History</span>
                </button>
              </div>
            </div>

            {/* Prescribed Items List or Empty State */}
            {prescribedItems.length === 0 ? (
              <div className="py-10 px-4 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Pill className="w-6 h-6 stroke-2" />
                </div>
                <h3 className="text-sm font-bold text-slate-700 mb-1">No medicines added yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Search and add medicines from the formulary above to create a prescription for this patient.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {prescribedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50/80 border border-slate-200/90 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 truncate">{item.productName}</span>
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                            item.stockStatus === "IN_STOCK"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {item.stockStatus === "IN_STOCK" ? "In Stock" : "Out of Stock"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {item.dosage} • {item.frequency} • {item.timing} • {item.duration} (Qty: {item.quantity})
                        {item.instructions ? ` • ${item.instructions}` : ""}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePrescribedItem(idx)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Doctor's Advice / Dietary Instructions Box */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Doctor&apos;s Advice / Dietary Instructions</span>
              </label>
              <textarea
                rows={3}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Add advice or dietary instructions for the patient (optional)"
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-y"
              />
            </div>

            {/* Bottom Action Bar: Reset Consultation (Left), Print & Issue (Right) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetForm}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Consultation</span>
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Print Prescription</span>
                </button>

                <button
                  type="button"
                  disabled={submittingRx || prescribedItems.length === 0}
                  onClick={handleIssuePrescription}
                  className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] disabled:opacity-50 text-white text-xs font-bold transition shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingRx ? "Beaming to POS..." : "Issue Rx & Send to Pharmacy"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Clinical History Drawer (Load from History) */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex justify-end z-50 animate-in fade-in">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Patient Clinical Dossier</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryDrawer(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {patientDossier ? (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <p className="font-bold text-sm text-slate-900">{patientDossier.name}</p>
                  <p className="text-slate-600">Phone: {patientDossier.phone || "N/A"}</p>
                  <p className="text-slate-600">Total Past Visits: {patientDossier.totalVisits}</p>
                  {patientDossier.chronicDiseases?.length > 0 && (
                    <p className="text-slate-600">
                      Chronic: {patientDossier.chronicDiseases.join(", ")}
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Previously Prescribed Medicines:</h4>
                  {patientDossier.previouslyGivenMedicines?.length === 0 ? (
                    <p className="text-slate-400">No past prescribed medicines recorded.</p>
                  ) : (
                    <div className="space-y-2">
                      {patientDossier.previouslyGivenMedicines.map((pm, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{pm.productName}</p>
                            <p className="text-[11px] text-slate-500">
                              {pm.lastDosage} • {pm.lastFrequency} • {pm.lastDuration}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleReprescribeMedicine(pm)}
                            className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg"
                          >
                            + Prescribe Again
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <p>No patient selected or no past history found.</p>
                <p className="text-xs mt-1">Use the Lookup box to load a patient record.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Modal When Rx is Beamed to POS */}
      {issuedRxDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div id="printable-area" className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl relative print:border-none print:shadow-none print:p-0">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Prescription Successfully Issued!
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Beamed directly to Pharmacy Counter POS queue for instant 1-click dispensing.
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2 mb-5">
              <div className="flex justify-between">
                <span className="text-slate-500">Rx Reference:</span>
                <span className="font-mono font-bold text-blue-700">{issuedRxDetails.rxNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-900">{issuedRxDetails.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Prescribed Medicines:</span>
                <span className="font-bold text-slate-900">{issuedRxDetails.itemsCount} Items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time Beamed:</span>
                <span className="text-slate-700">{issuedRxDetails.createdAt}</span>
              </div>
            </div>

            <div className="flex gap-3 no-print print:hidden">
              <button
                type="button"
                onClick={handleResetForm}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Next Patient Consultation
              </button>
              <button
                type="button"
                onClick={() => triggerPrint("printable-area")}
                className="flex-1 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Prescription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generic Salt Substitute Modal */}
      {isSubstituteModalOpen && substituteTarget && (
        <GenericSubstituteModal
          targetProduct={substituteTarget}
          isOpen={isSubstituteModalOpen}
          onClose={() => setIsSubstituteModalOpen(false)}
          onSelectSubstitute={(substitute) => {
            setSelectedProduct({
              ...substituteTarget,
              id: substitute.id,
              name: substitute.name,
              mrp: substitute.mrp,
              stockStatus: substitute.availableQty > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
              totalBaseQty: substitute.availableQty,
              packQty: Math.floor(substitute.availableQty / 10),
            } as any);
            setCustomMedName(substitute.name);
            setMedSearchQuery(substitute.name);
            setIsSubstituteModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
