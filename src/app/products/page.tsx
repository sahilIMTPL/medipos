"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import ProductsView from "@/components/ProductsView";

export default function ProductsPage() {
  const router = useRouter();

  return (
    <AppLayout activeMenuId="products">
      <ProductsView onNavigateToUnits={() => router.push("/units")} />
    </AppLayout>
  );
}
