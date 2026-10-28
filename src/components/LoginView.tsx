"use client";

import React, { useState } from "react";
import { Plus, Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, Stethoscope } from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";

interface LoginViewProps {
  onSuccessLogin?: (role: "ADMIN" | "SUPER_ADMIN", storeName: string) => void;
  onNavigateToForgotPassword?: () => void;
}

export default function LoginView({
  onSuccessLogin,
  onNavigateToForgotPassword,
}: LoginViewProps) {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!emailOrUsername.trim() || !password.trim()) {
      setErrorMessage("Please enter your username and password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.login(emailOrUsername, password);
      if (onSuccessLogin && res.user) {
        onSuccessLogin(
          res.user.role as "ADMIN" | "SUPER_ADMIN",
          res.store?.name || "City Medical Store"
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-xl bg-indigo-600 items-center justify-center text-white shadow-md shadow-indigo-600/20 mb-1">
            <Plus className="h-7 w-7 stroke-[3]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">MediPOS</h1>
          <p className="text-sm text-slate-500">Sign in to your pharmacy</p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium text-center">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Email or Username
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="Enter email or username"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              {onNavigateToForgotPassword && (
                <button
                  type="button"
                  onClick={onNavigateToForgotPassword}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-10 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
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
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white rounded-xl text-sm font-bold transition shadow-sm shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
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

        {/* Doctor portal link */}
        <div className="pt-2 text-center border-t border-slate-100">
          <Link
            href="/doctor/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
          >
            <Stethoscope className="h-4 w-4 text-indigo-600" />
            <span>Are you a Doctor? Doctor Login →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
