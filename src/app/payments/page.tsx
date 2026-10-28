"use client";

import React from "react";
import AppLayout from "@/components/AppLayout";
import PaymentsListView from "@/components/PaymentsListView";

export default function PaymentsPage() {
  return (
    <AppLayout activeMenuId="payments">
      <PaymentsListView />
    </AppLayout>
  );
}
