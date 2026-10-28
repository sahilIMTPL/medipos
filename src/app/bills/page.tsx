"use client";

import React from "react";
import AppLayout from "@/components/AppLayout";
import BillsListView from "@/components/BillsListView";

export default function BillsPage() {
  return (
    <AppLayout activeMenuId="bills">
      <BillsListView />
    </AppLayout>
  );
}
