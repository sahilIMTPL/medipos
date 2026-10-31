"use client";

import React from "react";
import AppLayout from "@/components/AppLayout";
import ShiftsManagementView from "@/components/shifts/ShiftsManagementView";

export default function ShiftsPage() {
  return (
    <AppLayout activeMenuId="shifts">
      <ShiftsManagementView />
    </AppLayout>
  );
}

