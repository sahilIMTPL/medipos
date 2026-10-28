"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
} from "lucide-react";
import { doctorApi, DoctorAuthUser } from "@/lib/api/doctor.api";
import Link from "next/link";

export default function DoctorLoginPage() {
  const router = useRouter();

  const [mciOrEmail, setMciOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [demoDoctors, setDemoDoctors] = useState<Array<Omit<DoctorAuthUser, "storeId" | "storeName">>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const activeDoc = doctorApi.getStoredDoctorSession();
    if (activeDoc) {
      router.push("/doctor");
      return;
    }

    const loadMeta = async () => {
      try {
        const docRes = await doctorApi.getRegisteredDoctors();
        if (docRes.success && docRes.doctors) {
          setDemoDoctors(docRes.doctors);
        }
      } catch (e) {
        console.error("Failed to load doctors", e);
      }
    };
    loadMeta();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!mciOrEmail.trim() || !password.trim()) {
      setErrorMessage("Please enter your MCI Number/Email and password.");
      return;
    }

    setIsLoading(true);
    try {
      await doctorApi.loginDoctor({
        mciOrEmail: mciOrEmail.trim(),
        password: password.trim(),
      });
      router.push("/doctor");
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid doctor credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectDemoDoctor = (doc: Omit<DoctorAuthUser, "storeId" | "storeName">) => {
    setMciOrEmail(doc.mciNumber);
    setPassword("Doctor@123");
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-xl bg-blue-600 items-center justify-center text-white shadow-md shadow-blue-600/20 mb-1">
            <Stethoscope className="h-7 w-7 stroke-2" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Doctor Login</h1>
          <p className="text-sm text-slate-500">Sign in to consultation desk</p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              MCI Number or Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={mciOrEmail}
                onChange={(e) => setMciOrEmail(e.target.value)}
                placeholder="e.g. MCI-48291/2012"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-10 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white rounded-xl text-sm font-bold transition shadow-sm shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Doctor Quick Fill */}
        {demoDoctors.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              Quick Doctor Select:
            </span>
            <div className="grid grid-cols-1 gap-2">
              {demoDoctors.slice(0, 2).map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => selectDemoDoctor(doc)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-left flex items-center justify-between text-xs text-slate-700 transition cursor-pointer"
                >
                  <span className="font-semibold truncate">{doc.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{doc.mciNumber}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pharmacy Login link */}
        <div className="pt-2 text-center border-t border-slate-100">
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
          >
            ← Back to Pharmacy Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
