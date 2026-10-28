"use client";

import React from "react";
import { FolderSearch, LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon = FolderSearch,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`p-12 text-center flex flex-col items-center justify-center space-y-3 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200 shadow-2xs">
        <Icon className="w-7 h-7" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

