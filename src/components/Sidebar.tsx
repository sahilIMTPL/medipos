"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  RotateCcw,
  Pill,
  Grid,
  Truck,
  ShoppingBag,
  CornerUpLeft,
  Package,
  Calendar,
  Users,
  ClipboardList,
  BarChart2,
  Settings,
  Plus,
  QrCode,
  ChevronDown,
  ChevronRight,
  ScrollText,
  ShieldCheck,
  ArrowRight,
  Factory,
  Stethoscope,
  Landmark,
  Receipt,
  CreditCard,
  Banknote,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

interface SidebarProps {
  currentScreen?: string;
  onNavigate?: (screenName: string) => void;
  isCollapsed?: boolean;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  screenNumber?: number;
  badge?: string;
}

export interface MenuGroup {
  id: string;
  title: string;
  items: MenuItem[];
}

export const MENU_GROUPS: MenuGroup[] = [
  {
    id: "main",
    title: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/", icon: LayoutDashboard, screenNumber: 4 },
    ],
  },
  {
    id: "sales",
    title: "Sales & Billing",
    items: [
      { id: "pos", label: "New Sale (POS)", href: "/pos", icon: ShoppingCart, screenNumber: 5 },
      { id: "sales-history", label: "Sales History", href: "/sales-history", icon: FileText, screenNumber: 7 },
      { id: "sales-returns", label: "Sales Returns", href: "/sales-returns", icon: RotateCcw, screenNumber: 9 },
      { id: "shifts", label: "Cash Register Shifts", href: "/shifts", icon: Banknote, screenNumber: 8 },
    ],
  },
  {
    id: "catalog",
    title: "Medicines & Stock",
    items: [
      { id: "products", label: "Products", href: "/products", icon: Pill, screenNumber: 11 },
      { id: "inventory", label: "Inventory", href: "/inventory", icon: Package, screenNumber: 26 },
      { id: "batches-expiry", label: "Expiry Alerts", href: "/batches-expiry", icon: Calendar, screenNumber: 30 },
      { id: "categories", label: "Categories", href: "/categories", icon: Grid, screenNumber: 14 },
      { id: "manufacturers", label: "Manufacturers", href: "/manufacturers", icon: Factory, screenNumber: 15 },
      { id: "barcode-labels", label: "Barcodes", href: "/barcode-labels", icon: QrCode, screenNumber: 16 },
    ],
  },
  {
    id: "procurement",
    title: "Purchases & Vendors",
    items: [
      { id: "purchases", label: "Purchases", href: "/purchases", icon: ShoppingBag, screenNumber: 21 },
      { id: "purchase-returns", label: "Purchase Returns", href: "/purchase-returns", icon: CornerUpLeft, screenNumber: 25 },
      { id: "suppliers", label: "Suppliers", href: "/suppliers", icon: Truck, screenNumber: 17 },
    ],
  },
  {
    id: "patients",
    title: "Customers & Prescriptions",
    items: [
      { id: "customers", label: "Customers", href: "/customers", icon: Users, screenNumber: 34 },
      { id: "prescriptions", label: "Prescriptions", href: "/prescriptions", icon: ClipboardList, screenNumber: 36 },
    ],
  },
  {
    id: "finance",
    title: "Accounting & Finance",
    items: [
      { id: "invoices", label: "Invoices", href: "/invoices", icon: FileText, screenNumber: 41 },
      { id: "bills", label: "Bills", href: "/bills", icon: Receipt, screenNumber: 42 },
      { id: "payments", label: "Payments", href: "/payments", icon: CreditCard, screenNumber: 43 },
      { id: "accounting", label: "Accounting & Ledgers", href: "/accounting", icon: Landmark, screenNumber: 40 },
    ],
  },
  {
    id: "settings",
    title: "Settings & Administration",
    items: [
      { id: "users", label: "Staff & Roles", href: "/users", icon: Users, screenNumber: 46 },
      { id: "reports", label: "Reports", href: "/reports", icon: BarChart2, screenNumber: 37 },
      { id: "audit-logs", label: "Activity Logs", href: "/audit-logs", icon: ScrollText, screenNumber: 44 },
      { id: "store-settings", label: "Store Settings", href: "/store-settings", icon: Settings, screenNumber: 45 },
    ],
  },
];

