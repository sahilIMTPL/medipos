"use client";

import React from "react";
import AppLayout from "@/components/AppLayout";
import SuppliersView from "@/components/SuppliersView";

export default function SuppliersPage() {
  return (
    <AppLayout activeMenuId="suppliers">
      <SuppliersView />
    </AppLayout>
  );
}
