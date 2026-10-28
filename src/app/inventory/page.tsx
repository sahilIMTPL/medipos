"use client";

import React from "react";
import AppLayout from "@/components/AppLayout";
import StockLedgerView from "@/components/StockLedgerView";

export default function InventoryPage() {
  return (
    <AppLayout activeMenuId="inventory">
      <StockLedgerView />
    </AppLayout>
  );
}
