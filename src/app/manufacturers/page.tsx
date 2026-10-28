"use client";

import React from "react";
import AppLayout from "@/components/AppLayout";
import ManufacturersView from "@/components/ManufacturersView";

export default function ManufacturersPage() {
  return (
    <AppLayout activeMenuId="manufacturers">
      <ManufacturersView />
    </AppLayout>
  );
}
