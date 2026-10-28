"use client";

import React from "react";
import AppLayout from "@/components/AppLayout";
import PosBillingView from "@/components/PosBillingView";

export default function PosPage() {
  return (
    <AppLayout activeMenuId="pos">
      <PosBillingView />
    </AppLayout>
  );
}
