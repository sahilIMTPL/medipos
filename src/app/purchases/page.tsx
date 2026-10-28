"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import PurchasesHistoryView from "@/components/PurchasesHistoryView";

export default function PurchasesPage() {
  const router = useRouter();

  return (
    <AppLayout activeMenuId="purchases">
      <PurchasesHistoryView onNavigateToNewPurchase={() => router.push("/purchases/new")} />
    </AppLayout>
  );
}
