"use client";

import React from "react";
import AppLayout from "@/components/AppLayout";
import SalesReturnsView from "@/components/SalesReturnsView";

export default function SalesReturnsPage() {
  return (
    <AppLayout activeMenuId="sales-returns">
      <SalesReturnsView />
    </AppLayout>
  );
}
