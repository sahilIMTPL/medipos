"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  ShieldCheck,
  Calendar,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  CreditCard,
  Layers,
  ArrowUpRight,
  ExternalLink,
  Lock,
  UserCheck,
  Stethoscope,
  Plus,
  X,
  FileSpreadsheet,
} from "lucide-react";
import {
  api,
  GstSummaryResponse,
  Gstr1Response,
  Gstr3bResponse,
  Gstr2bReconciliationResponse,
  GstFilingsResponse,
  DigiLockerVaultResponse,
  DigiLockerStatusResponse,
  PatientVerificationData,
  DoctorVerificationData,
} from "@/lib/api";

type GstSectionTab =
  | "DASHBOARD"
  | "GSTR1"
  | "GSTR3B"
  | "GSTR2B"
  | "CALENDAR"
  | "DIGILOCKER";

export default function GstComplianceCenter() {
  const [activeTab, setActiveTab] = useState<GstSectionTab>("DASHBOARD");
  const [loading, setLoading] = useState(true);

  // Date Filter Preset
  const [datePreset, setDatePreset] = useState<"ALL" | "THIS_MONTH" | "PREV_MONTH">("ALL");

  // State data
  const [summaryData, setSummaryData] = useState<GstSummaryResponse | null>(null);
  const [gstr1Data, setGstr1Data] = useState<Gstr1Response | null>(null);
  const [gstr3bData, setGstr3bData] = useState<Gstr3bResponse | null>(null);
  const [gstr2bData, setGstr2bData] = useState<Gstr2bReconciliationResponse | null>(null);
  const [filingsData, setFilingsData] = useState<GstFilingsResponse | null>(null);
  const [vaultData, setVaultData] = useState<DigiLockerVaultResponse | null>(null);
  const [digilockerStatus, setDigilockerStatus] = useState<DigiLockerStatusResponse | null>(null);

  // DigiLocker Interactive Verifications
  const [verifyIdType, setVerifyIdType] = useState<"ABHA" | "AADHAAR">("ABHA");
  const [verifyIdInput, setVerifyIdInput] = useState("");
  const [isVerifyingPatient, setIsVerifyingPatient] = useState(false);
  const [patientResult, setPatientResult] = useState<PatientVerificationData | null>(null);
  const [patientError, setPatientError] = useState("");

  const [docNameInput, setDocNameInput] = useState("");
  const [docRegInput, setDocRegInput] = useState("");
  const [isVerifyingDoctor, setIsVerifyingDoctor] = useState(false);
  const [doctorResult, setDoctorResult] = useState<DoctorVerificationData | null>(null);
  const [doctorError, setDoctorError] = useState("");

  // Record Filing Modal
  const [isFilingModalOpen, setIsFilingModalOpen] = useState(false);
  const [recordReturnType, setRecordReturnType] = useState("GSTR-1");
  const [recordPeriod, setRecordPeriod] = useState("10-2026");
  const [recordArn, setRecordArn] = useState("");
  const [recordTaxPaid, setRecordTaxPaid] = useState("");
  const [isSavingFiling, setIsSavingFiling] = useState(false);
  const [filingSaveSuccess, setFilingSaveSuccess] = useState("");

  // Calculate Date Filters
  const getDateParams = () => {
    const now = new Date();
    if (datePreset === "THIS_MONTH") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const end = now.toISOString();
      return { from: start, to: end };
    }
    if (datePreset === "PREV_MONTH") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
      return { from: start, to: end };
    }
    return {};
  };

  const loadData = async () => {
    setLoading(true);
    const params = getDateParams();
    try {
      if (activeTab === "DASHBOARD") {
        const [sum, dl] = await Promise.all([
          api.getSummary(params),
          api.getStatus().catch(() => null),
        ]);
        setSummaryData(sum);
        setDigilockerStatus(dl);
      } else if (activeTab === "GSTR1") {
        const res = await api.getGstr1(params);
        setGstr1Data(res);
      } else if (activeTab === "GSTR3B") {
        const res = await api.getGstr3b(params);
        setGstr3bData(res);
      } else if (activeTab === "GSTR2B") {
        const res = await api.getGstr2bReconciliation(params);
        setGstr2bData(res);
      } else if (activeTab === "CALENDAR") {
        const res = await api.getFilings();
        setFilingsData(res);
      } else if (activeTab === "DIGILOCKER") {
        const [v, st] = await Promise.all([
          api.getVault(),
          api.getStatus().catch(() => null),
        ]);
        setVaultData(v);
        setDigilockerStatus(st);
      }
    } catch (e) {
      console.error("Failed to load GST data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, datePreset]);

  // Handle Patient Verification
  const handleVerifyPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyIdInput.trim()) return;
    setIsVerifyingPatient(true);
    setPatientError("");
    setPatientResult(null);

    try {
      const res = await api.verifyPatient({
        idType: verifyIdType,
        idNumber: verifyIdInput.trim(),
      });
      setPatientResult(res.verification);
    } catch (err: any) {
      setPatientError(err.message || "Verification failed");
    } finally {
      setIsVerifyingPatient(false);
    }
  };

  // Handle Doctor Verification
  const handleVerifyDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNameInput.trim() || !docRegInput.trim()) return;
    setIsVerifyingDoctor(true);
    setDoctorError("");
    setDoctorResult(null);

    try {
      const res = await api.verifyDoctor({
        doctorName: docNameInput.trim(),
        regNumber: docRegInput.trim(),
      });
      setDoctorResult(res.doctor);
    } catch (err: any) {
      setDoctorError(err.message || "Doctor registration verification failed");
    } finally {
      setIsVerifyingDoctor(false);
    }
  };

  // Handle Filing Record Save
  const handleSaveFiling = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingFiling(true);
    setFilingSaveSuccess("");

    try {
      await api.saveFilingRecord({
        returnType: recordReturnType,
        taxPeriod: recordPeriod,
        arnNumber: recordArn.trim() || undefined,
        filingDate: new Date().toISOString(),
        status: recordArn.trim() ? "FILED" : "READY",
        netTaxPaid: recordTaxPaid ? Number(recordTaxPaid) : 0,
      });
      setFilingSaveSuccess("Statutory return acknowledgment saved successfully!");
      setIsFilingModalOpen(false);
      setRecordArn("");
      setRecordTaxPaid("");
      loadData();
    } catch (err: any) {
      alert("Failed to save filing record: " + err.message);
    } finally {
      setIsSavingFiling(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-slate-900 leading-tight">
                GST Compliance &amp; Returns
              </h2>
              <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                5% Rate
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              GSTR-1, GSTR-3B summary, purchase ITC match &amp; DigiLocker
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Preset selector */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-1 flex text-xs">
            <button
              onClick={() => setDatePreset("ALL")}
              className={`px-2 py-1 rounded text-xs font-medium transition cursor-pointer ${
                datePreset === "ALL" ? "bg-white text-slate-900 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDatePreset("THIS_MONTH")}
              className={`px-2 py-1 rounded text-xs font-medium transition cursor-pointer ${
                datePreset === "THIS_MONTH" ? "bg-white text-slate-900 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setDatePreset("PREV_MONTH")}
              className={`px-2 py-1 rounded text-xs font-medium transition cursor-pointer ${
                datePreset === "PREV_MONTH" ? "bg-white text-slate-900 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Prev Month
            </button>
          </div>

          <a
            href={api.getExportSalesRegisterUrl(getDateParams())}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={loadData}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px text-xs">
        <button
          onClick={() => setActiveTab("DASHBOARD")}
          className={`pb-2 px-3 font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === "DASHBOARD"
              ? "border-indigo-600 text-indigo-700 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Summary &amp; Calculator</span>
        </button>

        <button
          onClick={() => setActiveTab("GSTR1")}
          className={`pb-2 px-3 font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === "GSTR1"
              ? "border-indigo-600 text-indigo-700 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>GSTR-1</span>
        </button>

        <button
          onClick={() => setActiveTab("GSTR3B")}
          className={`pb-2 px-3 font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === "GSTR3B"
              ? "border-indigo-600 text-indigo-700 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>GSTR-3B</span>
        </button>

        <button
          onClick={() => setActiveTab("GSTR2B")}
          className={`pb-2 px-3 font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === "GSTR2B"
              ? "border-indigo-600 text-indigo-700 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>GSTR-2B ITC Match</span>
        </button>

        <button
          onClick={() => setActiveTab("CALENDAR")}
          className={`pb-2 px-3 font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === "CALENDAR"
              ? "border-indigo-600 text-indigo-700 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Due Dates &amp; ARNs</span>
        </button>

        <button
          onClick={() => setActiveTab("DIGILOCKER")}
          className={`pb-2 px-3 font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === "DIGILOCKER"
              ? "border-emerald-600 text-emerald-700 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>DigiLocker Hub</span>
        </button>
      </div>

      {/* TAB 1: DASHBOARD & TAX CALCULATOR */}
      {activeTab === "DASHBOARD" && (
        <div className="space-y-4">
          {/* Store Scheme Banner */}
          <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">
                Scheme: {summaryData?.scheme.currentScheme === "COMPOSITION" ? "Composition (1%)" : "Regular Scheme"}
              </span>
              <span className="text-[10px] px-2 py-1 bg-indigo-100 text-indigo-800 font-semibold rounded">
                {summaryData?.scheme.filingFrequency === "QRMP_QUARTERLY" ? "QRMP Quarterly" : "Monthly"}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 font-mono">GSTIN: {summaryData?.scheme.gstin || "Not Set"}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">POS: {summaryData?.scheme.stateCode}</span>
            </div>
            <div className="text-[11px] font-bold text-slate-700">
              Standard Medicine Rate: 5% (CGST 2.5% + SGST 2.5%)
            </div>
          </div>

          {/* Core Calculation Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Output Tax */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Output GST (Sales)
              </span>
              <div className="text-xl font-black text-indigo-700 mt-1">
                ₹{summaryData?.summary.adjustedOutputGst.toFixed(2) || "0.00"}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                <span>Taxable:</span>
                <span className="font-semibold text-slate-800">₹{summaryData?.summary.totalTaxableSales.toFixed(2)}</span>
              </div>
              <div className="text-[10px] text-slate-400 flex justify-between">
                <span>Nil / Exempt:</span>
                <span>₹{summaryData?.summary.nilRatedSales.toFixed(2)}</span>
              </div>
            </div>

            {/* Card 2: Eligible Input Tax Credit */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Eligible ITC (Purchases)
              </span>
              <div className="text-xl font-black text-slate-800 mt-1">
                ₹{summaryData?.summary.netEligibleItc.toFixed(2) || "0.00"}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                <span>Gross Purchase ITC:</span>
                <span className="font-semibold text-slate-800">₹{summaryData?.summary.grossInputItc.toFixed(2)}</span>
              </div>
              <div className="text-[10px] text-rose-500 flex justify-between">
                <span>Reversals:</span>
                <span>- ₹{summaryData?.summary.itcReversals.toFixed(2)}</span>
              </div>
            </div>

            {/* Card 3: Net GST Payable */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Net Tax Payable (Cash)
              </span>
              <div className="text-xl font-black text-emerald-600 mt-1">
                ₹{summaryData?.summary.netGstPayable.toFixed(2) || "0.00"}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Output GST − Eligible ITC
              </div>
            </div>

            {/* Card 4: Composition Scheme Comparison */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Composition (1% Flat)
              </span>
              <div className="text-xl font-black text-amber-600 mt-1">
                ₹{summaryData?.summary.compositionTaxPayable.toFixed(2) || "0.00"}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Quarterly turnover liability
              </div>
            </div>
          </div>

          {/* Rate-Wise Tax Distribution Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  GST Rate-Wise Outward Supplies Distribution
                </h3>
                <p className="text-xs text-slate-500">
                  Separately aggregates 0% nil-rated medicines, 5% standard drugs, and other medical-store items.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs text-slate-700 min-w-[750px] whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2 min-w-[150px]">Tax Slab</th>
                    <th className="px-3 py-2 text-right min-w-[120px]">Taxable Turnover</th>
                    <th className="px-3 py-2 text-right min-w-[110px]">CGST</th>
                    <th className="px-3 py-2 text-right min-w-[110px]">SGST</th>
                    <th className="px-3 py-2 text-right min-w-[110px]">IGST</th>
                    <th className="px-3 py-2 text-right min-w-[120px]">Total Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {Object.entries(summaryData?.rateWiseSales || {}).map(([rate, val]) => (
                    <tr key={rate} className="hover:bg-slate-50/80">
                      <td className="px-3 py-2 font-bold text-slate-900">
                        {rate === "0" ? "0% (Nil / Exempt)" : `${rate}% GST`}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-slate-800">
                        ₹{val.taxable.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600">
                        ₹{val.cgst.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600">
                        ₹{val.sgst.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600">
                        ₹{val.igst.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-indigo-700">
                        ₹{val.totalTax.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GSTR-1 OUTWARD SUPPLIES */}
      {activeTab === "GSTR1" && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Table 4: B2B Invoices (Registered)
              </span>
              <div className="text-xl font-black text-indigo-700 mt-1">
                ₹{gstr1Data?.b2b.total.toFixed(2) || "0.00"}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {gstr1Data?.b2b.count || 0} registered buyer invoice(s)
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Table 7: B2C Retail (Consolidated)
              </span>
              <div className="text-xl font-black text-slate-800 mt-1">
                ₹{gstr1Data?.b2c.total.toFixed(2) || "0.00"}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {gstr1Data?.b2c.count || 0} walk-in retail patient invoice(s)
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Table 12: HSN Summary
              </span>
              <div className="text-xl font-black text-emerald-600 mt-1">
                {gstr1Data?.hsnSummary.length || 0} Slabs
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Grouped by HSN &amp; packaging UQC
              </span>
            </div>
          </div>

          {/* Table 12 HSN Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-900">
                Table 12: HSN-Wise Summary of Outward Medicine Supplies
              </h3>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs text-slate-700 min-w-[950px] whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2 min-w-[110px]">HSN Code</th>
                    <th className="px-3 py-2 min-w-[200px]">Description</th>
                    <th className="px-3 py-2 min-w-[80px]">UQC</th>
                    <th className="px-3 py-2 text-right min-w-[80px]">Qty</th>
                    <th className="px-3 py-2 text-right min-w-[110px]">Total Val</th>
                    <th className="px-3 py-2 text-right min-w-[110px]">Taxable</th>
                    <th className="px-3 py-2 text-right min-w-[70px]">Rate</th>
                    <th className="px-3 py-2 text-right min-w-[90px]">CGST</th>
                    <th className="px-3 py-2 text-right min-w-[90px]">SGST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {gstr1Data?.hsnSummary.map((h, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="px-3 py-2 font-mono font-bold text-slate-900">{h.hsnCode}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">{h.description}</td>
                      <td className="px-3 py-2 text-slate-500">{h.uqc}</td>
                      <td className="px-3 py-2 text-right font-mono">{h.totalQty}</td>
                      <td className="px-3 py-2 text-right font-mono">₹{h.totalValue.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">₹{h.taxableValue.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-mono">{h.rate}%</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-600">₹{h.cgst.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-600">₹{h.sgst.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GSTR-3B TAX COMPUTATION */}
      {activeTab === "GSTR3B" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Table 3.1 Outward Liability */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <h3 className="font-bold text-xs text-slate-900">
                  3.1 Outward Taxable Supplies
                </h3>
                <span className="text-[10px] text-slate-500">Sales Liability</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">Taxable Value:</span>
                  <span className="font-bold text-slate-900">
                    ₹{gstr3bData?.table31.outwardTaxableSupplies.taxableValue.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">CGST:</span>
                  <span className="font-bold text-slate-800">
                    ₹{gstr3bData?.table31.outwardTaxableSupplies.centralTax.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">SGST:</span>
                  <span className="font-bold text-slate-800">
                    ₹{gstr3bData?.table31.outwardTaxableSupplies.stateTax.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between py-2 bg-slate-50 px-2 rounded-lg font-bold">
                  <span className="text-slate-800">Total Output Tax:</span>
                  <span className="text-indigo-700">
                    ₹{gstr3bData?.table6.taxPayable.total.toFixed(2) || "0.00"}
                  </span>
                </div>
              </div>
            </div>

            {/* Table 4 Eligible ITC */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <h3 className="font-bold text-xs text-slate-900">
                  4. Eligible Input Tax Credit
                </h3>
                <span className="text-[10px] text-slate-500">Purchases ITC</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">Inward Purchases:</span>
                  <span className="font-bold text-slate-900">
                    ₹{gstr3bData?.table4.itcAvailable.allOtherItc.totalItc.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">CGST Credit:</span>
                  <span className="font-bold text-slate-800">
                    ₹{gstr3bData?.table4.netItcAvailable.centralTax.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">SGST Credit:</span>
                  <span className="font-bold text-slate-800">
                    ₹{gstr3bData?.table4.netItcAvailable.stateTax.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between py-2 bg-slate-50 px-2 rounded-lg font-bold">
                  <span className="text-slate-800">Net Eligible ITC:</span>
                  <span className="text-emerald-700">
                    ₹{gstr3bData?.table4.netItcAvailable.total.toFixed(2) || "0.00"}
                  </span>
                </div>
              </div>
            </div>

            {/* Table 6 Payment of Tax */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <h3 className="font-bold text-xs text-slate-900">
                  6. Payment of Tax
                </h3>
                <span className="text-[10px] text-slate-500">Discharge</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">Tax Liability:</span>
                  <span className="font-bold text-slate-900">
                    ₹{gstr3bData?.table6.taxPayable.total.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 text-emerald-700">
                  <span>ITC Credit Adjusted:</span>
                  <span className="font-bold">
                    - ₹{(
                      (gstr3bData?.table6.paidThroughItc.centralTax || 0) +
                      (gstr3bData?.table6.paidThroughItc.stateTax || 0)
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-2 bg-emerald-50 px-2 rounded-lg font-bold">
                  <span className="text-emerald-900">Cash Payment Due:</span>
                  <span className="text-emerald-700 text-sm">
                    ₹{gstr3bData?.table6.paidInCashRequired.totalCashRequired.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 pt-1">
                  Discharge via PMT-06 challan before portal due date.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GSTR-2B & ITC MATCH */}
      {activeTab === "GSTR2B" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 block">Total Purchase Bills</span>
              <span className="text-lg font-bold text-slate-900">
                {gstr2bData?.summary.totalPurchaseBills || 0}
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 block">Matched in 2B</span>
              <span className="text-lg font-bold text-emerald-600">
                {gstr2bData?.summary.matchedCount || 0}
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 block">Missing in 2B</span>
              <span className="text-lg font-bold text-amber-600">
                {gstr2bData?.summary.missingIn2BCount || 0}
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 block">Eligible Reconciled ITC</span>
              <span className="text-lg font-bold text-indigo-700">
                ₹{gstr2bData?.summary.eligibleItcTotal.toFixed(2) || "0.00"}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-900">
                Inward Purchases vs GSTR-2B Reconciliation Ledger
              </h3>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs text-slate-700 min-w-[980px] whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2 min-w-[200px]">Supplier</th>
                    <th className="px-3 py-2 min-w-[150px]">GSTIN</th>
                    <th className="px-3 py-2 min-w-[120px]">Bill #</th>
                    <th className="px-3 py-2 min-w-[100px]">Date</th>
                    <th className="px-3 py-2 text-right min-w-[100px]">Taxable</th>
                    <th className="px-3 py-2 text-right min-w-[100px]">Book Tax</th>
                    <th className="px-3 py-2 text-right min-w-[100px]">2B Tax</th>
                    <th className="px-3 py-2 min-w-[120px]">Match Status</th>
                    <th className="px-3 py-2 min-w-[90px]">ITC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {gstr2bData?.reconciledInvoices.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80">
                      <td className="px-3 py-2 font-bold text-slate-900">{r.supplierName}</td>
                      <td className="px-3 py-2 font-mono text-slate-600 text-[11px]">{r.supplierGstin}</td>
                      <td className="px-3 py-2 font-mono text-slate-800">{r.invoiceNumber}</td>
                      <td className="px-3 py-2 text-slate-500">{r.invoiceDate}</td>
                      <td className="px-3 py-2 text-right font-mono">₹{r.bookTaxable.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">₹{r.bookTax.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-indigo-700">₹{r.gstr2bTax.toFixed(2)}</td>
                      <td className="px-3 py-2">
                        {r.matchStatus === "MATCHED" && (
                          <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Matched
                          </span>
                        )}
                        {r.matchStatus === "MISSING_IN_2B" && (
                          <span className="px-2 py-1 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Supplier Pending
                          </span>
                        )}
                        {r.matchStatus === "VALUE_MISMATCH" && (
                          <span className="px-2 py-1 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Mismatch
                          </span>
                        )}
                        {r.matchStatus === "INELIGIBLE_ITC" && (
                          <span className="px-2 py-1 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Unregistered
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`font-bold ${
                            r.itcEligibility === "ELIGIBLE" ? "text-emerald-700" : "text-slate-400"
                          }`}
                        >
                          {r.itcEligibility}
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

      {/* TAB 5: STATUTORY DEADLINES & ARNS */}
      {activeTab === "CALENDAR" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-900">Statutory GST Filing Calendar &amp; Deadlines</h3>
            <button
              onClick={() => setIsFilingModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Record Return ARN</span>
            </button>
          </div>

          {/* Statutory Deadlines Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {filingsData?.schedules.map((s, idx) => (
              <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{s.returnType}</span>
                  <span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-700 font-semibold rounded">
                    {s.frequency}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">{s.description}</div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Due Date:</span>
                  <span className="text-xs font-bold text-indigo-700 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{s.dueDate}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Filed Return Acknowledgements */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-100">
              <h3 className="font-bold text-xs text-slate-900">Recorded Return Filings &amp; ARNs</h3>
            </div>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs text-slate-700 min-w-[800px] whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2 min-w-[100px]">Return</th>
                    <th className="px-3 py-2 min-w-[120px]">Tax Period</th>
                    <th className="px-3 py-2 min-w-[120px]">Filing Date</th>
                    <th className="px-3 py-2 min-w-[160px]">ARN Number</th>
                    <th className="px-3 py-2 text-right min-w-[120px]">Net Tax Paid</th>
                    <th className="px-3 py-2 min-w-[100px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filingsData?.filingRecords && filingsData.filingRecords.length > 0 ? (
                    filingsData.filingRecords.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50/80">
                        <td className="px-3 py-2 font-bold text-slate-900">{f.returnType}</td>
                        <td className="px-3 py-2 font-mono">{f.taxPeriod}</td>
                        <td className="px-3 py-2 text-slate-600">
                          {f.filingDate ? new Date(f.filingDate).toLocaleDateString() : "Pending"}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-indigo-700">
                          {f.arnNumber || "Pending"}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-emerald-700">
                          ₹{Number(f.netTaxPaid).toFixed(2)}
                        </td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {f.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        No filings recorded yet. Click &quot;Record Return ARN&quot; to log your acknowledgment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: DIGILOCKER COMPLIANCE HUB */}
      {activeTab === "DIGILOCKER" && (
        <div className="space-y-4">
          {/* DigiLocker Gateway Card */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-bold text-slate-900">DigiLocker Healthcare &amp; GST Gateway</span>
                <span className="ml-2 px-2 py-1 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {digilockerStatus?.gatewayStatus || "CONNECTED"} ({digilockerStatus?.mode || "SANDBOX"})
                </span>
              </div>
            </div>

            <div className="text-[11px] text-emerald-800">
              Org: <strong>{vaultData?.store.name}</strong> • GSTIN: <strong>{vaultData?.store.gstin}</strong>
            </div>
          </div>

          {/* Interactive Verifications (ABHA & Doctor) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Patient ABHA / Aadhaar Verification */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  <span>Patient ABHA / Identity Verification</span>
                </h3>
                <span className="text-[10px] text-slate-400">ABDM Portal</span>
              </div>

              <form onSubmit={handleVerifyPatient} className="space-y-2">
                <div className="flex gap-2">
                  <select
                    value={verifyIdType}
                    onChange={(e: any) => setVerifyIdType(e.target.value)}
                    className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none"
                  >
                    <option value="ABHA">ABHA #</option>
                    <option value="AADHAAR">Aadhaar Last 4</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Enter 14-digit ABHA (91-1234-5678-9012)..."
                    value={verifyIdInput}
                    onChange={(e) => setVerifyIdInput(e.target.value)}
                    className="flex-1 px-2 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500 font-mono shadow-2xs"
                  />
                  <button
                    type="submit"
                    disabled={isVerifyingPatient || !verifyIdInput.trim()}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1"
                  >
                    {isVerifyingPatient ? <RefreshCw className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                    <span>Verify</span>
                  </button>
                </div>
              </form>

              {patientError && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>{patientError}</span>
                </div>
              )}

              {patientResult && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 text-xs flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>{patientResult.fullName}</span>
                    </span>
                    <span className="px-2 py-1 bg-emerald-200 text-emerald-900 font-bold rounded text-[9px]">
                      Verified
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-700 pt-1 border-t border-emerald-200/60">
                    <div>ABHA: <strong>{patientResult.abhaAddress || "N/A"}</strong></div>
                    <div>Gender/DOB: <strong>{patientResult.gender}, {patientResult.dateOfBirth}</strong></div>
                    <div>Location: <strong>{patientResult.district}, {patientResult.state}</strong></div>
                    <div className="font-mono text-[10px]">Ref: {patientResult.digilockerRefId}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Doctor NMC Registration Verification */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-indigo-600" />
                  <span>Doctor NMC Registration Check</span>
                </h3>
                <span className="text-[10px] text-slate-400">National Medical Commission</span>
              </div>

              <form onSubmit={handleVerifyDoctor} className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Doctor Name (Dr. K. Patel)..."
                    value={docNameInput}
                    onChange={(e) => setDocNameInput(e.target.value)}
                    className="px-2 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Reg No (G-34891)..."
                      value={docRegInput}
                      onChange={(e) => setDocRegInput(e.target.value)}
                      className="flex-1 px-2 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 font-mono shadow-2xs"
                    />
                    <button
                      type="submit"
                      disabled={isVerifyingDoctor || !docNameInput.trim() || !docRegInput.trim()}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1"
                    >
                      {isVerifyingDoctor ? <RefreshCw className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                      <span>Validate</span>
                    </button>
                  </div>
                </div>
              </form>

              {doctorError && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>{doctorError}</span>
                </div>
              )}

              {doctorResult && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-950 text-xs flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                      <span>{doctorResult.doctorName}</span>
                    </span>
                    <span className="px-2 py-1 bg-indigo-200 text-indigo-950 font-bold rounded text-[9px]">
                      Active Reg
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-700 pt-1 border-t border-indigo-200/60">
                    <div>Council: <strong>{doctorResult.stateMedicalCouncil}</strong></div>
                    <div>Reg #: <strong className="font-mono">{doctorResult.registrationNumber}</strong></div>
                    <div>Degree: <strong>{doctorResult.qualification}</strong></div>
                    <div className="font-mono text-[10px]">URI: {doctorResult.digilockerDocUri}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pharmacy Compliance Vault Documents */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-900">
                Pharmacy Statutory Compliance Vault (DigiLocker Verified)
              </h3>
            </div>

            <div className="divide-y divide-slate-100">
              {vaultData?.documents.map((doc) => (
                <div key={doc.id} className="px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/80">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex-shrink-0">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{doc.title}</span>
                        <span className="px-2 py-1 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                          {doc.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-1">
                        {doc.documentNumber} • {doc.issuingAuthority} • URI: {doc.digilockerUri}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">{doc.fileSize}</span>
                    <button
                      type="button"
                      onClick={() => alert(`Verified DigiLocker URI: ${doc.digilockerUri}\nIssued to: ${vaultData.store.name}`)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>View URI</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Record Filing Modal */}
      {isFilingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-3 bg-white border-b border-slate-100 text-slate-900 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Record Return ARN</h3>
              <button
                type="button"
                onClick={() => setIsFilingModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFiling} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Return Type
                </label>
                <select
                  value={recordReturnType}
                  onChange={(e) => setRecordReturnType(e.target.value)}
                  className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium outline-none"
                >
                  <option value="GSTR-1">GSTR-1 (Outward Supplies)</option>
                  <option value="GSTR-3B">GSTR-3B (Tax Summary)</option>
                  <option value="CMP-08">CMP-08 (Composition 1%)</option>
                  <option value="GST PMT-06">GST PMT-06 (QRMP Challan)</option>
                  <option value="GSTR-9">GSTR-9 (Annual Return)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tax Period
                </label>
                <input
                  type="text"
                  placeholder="10-2026 or Q3-2026"
                  value={recordPeriod}
                  onChange={(e) => setRecordPeriod(e.target.value)}
                  required
                  className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Portal ARN
                </label>
                <input
                  type="text"
                  placeholder="AA2410260198421"
                  value={recordArn}
                  onChange={(e) => setRecordArn(e.target.value)}
                  required
                  className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Net Tax Paid in Cash (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={recordTaxPaid}
                  onChange={(e) => setRecordTaxPaid(e.target.value)}
                  className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFilingModalOpen(false)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingFiling}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  {isSavingFiling && <RefreshCw className="h-3 w-3 animate-spin" />}
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
