"use client";

import React from "react";
import AppLayout from "@/components/AppLayout";
import InvoicesListView from "@/components/InvoicesListView";

export default function InvoicesPage() {
  return (
    <AppLayout activeMenuId="invoices">
      <InvoicesListView />
    </AppLayout>
  );
}
