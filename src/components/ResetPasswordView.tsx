"use client";

import React, { useState } from "react";
import { Plus, Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

interface ResetPasswordViewProps {
  email?: string;
  onSuccessReset: () => void;
  onBackToLogin: () => void;
}

export default function ResetPasswordView({
  email = "",
  onSuccessReset,
  onBackToLogin,
}: ResetPasswordViewProps) {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await api.resetPassword(email, token || "demo-token", newPassword);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
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
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Reset Password</h1>
          <p className="text-xs text-slate-500">
            Create a new password for your account
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium text-center">
            {error}
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
              <CheckCircle2 className="h-7 w-7 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-xs text-emerald-900">Password Changed</h3>
              <p className="text-xs text-emerald-700">
                You can now sign in with your new password.
              </p>
            </div>

            <button
              type="button"
              onClick={onSuccessReset}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-indigo-600/20"
            >
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Reset Code
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter reset code"
                className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? "Updating..." : "Update Password"}
            </button>

            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full py-1 text-xs text-slate-500 hover:text-slate-800 text-center transition cursor-pointer"
            >
              Cancel and return to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
