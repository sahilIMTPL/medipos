"use client";

import React from "react";
import AppLayout from "@/components/AppLayout";
import UnitsView from "@/components/UnitsView";

export default function UnitsPage() {
  return (
    <AppLayout activeMenuId="units">
      <UnitsView />
    </AppLayout>
  );
}