export const MENU_ITEMS: MenuItem[] = MENU_GROUPS.flatMap((group) => group.items);

export default function Sidebar({
  currentScreen = "dashboard",
  onNavigate,
  isCollapsed = false,
}: SidebarProps) {
  // Track collapsed groups; all groups start open by default
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    const user = api.getStoredUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const isSuperAdmin = isMounted && currentUser?.role === "SUPER_ADMIN";

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <aside
      className={`bg-[#0b0f19] text-slate-300 flex flex-col h-screen sticky top-0 transition-all duration-200 z-30 select-none border-r border-[#182235] ${
        isCollapsed ? "w-16" : "w-64 min-w-[256px]"
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center px-4 border-b border-[#182235] gap-3 flex-shrink-0">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-950/40 flex-shrink-0">
          <Plus className="h-5 w-5 stroke-[3]" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col leading-tight overflow-hidden">
            <span className="font-bold text-white text-base tracking-tight flex items-center">
              MediPOS
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Medical Store & Pharmacy</span>
          </div>
        )}
      </div>

      {/* Super Admin Quick Launch Shortcut */}
      {isSuperAdmin && !isCollapsed && (
        <div className="px-2 pt-2 flex-shrink-0">
          <Link
            href="/super-admin/dashboard"
            className="flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-indigo-950/80 via-indigo-900/40 to-slate-900 border border-indigo-500/30 text-indigo-200 hover:text-white hover:border-indigo-400 transition group shadow-xs"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <span className="block text-xs font-bold text-white leading-tight">Super Admin Portal</span>
                <span className="block text-[10px] text-indigo-300">Multi-Store Platform</span>
              </div>
            </div>
            <ArrowRight className="h-3 w-3 text-indigo-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}

      {isSuperAdmin && isCollapsed && (
        <div className="p-2 flex justify-center flex-shrink-0">
          <Link
            href="/super-admin/dashboard"
            title="Super Admin Portal"
            className="p-2 rounded-lg bg-indigo-950 border border-indigo-500/40 text-indigo-400 hover:text-white transition"
          >
            <ShieldCheck className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Navigation Groups List */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-3 custom-sidebar-scroll">
        {MENU_GROUPS.filter((group) => {
          if (currentUser?.role === "DOCTOR") {
            return group.id === "main" || group.id === "patients";
          }
          return true;
        }).map((group, groupIdx) => {
          // Check if any item in this group is currently active
          const hasActiveChild = group.items.some((it) => it.id === currentScreen);
          // If group has active child, force it to be expanded
          const isGroupCollapsed = !hasActiveChild && !!collapsedGroups[group.id];

          return (
            <div key={group.id} className="space-y-1">
              {/* Group Heading */}
              {isCollapsed ? (
                groupIdx > 0 && <div className="my-2 border-t border-[#182235]" />
              ) : (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-2 pt-2 pb-1 text-[10px] font-bold tracking-wider uppercase text-slate-400 hover:text-slate-200 transition-colors group cursor-pointer"
                >
                  <span className="truncate">{group.title}</span>
                  <span className="text-slate-500 group-hover:text-slate-300 transition-transform">
                    {isGroupCollapsed ? (
                      <ChevronRight className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </span>
                </button>
              )}

              {/* Group Items */}
              {!isGroupCollapsed && (
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentScreen === item.id;

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => onNavigate && onNavigate(item.id)}
                        title={isCollapsed ? item.label : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                          isActive
                            ? "bg-indigo-600 text-white font-semibold shadow-xs shadow-indigo-950/30"
                            : "text-slate-400 hover:text-slate-100 hover:bg-[#131b2c]"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 flex-shrink-0 ${
                            isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                          }`}
                        />
                        {!isCollapsed && (
                          <div className="flex-1 flex items-center justify-between overflow-hidden">
                            <span className="truncate text-left">{item.label}</span>
                            {item.badge && (
                              <span
                                className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${
                                  isActive
                                    ? "bg-white/20 text-white"
                                    : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Store Version Badge */}
      {!isCollapsed && (
        <div className="p-3 border-t border-[#182235] text-[11px] text-slate-500 flex justify-between items-center flex-shrink-0">
          <span>MediPOS v1.0.4</span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] text-emerald-400 font-medium">Online</span>
          </span>
        </div>
      )}
    </aside>
  );
}
