"use client";

import React from "react";
import ShimmerSkeleton from "./ShimmerSkeleton";

export interface TableSkeletonProps {
  columns: number;
  rows?: number;
  columnWidths?: string[];
  hasActions?: boolean;
}

export default function TableSkeleton({
  columns,
  rows = 5,
  columnWidths = [],
  hasActions = true,
}: TableSkeletonProps) {
  // Array of varied widths to simulate realistic data shapes
  const defaultWidths = [
    "w-10",
    "w-36",
    "w-28",
    "w-24",
    "w-20",
    "w-32",
    "w-16",
    "w-24",
    "w-20",
    "w-28",
  ];

  const rowList = Array.from({ length: rows });
  const colList = Array.from({ length: columns });

  return (
    <>
      {rowList.map((_, rowIdx) => (
        <tr
          key={`skeleton-row-${rowIdx}`}
          className="border-b border-slate-100 hover:bg-slate-50/40 transition"
        >
          {colList.map((__, colIdx) => {
            const isLastCol = colIdx === columns - 1;
            const isFirstCol = colIdx === 0;

            if (isLastCol && hasActions) {
              return (
                <td key={`skeleton-col-${colIdx}`} className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <ShimmerSkeleton variant="rectangular" className="w-16 h-7 rounded-lg" />
                    <ShimmerSkeleton variant="rectangular" className="w-7 h-7 rounded-lg" />
                  </div>
                </td>
              );
            }

            const widthClass =
              columnWidths[colIdx] ||
              (isFirstCol
                ? "w-8"
                : defaultWidths[colIdx % defaultWidths.length] || "w-24");

            return (
              <td key={`skeleton-col-${colIdx}`} className="py-4 px-4">
                <div className="flex flex-col gap-1">
                  <ShimmerSkeleton
                    variant="rectangular"
                    className={`h-4 rounded-md ${widthClass}`}
                  />
                  {/* For certain key columns like name/product, simulate secondary text */}
                  {(colIdx === 1 || colIdx === 2) && rowIdx % 2 === 0 && (
                    <ShimmerSkeleton
                      variant="rectangular"
                      subtle
                      className="h-3 w-20 rounded-md mt-1"
                    />
                  )}
                </div>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

