"use client";

import React, { useState } from "react";
import { Plus, Mail, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

interface ForgotPasswordViewProps {
  onBackToLogin: () => void;
  onProceedToReset: (email: string) => void;
}

export default function ForgotPasswordView({
  onBackToLogin,
  onProceedToReset,
}: ForgotPasswordViewProps) {
  const [email, setEmail] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await api.forgotPassword(email);
      setIsSent(true);
    } catch (err) {
      setIsSent(true);
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
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Forgot Password</h1>
          <p className="text-xs text-slate-500">
            Enter your email to receive a password reset link
          </p>
        </div>

        {isSent ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
              <CheckCircle2 className="h-7 w-7 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-xs text-emerald-900">Link Sent</h3>
              <p className="text-xs text-emerald-700">
                Instructions have been sent to <strong>{email}</strong>.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => onProceedToReset(email)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-indigo-600/20"
              >
                <span>Reset Password</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onBackToLogin}
                className="w-full py-2 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>

            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Sign In</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
