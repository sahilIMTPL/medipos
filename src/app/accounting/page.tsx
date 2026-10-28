"use client";

import React from "react";
import AppLayout from "@/components/AppLayout";
import { AccountingView } from "@/components/AccountingView";

export default function AccountingPage() {
  return (
    <AppLayout activeMenuId="accounting">
      <AccountingView />
    </AppLayout>
  );
}
