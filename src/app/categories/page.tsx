"use client";

import React from "react";
import AppLayout from "@/components/AppLayout";
import CategoriesView from "@/components/CategoriesView";

export default function CategoriesPage() {
  return (
    <AppLayout activeMenuId="categories">
      <CategoriesView />
    </AppLayout>
  );
}
