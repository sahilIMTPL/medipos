"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import NewPurchaseView from "@/components/NewPurchaseView";

export default function NewPurchasePage() {
  const router = useRouter();

  return (
    <AppLayout activeMenuId="purchases">
      <NewPurchaseView
        onBackToHistory={() => router.push("/purchases")}
        onSuccess={() => router.push("/purchases")}
      />
    </AppLayout>
  );
}
