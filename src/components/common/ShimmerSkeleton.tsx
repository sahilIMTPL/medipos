"use client";

import React from "react";

export interface ShimmerSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "rectangular" | "circular" | "pill";
  width?: string | number;
  height?: string | number;
  subtle?: boolean;
}

export default function ShimmerSkeleton({
  variant = "rectangular",
  width,
  height,
  subtle = false,
  className = "",
  style,
  ...props
}: ShimmerSkeletonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "circular":
        return "rounded-full";
      case "pill":
        return "rounded-full";
      case "text":
        return "rounded-md h-4 my-1";
      case "rectangular":
      default:
        return "rounded-xl";
    }
  };

  const shimmerClass = subtle ? "animate-shimmer-subtle" : "animate-shimmer";

  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden select-none ${shimmerClass} ${getVariantStyles()} ${className}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      {...props}
    />
  );
}

