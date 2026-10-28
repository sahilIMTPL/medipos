"use client";

import React from "react";
import ShimmerSkeleton from "./ShimmerSkeleton";

export default function ModalDetailSkeleton() {
  return (
    <div className="p-6 space-y-4 animate-in fade-in duration-200">
      {/* ROW 1: 2 Entity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-start gap-4">
          <ShimmerSkeleton variant="rectangular" className="w-12 h-12 rounded-2xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <ShimmerSkeleton variant="rectangular" className="h-3 w-28 rounded-md" />
            <ShimmerSkeleton variant="rectangular" className="h-5 w-44 rounded-md" />
            <ShimmerSkeleton variant="rectangular" subtle className="h-3 w-56 rounded-md" />
            <div className="flex gap-2 pt-1">
              <ShimmerSkeleton variant="rectangular" className="h-6 w-32 rounded-lg" />
              <ShimmerSkeleton variant="rectangular" className="h-6 w-32 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-start gap-4">
          <ShimmerSkeleton variant="rectangular" className="w-12 h-12 rounded-2xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <ShimmerSkeleton variant="rectangular" className="h-3 w-28 rounded-md" />
            <ShimmerSkeleton variant="rectangular" className="h-5 w-48 rounded-md" />
            <ShimmerSkeleton variant="rectangular" subtle className="h-3 w-40 rounded-md" />
            <div className="flex gap-2 pt-1">
              <ShimmerSkeleton variant="rectangular" className="h-6 w-40 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: 4-Column Metadata Strip */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`meta-skel-${idx}`} className="space-y-2">
              <ShimmerSkeleton variant="rectangular" className="h-3 w-20 rounded-md" />
              <ShimmerSkeleton variant="rectangular" className="h-5 w-28 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* ROW 3: Table Placeholder */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <ShimmerSkeleton variant="rectangular" className="h-4 w-32 rounded-md" />
          <ShimmerSkeleton variant="rectangular" className="h-4 w-20 rounded-md" />
        </div>
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={`table-skel-row-${idx}`} className="flex items-center justify-between py-2 border-b border-slate-50">
            <div className="space-y-1">
              <ShimmerSkeleton variant="rectangular" className="h-4 w-48 rounded-md" />
              <ShimmerSkeleton variant="rectangular" subtle className="h-3 w-24 rounded-md" />
            </div>
            <div className="flex items-center gap-6">
              <ShimmerSkeleton variant="rectangular" className="h-4 w-16 rounded-md" />
              <ShimmerSkeleton variant="rectangular" className="h-4 w-20 rounded-md" />
              <ShimmerSkeleton variant="rectangular" className="h-4 w-24 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* ROW 4: Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <ShimmerSkeleton variant="rectangular" className="h-4 w-36 rounded-md" />
          <ShimmerSkeleton variant="rectangular" className="h-4 w-full rounded-md" />
          <ShimmerSkeleton variant="rectangular" className="h-4 w-full rounded-md" />
          <ShimmerSkeleton variant="rectangular" className="h-10 w-full rounded-xl" />
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <ShimmerSkeleton variant="rectangular" className="h-4 w-28 rounded-md" />
          <ShimmerSkeleton variant="rectangular" className="h-4 w-full rounded-md" />
          <ShimmerSkeleton variant="rectangular" className="h-4 w-full rounded-md" />
          <ShimmerSkeleton variant="rectangular" className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

