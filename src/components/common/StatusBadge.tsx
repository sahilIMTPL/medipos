"use client";

import React from "react";

export type StatusType =
  | "PAID"
  | "FULLY_PAID"
  | "PARTIAL"
  | "PARTIALLY_PAID"
  | "UNPAID"
  | "ACTIVE"
  | "EXPIRED"
  | "NEAR_EXPIRY"
  | "VOID"
  | "CANCELLED"
  | "PENDING"
  | "CUSTOMER"
  | "VENDOR"
  | string;

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  dot?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function StatusBadge({
  status,
  label,
  dot = true,
  size = "md",
  className = "",
}: StatusBadgeProps) {
  const normalized = (status || "").toUpperCase().replace(/[\s-]/g, "_");

  let colorClasses = "bg-slate-100 text-slate-700 border-slate-200";
  let dotColor = "bg-slate-400";
  let displayLabel = label || status;

  switch (normalized) {
    case "PAID":
    case "FULLY_PAID":
    case "SETTLED":
    case "ACTIVE":
      colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      dotColor = "bg-emerald-500";
      if (!label) displayLabel = normalized === "ACTIVE" ? "Active" : "Fully Paid";
      break;

    case "PARTIAL":
    case "PARTIALLY_PAID":
    case "NEAR_EXPIRY":
      colorClasses = "bg-amber-50 text-amber-700 border-amber-200/80";
      dotColor = "bg-amber-500";
      if (!label) displayLabel = normalized === "NEAR_EXPIRY" ? "Near Expiry" : "Partially Paid";
      break;

    case "UNPAID":
    case "OVERDUE":
    case "EXPIRED":
    case "VOID":
    case "CANCELLED":
      colorClasses = "bg-rose-50 text-rose-700 border-rose-200/80";
      dotColor = "bg-rose-500";
      if (!label) {
        if (normalized === "EXPIRED") displayLabel = "Expired";
        else if (normalized === "VOID") displayLabel = "Void";
        else displayLabel = "Unpaid";
      }
      break;

    case "PENDING":
    case "PROCESSING":
      colorClasses = "bg-blue-50 text-blue-700 border-blue-200/80";
      dotColor = "bg-blue-500";
      if (!label) displayLabel = "Pending";
      break;

    case "CUSTOMER":
      colorClasses = "bg-indigo-50 text-indigo-700 border-indigo-200/80";
      dotColor = "bg-indigo-500";
      if (!label) displayLabel = "Customer Receipt";
      break;

    case "VENDOR":
      colorClasses = "bg-teal-50 text-teal-700 border-teal-200/80";
      dotColor = "bg-teal-500";
      if (!label) displayLabel = "Vendor Disbursement";
      break;

    default:
      colorClasses = "bg-slate-50 text-slate-700 border-slate-200";
      dotColor = "bg-slate-400";
      break;
  }

  const sizeClasses =
    size === "sm"
      ? "text-[10px] px-2 py-1"
      : size === "lg"
      ? "text-sm px-4 py-2"
      : "text-xs px-3 py-1";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-semibold border ${colorClasses} ${sizeClasses} ${className}`}
    >
      {dot && <span className={`w-2 h-2 rounded-full ${dotColor}`} />}
      <span>{displayLabel}</span>
    </span>
  );
}

