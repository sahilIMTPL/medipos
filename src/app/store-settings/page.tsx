"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import {
  Settings,
  Save,
  Store,
  ShieldCheck,
  Printer,
  CheckCircle2,
  Download,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Database,
  Building,
  Percent,
  Cloud,
  FileText,
  Lock,
  Eye,
  EyeOff,
  Send,
  Check,
  XCircle,
} from "lucide-react";
import { api } from "@/lib/api";

export default function StoreSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Store Profile
  const [currentStoreId, setCurrentStoreId] = useState("");
  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [gstin, setGstin] = useState("");
  const [drugLicenseNo, setDrugLicenseNo] = useState("");

  // Operational Settings
  const [invoicePrefix, setInvoicePrefix] = useState("INV");
  const [thermalPrintWidth, setThermalPrintWidth] = useState(80);
  const [expiryAlertDays, setExpiryAlertDays] = useState(90);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [maxDiscountPercent, setMaxDiscountPercent] = useState(20);
  const [defaultTaxRate, setDefaultTaxRate] = useState(5);
  const [enableLooseSale, setEnableLooseSale] = useState(true);
  const [requireDoctorInfo, setRequireDoctorInfo] = useState(false);

  // GST Compliance Scheme Settings
  const [gstScheme, setGstScheme] = useState<"REGULAR" | "COMPOSITION">("REGULAR");
  const [filingFrequency, setFilingFrequency] = useState<"MONTHLY" | "QUARTERLY_QRMP">("MONTHLY");
  const [stateCode, setStateCode] = useState("24 - Gujarat");
  const [compositionTaxRate, setCompositionTaxRate] = useState(1.0);
  const [isEInvoicingEligible, setIsEInvoicingEligible] = useState(false);

  // DigiLocker API Settings
  const [digilockerEnabled, setDigilockerEnabled] = useState(true);
  const [digilockerClientId, setDigilockerClientId] = useState("");
  const [digilockerClientSecret, setDigilockerClientSecret] = useState("");
  const [digilockerOrgName, setDigilockerOrgName] = useState("");
  const [digilockerMode, setDigilockerMode] = useState<"SANDBOX" | "PRODUCTION">("SANDBOX");

  // Backup State
  const [exportingBackup, setExportingBackup] = useState(false);

  useEffect(() => {
    const fetchStoreSettings = async () => {
      setLoading(true);
      try {
        const res = await api.getCurrentStore();
        if (res.success && res.store) {
          const s = res.store;
          setCurrentStoreId(s.id);
          setStoreName(s.name || "");
          setPhone(s.phone || "");
          setEmail(s.email || "");
          setAddress(s.address || "");
          setCity(s.city || "");
          setState(s.state || "");
          setPincode(s.pincode || "");
          setGstin(s.gstin || "");
          setDrugLicenseNo(s.drugLicenseNo || "");

          if (s.settings) {
            setInvoicePrefix(s.settings.invoicePrefix || "INV");
            setThermalPrintWidth(s.settings.thermalPrintWidth || 80);
            setExpiryAlertDays(s.settings.expiryAlertDays || 90);
            setLowStockThreshold(s.settings.lowStockThreshold || 10);
            setMaxDiscountPercent(s.settings.maxDiscountPercent || 20);
            setDefaultTaxRate(s.settings.defaultTaxRate || 5);
            setEnableLooseSale(s.settings.enableLooseSale !== false);
            setRequireDoctorInfo(s.settings.requireDoctorInfo || false);
            setGstScheme((s.settings.gstScheme as any) || "REGULAR");
            setFilingFrequency((s.settings.filingFrequency as any) || "MONTHLY");
            setStateCode(s.settings.stateCode || "24 - Gujarat");
            setCompositionTaxRate(s.settings.compositionTaxRate || 1.0);
            setIsEInvoicingEligible(s.settings.isEInvoicingEligible || false);
            setDigilockerEnabled(s.settings.digilockerEnabled ?? true);
            setDigilockerClientId(s.settings.digilockerClientId || "");
            setDigilockerClientSecret(s.settings.digilockerClientSecret || "");
            setDigilockerOrgName(s.settings.digilockerOrgName || s.name || "");
            setDigilockerMode((s.settings.digilockerMode as any) || "SANDBOX");
          }
        }
      } catch (err) {
        console.error("Failed to load store settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStoreSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await Promise.all([
        api.updateCurrentStore({
          storeId: currentStoreId || undefined,
          name: storeName.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          pincode: pincode.trim() || undefined,
          gstin: gstin.trim() || undefined,
          drugLicenseNo: drugLicenseNo.trim() || undefined,
        }),
        api.updateStoreSettings({
          storeId: currentStoreId || undefined,
          invoicePrefix: invoicePrefix.trim().toUpperCase() || "INV",
          thermalPrintWidth: Number(thermalPrintWidth),
          expiryAlertDays: Number(expiryAlertDays),
          lowStockThreshold: Number(lowStockThreshold),
          maxDiscountPercent: Number(maxDiscountPercent),
          defaultTaxRate: Number(defaultTaxRate),
          enableLooseSale,
          requireDoctorInfo,
          gstScheme,
          filingFrequency,
          stateCode,
          compositionTaxRate: Number(compositionTaxRate),
          isEInvoicingEligible,
          digilockerEnabled,
          digilockerClientId: digilockerClientId.trim(),
          digilockerClientSecret: digilockerClientSecret.trim(),
          digilockerOrgName: digilockerOrgName.trim(),
          digilockerMode,
        }),
      ]);

      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err: any) {
      setError(err.message || "Failed to update store settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = async () => {
    setExportingBackup(true);
    try {
      const res = await api.getStoreBackup();
      if (res.success && res.backup) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.backup, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `medipos_backup_${storeName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      }
    } catch (err) {
      alert("Failed to export database backup.");
    } finally {
      setExportingBackup(false);
    }
  };

  if (loading) {
    return (
      <AppLayout activeMenuId="store-settings">
        <div className="p-20 text-center text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-600" />
          Loading store configurations...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeMenuId="store-settings">
      <div className="p-4 space-y-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Store Settings</h1>
              <p className="text-xs text-slate-500">Store profile, GST scheme, and operational preferences</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saved && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Saved</span>
              </div>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-xs rounded-lg shadow-2xs transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving..." : "Save Settings"}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Pharmacy Profile */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Building className="h-4 w-4 text-indigo-600" />
              <h2 className="font-bold text-slate-900 text-sm">Store Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Store Name *</label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pharmacy@store.com"
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ahmedabad"
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Gujarat"
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Shop No., Complex, Street name..."
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="380015"
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Licenses & Tax Registration */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <h2 className="font-bold text-slate-900 text-sm">Drug License &amp; GSTIN</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Drug License No (Form 20B/21B)</label>
                <input
                  type="text"
                  value={drugLicenseNo}
                  onChange={(e) => setDrugLicenseNo(e.target.value)}
                  placeholder="GJ-AH1-20B-998811"
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-mono uppercase font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">GSTIN</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="24ABCDE1234F1Z5"
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-mono uppercase font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* GST Scheme & Return Frequency */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Percent className="h-4 w-4 text-indigo-600" />
              <h2 className="font-bold text-slate-900 text-sm">GST Scheme &amp; Filing Schedule</h2>
            </div>

            {/* Scheme Toggle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                onClick={() => setGstScheme("REGULAR")}
                className={`p-3 rounded-lg border cursor-pointer transition ${
                  gstScheme === "REGULAR"
                    ? "border-indigo-600 bg-indigo-50/40"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Regular Scheme (5% Medicine Rate)</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${gstScheme === "REGULAR" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    {gstScheme === "REGULAR" ? "Active" : "Select"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">5% rate with Input Tax Credit (ITC). Files GSTR-1 &amp; GSTR-3B.</p>
              </div>

              <div
                onClick={() => setGstScheme("COMPOSITION")}
                className={`p-3 rounded-lg border cursor-pointer transition ${
                  gstScheme === "COMPOSITION"
                    ? "border-indigo-600 bg-indigo-50/40"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Composition Scheme (1% Flat)</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${gstScheme === "COMPOSITION" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    {gstScheme === "COMPOSITION" ? "Active" : "Select"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">1% turnover tax. No customer tax collection. Files CMP-08.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Return Frequency</label>
                <select
                  value={filingFrequency}
                  onChange={(e) => setFilingFrequency(e.target.value as any)}
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-white focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="MONTHLY">Monthly (11th &amp; 20th)</option>
                  <option value="QUARTERLY_QRMP">Quarterly QRMP (13th &amp; 22nd)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">State &amp; Code</label>
                <input
                  type="text"
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value)}
                  placeholder="24 - Gujarat"
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              {gstScheme === "COMPOSITION" ? (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Composition Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="5.0"
                    value={compositionTaxRate}
                    onChange={(e) => setCompositionTaxRate(Number(e.target.value))}
                    className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              ) : (
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={isEInvoicingEligible}
                      onChange={(e) => setIsEInvoicingEligible(e.target.checked)}
                      className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-medium text-slate-800">E-Invoicing Enabled (&gt; ₹5 Cr)</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* DigiLocker Healthcare API */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-indigo-600" />
                <h2 className="font-bold text-slate-900 text-sm">DigiLocker Healthcare API</h2>
              </div>

              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${digilockerMode === "PRODUCTION" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                {digilockerMode === "PRODUCTION" ? "Production" : "Sandbox"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Environment</label>
                <select
                  value={digilockerMode}
                  onChange={(e) => setDigilockerMode(e.target.value as any)}
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-white focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="SANDBOX">Sandbox (Test Mode)</option>
                  <option value="PRODUCTION">Production (Live)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Client ID</label>
                <input
                  type="text"
                  value={digilockerClientId}
                  onChange={(e) => setDigilockerClientId(e.target.value)}
                  placeholder="DIGILOCKER_CLIENT_001"
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Client Secret</label>
                <input
                  type="password"
                  value={digilockerClientSecret}
                  onChange={(e) => setDigilockerClientSecret(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Organization Name</label>
                <input
                  type="text"
                  value={digilockerOrgName}
                  onChange={(e) => setDigilockerOrgName(e.target.value)}
                  placeholder="Apollo Medico Gujarat Retail"
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={digilockerEnabled}
                    onChange={(e) => setDigilockerEnabled(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-medium text-slate-800">Enable Patient ABHA &amp; Digital Receipts</span>
                </label>
              </div>
            </div>
          </div>

          {/* Billing & Printer Settings */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Printer className="h-4 w-4 text-indigo-600" />
              <h2 className="font-bold text-slate-900 text-sm">Billing &amp; Thermal Receipts</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Invoice Prefix</label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  placeholder="INV"
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-mono uppercase font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Thermal Paper Width</label>
                <select
                  value={thermalPrintWidth}
                  onChange={(e) => setThermalPrintWidth(Number(e.target.value))}
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-white focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value={80}>80mm (Standard POS)</option>
                  <option value={58}>58mm (Compact Mobile)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Default Tax Rate</label>
                <select
                  value={defaultTaxRate}
                  onChange={(e) => setDefaultTaxRate(Number(e.target.value))}
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-white focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value={0}>0% (Tax Exempt)</option>
                  <option value={5}>5% (Medicine Council Rate)</option>
                  <option value={12}>12% (Formulations)</option>
                  <option value={18}>18% (Devices &amp; OTC)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100/70 transition text-xs">
                <input
                  type="checkbox"
                  checked={enableLooseSale}
                  onChange={(e) => setEnableLooseSale(e.target.checked)}
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-800">Enable Loose Tablet Dispensing</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100/70 transition text-xs">
                <input
                  type="checkbox"
                  checked={requireDoctorInfo}
                  onChange={(e) => setRequireDoctorInfo(e.target.checked)}
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-800">Require Doctor Details for Schedule H</span>
              </label>
            </div>
          </div>

          {/* Alerts & Stock Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sliders className="h-4 w-4 text-indigo-600" />
              <h2 className="font-bold text-slate-900 text-sm">Alerts &amp; Thresholds</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Expiry Warning (Days)</label>
                <input
                  type="number"
                  min="15"
                  max="180"
                  value={expiryAlertDays}
                  onChange={(e) => setExpiryAlertDays(Number(e.target.value))}
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Low Stock Warning (Qty)</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Max Cashier Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={maxDiscountPercent}
                  onChange={(e) => setMaxDiscountPercent(Number(e.target.value))}
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Backup Export */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-indigo-600" />
              <div>
                <h3 className="font-bold text-xs text-slate-900">Database Backup JSON</h3>
                <p className="text-[11px] text-slate-500">Download snapshot of store data</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadBackup}
              disabled={exportingBackup}
              className="px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <Download className="h-4 w-4 text-indigo-600" />
              <span>{exportingBackup ? "Exporting..." : "Download Backup"}</span>
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
