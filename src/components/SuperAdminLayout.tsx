"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  LayoutDashboard,
  Building2,
  Pill,
  CreditCard,
  ShieldCheck,
  Users,
  ArrowLeftRight,
  ShieldAlert,
  BarChart3,
  Settings,
  ChevronRight,
  LogOut,
  ExternalLink,
  Store,
  Bell,
  Search,
  Activity,
  CheckCircle2,
  Menu,
  X,
  Lock,
} from "lucide-react";

interface SuperAdminLayoutProps {
  children: React.ReactNode;
  activeMenuId?: string;
  title?: string;
  subtitle?: string;
}

export default function SuperAdminLayout({
  children,
  activeMenuId,
  title = "Super Admin Platform",
  subtitle = "Executive Multi-Branch Pharmacy Governance & Network Operations",
}: SuperAdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const u = api.getStoredUser();
    if (u) {
      setCurrentUser(u);
    }
  }, []);

  const menuSections = [
    {
      title: "PLATFORM GOVERNANCE",
      items: [
        {
          id: "dashboard",
          label: "Global Dashboard",
          href: "/super-admin/dashboard",
          icon: LayoutDashboard,
          badge: "Live",
        },
        {
          id: "stores",
          label: "Store Branches",
          href: "/super-admin/stores",
          icon: Building2,
        },
        {
          id: "catalog",
          label: "Central Drug Master",
          href: "/super-admin/catalog",
          icon: Pill,
        },
        {
          id: "subscriptions",
          label: "SaaS Subscriptions",
          href: "/super-admin/subscriptions",
          icon: CreditCard,
        },
      ],
    },
    {
      title: "COMPLIANCE & OPERATIONS",
      items: [
        {
          id: "compliance",
          label: "Drug License Compliance",
          href: "/super-admin/compliance",
          icon: ShieldCheck,
        },
        {
          id: "users",
          label: "Staff & Access (RBAC)",
          href: "/super-admin/users",
          icon: Users,
        },
        {
          id: "transfers",
          label: "Inter-Store Transfers",
          href: "/super-admin/transfers",
          icon: ArrowLeftRight,
        },
        {
          id: "audit-logs",
          label: "Global Audit Ledger",
          href: "/super-admin/audit-logs",
          icon: ShieldAlert,
        },
      ],
    },
    {
      title: "EXECUTIVE INTELLIGENCE",
      items: [
        {
          id: "analytics",
          label: "Chain-Wide Analytics",
          href: "/super-admin/analytics",
          icon: BarChart3,
        },
        {
          id: "settings",
          label: "Platform & Backups",
          href: "/super-admin/settings",
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-800 font-sans">
      {/* Super Admin Executive Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#080c16] border-r border-[#151f33] text-slate-300 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Brand Header */}
          <div className="p-5 border-b border-[#151f33] flex items-center justify-between">
            <Link href="/super-admin/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-white text-base tracking-tight">MediPOS</span>
                  <span className="px-2 py-1 rounded text-[9px] font-black uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    Super Admin
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium block">
                  Enterprise Pharmacy Suite
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-6">
            {menuSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-300 block mb-2">
                  {section.title}
                </span>
                {section.items.map((item) => {
                  const isActive =
                    activeMenuId === item.id ||
                    pathname === item.href ||
                    (item.href !== "/super-admin/dashboard" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition group cursor-pointer ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/40"
                          : "text-slate-400 hover:text-white hover:bg-[#121a2d]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`h-4 w-4 ${
                            isActive
                              ? "text-white"
                              : "text-slate-300 group-hover:text-indigo-400"
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-1 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Sidebar Footer: Return to Store POS & Admin Profile */}
          <div className="p-4 border-t border-[#151f33] space-y-3 bg-[#060911]">
            <Link
              href="/pos"
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#121a2d] hover:bg-indigo-900/40 border border-[#1f2c4a] text-slate-300 hover:text-white text-xs font-bold transition group"
            >
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-indigo-400" />
                <span>Switch to Store POS</span>
              </div>
              <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-white" />
            </Link>

            <div className="flex items-center justify-between px-2 pt-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center text-xs">
                  {isMounted && currentUser?.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : "SA"}
                </div>
                <div>
                  <span className="text-white font-bold block text-xs truncate max-w-[110px]">
                    {isMounted && currentUser?.fullName ? currentUser.fullName : "Super Admin"}
                  </span>
                  <span className="text-[10px] text-slate-300 block truncate max-w-[110px]">
                    {isMounted && currentUser?.email ? currentUser.email : "Platform Root"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  api.logout();
                  router.push("/login");
                }}
                title="Sign Out"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Executive Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">{title}</h1>
                <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  <span>Network Operational</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Switch to Branch POS */}
            <Link
              href="/pos"
              className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              <Store className="h-4 w-4 text-indigo-600" />
              <span>Launch POS Billing</span>
            </Link>

            {/* Quick Switch to Store Admin Dashboard */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition"
            >
              <Building2 className="h-4 w-4" />
              <span>Store Dashboard</span>
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
