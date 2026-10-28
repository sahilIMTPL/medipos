"use client";

import React from "react";
import ShimmerSkeleton from "./ShimmerSkeleton";

export interface CardSkeletonProps {
  count?: number;
  variant?: "stat" | "entity" | "compact";
  className?: string;
}

export default function CardSkeleton({
  count = 4,
  variant = "stat",
  className = "",
}: CardSkeletonProps) {
  const cards = Array.from({ length: count });

  if (variant === "compact") {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
        {cards.map((_, idx) => (
          <div
            key={`card-skeleton-${idx}`}
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <ShimmerSkeleton variant="rectangular" className="h-4 w-24 rounded-md" />
              <ShimmerSkeleton variant="circular" className="w-8 h-8 rounded-xl" />
            </div>
            <ShimmerSkeleton variant="rectangular" className="h-7 w-32 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "entity") {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {cards.map((_, idx) => (
          <div
            key={`entity-skeleton-${idx}`}
            className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <ShimmerSkeleton variant="rectangular" className="w-12 h-12 rounded-2xl" />
                <div className="space-y-2">
                  <ShimmerSkeleton variant="rectangular" className="h-4 w-32 rounded-md" />
                  <ShimmerSkeleton variant="rectangular" subtle className="h-3 w-20 rounded-md" />
                </div>
              </div>
              <ShimmerSkeleton variant="pill" className="w-16 h-6 rounded-full" />
            </div>
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <ShimmerSkeleton variant="rectangular" subtle className="h-3 w-full rounded-md" />
              <ShimmerSkeleton variant="rectangular" subtle className="h-3 w-3/4 rounded-md" />
            </div>
            <div className="flex justify-between items-center pt-2">
              <ShimmerSkeleton variant="rectangular" className="h-5 w-20 rounded-md" />
              <ShimmerSkeleton variant="rectangular" className="h-8 w-24 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default "stat" KPI cards
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {cards.map((_, idx) => (
        <div
          key={`stat-skeleton-${idx}`}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <ShimmerSkeleton variant="rectangular" className="h-4 w-28 rounded-md" />
            <ShimmerSkeleton variant="rectangular" className="w-10 h-10 rounded-xl" />
          </div>
          <div className="space-y-1">
            <ShimmerSkeleton variant="rectangular" className="h-8 w-36 rounded-lg" />
            <ShimmerSkeleton variant="rectangular" subtle className="h-3 w-24 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

