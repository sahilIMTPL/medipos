"use client";

import React from "react";
import AppLayout from "@/components/AppLayout";
import DashboardView from "@/components/DashboardView";

export default function HomePage() {
  return (
    <AppLayout activeMenuId="dashboard">
      <DashboardView />
    </AppLayout>
  );
}
