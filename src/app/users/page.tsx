"use client";

import React from "react";
import AppLayout from "@/components/AppLayout";
import UsersManagementView from "@/components/UsersManagementView";

export default function UsersPage() {
  return (
    <AppLayout activeMenuId="users">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Store Staff & User Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your store branch team, assign doctors, and configure staff access permissions.
          </p>
        </div>
        <UsersManagementView />
      </div>
    </AppLayout>
  );
}
