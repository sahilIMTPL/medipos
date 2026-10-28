"use client";

import React from "react";
import AppLayout from "@/components/AppLayout";
import BatchesExpiryView from "@/components/BatchesExpiryView";

export default function BatchesExpiryPage() {
  return (
    <AppLayout activeMenuId="batches-expiry">
      <BatchesExpiryView />
    </AppLayout>
  );
}
