"use client";

import React from "react";
import { AlertTriangle, AlertCircle, Info, X, Loader2 } from "lucide-react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getIconAndColors = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <AlertCircle className="w-6 h-6 text-rose-600" />,
          iconBg: "bg-rose-50 border-rose-200",
          buttonBg: "bg-rose-600 hover:bg-rose-700 text-white",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
          iconBg: "bg-amber-50 border-amber-200",
          buttonBg: "bg-amber-600 hover:bg-amber-700 text-white",
        };
      case "info":
      default:
        return {
          icon: <Info className="w-6 h-6 text-indigo-600" />,
          iconBg: "bg-indigo-50 border-indigo-200",
          buttonBg: "bg-indigo-600 hover:bg-indigo-700 text-white",
        };
    }
  };

  const { icon, iconBg, buttonBg } = getIconAndColors();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${iconBg} flex-shrink-0`}
            >
              {icon}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500 mt-1">{message}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50 ${buttonBg}`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

