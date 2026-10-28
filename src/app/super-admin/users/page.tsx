"use client";

import React from "react";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import UsersManagementView from "@/components/UsersManagementView";

export default function SuperAdminUsersPage() {
  return (
    <SuperAdminLayout
      activeMenuId="users"
      title="User Accounts & Role-Based Access Control (RBAC)"
      subtitle="Manage platform users, multi-store administrators, store managers, and doctor accounts across all medical branches."
    >
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            User Accounts & Role-Based Access Control (RBAC)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage platform users, multi-store administrators, store managers, and doctor accounts across all medical branches.
          </p>
        </div>
        <UsersManagementView />
      </div>
    </SuperAdminLayout>
  );
}
