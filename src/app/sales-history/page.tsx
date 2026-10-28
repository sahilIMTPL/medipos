"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import SalesHistoryView from "@/components/SalesHistoryView";

export default function SalesHistoryPage() {
  const router = useRouter();

  return (
    <AppLayout activeMenuId="sales-history">
      <SalesHistoryView onNavigateToPos={() => router.push("/pos")} />
    </AppLayout>
  );
}
