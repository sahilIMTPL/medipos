"use client";

import React from "react";
import AppLayout from "@/components/AppLayout";
import PurchaseReturnsView from "@/components/PurchaseReturnsView";

export default function PurchaseReturnsPage() {
  return (
    <AppLayout activeMenuId="purchase-returns">
      <PurchaseReturnsView />
    </AppLayout>
  );
}
