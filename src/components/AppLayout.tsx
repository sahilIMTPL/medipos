"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { api } from "@/lib/api";

interface AppLayoutProps {
  children: React.ReactNode;
  activeMenuId?: string;
}

export default function AppLayout({ children, activeMenuId }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Determine active menu item from pathname if activeMenuId is not passed
  const currentScreen =
    activeMenuId ||
    (() => {
      if (!pathname || pathname === "/" || pathname === "/dashboard") return "dashboard";
      const segment = pathname.split("/")[1];
      return segment || "dashboard";
    })();

  const handleNavigate = (menuId: string) => {
    if (menuId === "dashboard") {
      router.push("/");
    } else {
      router.push(`/${menuId}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        isCollapsed={isSidebarCollapsed}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onLogout={() => {
            api.logout();
            router.push("/login");
          }}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
