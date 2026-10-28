"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import BarcodeCenterView from "@/components/BarcodeCenterView";

export default function BarcodeLabelsPage() {
  const router = useRouter();

  return (
    <AppLayout activeMenuId="barcode-labels">
      <BarcodeCenterView
        onNavigateToPos={() => router.push("/pos")}
        onNavigateToInventory={() => router.push("/inventory")}
      />
    </AppLayout>
  );
}
