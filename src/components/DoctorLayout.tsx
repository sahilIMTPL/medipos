"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  LayoutDashboard,
  Users,
  FileText,
  UserCheck,
  Pill,
  Menu,
  Search,
  Bell,
  Store,
  ChevronDown,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  User,
  Plus,
} from "lucide-react";
import { doctorApi, DoctorAuthUser } from "@/lib/api/doctor.api";
import { useStore } from "@/context/StoreContext";

export type DoctorScreenId =
  | "consultation"
  | "dashboard"
  | "patients"
  | "prescriptions"
  | "doctor-details"
  | "formulary";

interface DoctorLayoutProps {
  children: React.ReactNode;
  activeScreen: DoctorScreenId;
  onNavigate: (screen: DoctorScreenId) => void;
  doctor: DoctorAuthUser | null;
  onGlobalSearch?: (query: string) => void;
}

interface NavItem {
  id: DoctorScreenId;
  label: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

export default function DoctorLayout({
  children,
  activeScreen,
  onNavigate,
  doctor,
  onGlobalSearch,
}: DoctorLayoutProps) {
  const router = useRouter();
  const { stores, currentStore, setCurrentStore } = useStore();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [isStoreMenuOpen, setIsStoreMenuOpen] = useState(false);
  const [isDoctorMenuOpen, setIsDoctorMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [doctorStores, setDoctorStores] = useState<Array<{ id: string; name: string; city: string }>>([]);

  useEffect(() => {
    doctorApi
      .getDoctorStores()
      .then((res) => {
        if (res.success && res.stores) {
          setDoctorStores(res.stores);
        }
      })
      .catch(() => {});
  }, []);

  const NAV_GROUPS: NavGroup[] = [
    {
      id: "clinical",
      title: "Clinical Workspace",
      items: [
        {
          id: "consultation",
          label: "OPD Consultation & Rx",
          icon: Stethoscope,
          badge: "Live",
          badgeColor: "bg-emerald-500",
        },
        {
          id: "dashboard",
          label: "Doctor Dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      id: "records",
      title: "Patients & Records",
      items: [
        {
          id: "patients",
          label: "Patients History",
          icon: Users,
          badge: "Dossier",
          badgeColor: "bg-blue-500",
        },
        {
          id: "prescriptions",
          label: "Prescription History",
          icon: FileText,
          badge: "eRx",
          badgeColor: "bg-indigo-500",
        },
      ],
    },
    {
      id: "doctor",
      title: "Doctor & Clinic",
      items: [
        {
          id: "doctor-details",
          label: "Doctor Details",
          icon: UserCheck,
        },
        {
          id: "formulary",
          label: "Pharmacy Formulary",
          icon: Pill,
          badge: "FEFO",
          badgeColor: "bg-teal-500",
        },
      ],
    },
  ];

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleSignOut = () => {
    doctorApi.clearDoctorSession();
    router.push("/doctor/login");
  };

  const activeStoreName = doctor?.storeName || currentStore?.name || "City Medical Store";

  return (
    <div className="flex min-h-screen bg-[#f1f4f9] font-sans selection:bg-indigo-600 selection:text-white">
      {/* ================= LEFT SIDEBAR (EXACT POS PORTAL STYLING) ================= */}
      <aside
        className={`bg-[#0b0f19] text-slate-300 flex flex-col h-screen sticky top-0 transition-all duration-200 z-30 select-none border-r border-[#182235] ${
          isCollapsed ? "w-16" : "w-64 min-w-[256px]"
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center px-4 border-b border-[#182235] gap-3 flex-shrink-0">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-950/40 flex-shrink-0">
            <Stethoscope className="h-5 w-5 stroke-2" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col leading-tight overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-tight">MediPOS</span>
                <span className="px-2 py-1 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Doctor OPD
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Clinical Consultation Suite</span>
            </div>
          )}
        </div>

        {/* Doctor Identity Strip in Sidebar */}
        {!isCollapsed && doctor && (
          <div className="px-3 pt-3 flex-shrink-0">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30 shrink-0">
                DR
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{doctor.name}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{doctor.mciNumber}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Groups List */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-3 custom-sidebar-scroll">
          {NAV_GROUPS.map((group, groupIdx) => {
            const hasActiveChild = group.items.some((it) => it.id === activeScreen);
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
                      const isActive = activeScreen === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onNavigate(item.id)}
                          title={isCollapsed ? item.label : undefined}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
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
                                  className={`text-[9px] font-bold px-2 py-1 rounded-full text-white ${
                                    item.badgeColor || "bg-indigo-500"
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer: Connected Pharmacy + Sign Out */}
        <div className="p-3 border-t border-[#182235] flex-shrink-0 space-y-2">
          {!isCollapsed && (
            <div className="px-2 py-2 rounded-lg bg-[#131b2c] border border-slate-800 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span className="text-slate-300 truncate">{activeStoreName}</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold shrink-0">Connected</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleSignOut}
            title="Sign Out of Doctor OPD Portal"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 text-xs font-semibold transition cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ================= RIGHT WORKSPACE ================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ================= TOP HEADER (EXACT POS PORTAL STYLING) ================= */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          {/* Left: Sidebar Toggle + Global Search */}
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
              title="Toggle Sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="relative flex-1 hidden sm:flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (onGlobalSearch) onGlobalSearch(e.target.value);
                }}
                placeholder="Search patient records, diagnoses, prescription archive (F2)..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
              />
            </div>
          </div>

          {/* Right: Connected Pharmacy Store Switcher + Notifications + Doctor Profile */}
          <div className="flex items-center gap-3">
            {/* Pharmacy Store Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsStoreMenuOpen(!isStoreMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                <Store className="h-4 w-4 text-indigo-600" />
                <span className="hidden md:inline max-w-[150px] truncate">{activeStoreName}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>

              {isStoreMenuOpen && doctorStores.length > 0 && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-30 animate-in fade-in duration-100 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100 font-bold text-slate-500 text-[11px]">
                    Switch Pharmacy Store Formulary
                  </div>
                  {doctorStores.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        if (doctor) {
                          const updated = { ...doctor, storeId: st.id, storeName: st.name };
                          localStorage.setItem("medcare_doctor_session", JSON.stringify(updated));
                        }
                        if (setCurrentStore) {
                          setCurrentStore({ id: st.id, name: st.name } as any);
                        }
                        setIsStoreMenuOpen(false);
                        window.location.reload();
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-slate-50 flex items-center justify-between transition cursor-pointer"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{st.name}</p>
                        <p className="text-[10px] text-slate-500">{st.city}</p>
                      </div>
                      {st.id === doctor?.storeId && (
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                          Active
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 relative transition cursor-pointer"
                title="Clinical & Dispensing Alerts"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500"></span>
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-30 animate-in fade-in duration-100 text-xs space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-900">OPD & Dispensing Alerts</span>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                      Bridge Active
                    </span>
                  </div>
                  <div className="space-y-2 pt-1 max-h-60 overflow-y-auto">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="font-semibold text-slate-800">Prescriptions Beamed to Counter</p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Connected Pharmacy POS is automatically receiving all digital Rx in real-time.
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50/50 border border-emerald-100">
                      <p className="font-semibold text-emerald-900">Live FEFO Stock Synchronization</p>
                      <p className="text-[10px] text-emerald-700 mt-1">
                        Catalog batches and inventory updated from pharmacy ledger.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Doctor Profile Pill & Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDoctorMenuOpen(!isDoctorMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  DR
                </div>
                <div className="text-left hidden lg:block leading-tight">
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {doctor?.name || "Dr. Rajesh Sharma, MD"}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {doctor?.specialization || "Consultant Physician"}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>

              {isDoctorMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-30 animate-in fade-in duration-100 text-xs space-y-1">
                  <div className="p-3 border-b border-slate-100">
                    <p className="font-bold text-slate-900">{doctor?.name || "Dr. Rajesh Sharma, MD"}</p>
                    <p className="text-[11px] text-slate-500">{doctor?.email}</p>
                    <p className="text-[10px] font-mono text-indigo-600 mt-1">
                      Reg: {doctor?.mciNumber || "MCI-48291/2012"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigate("doctor-details");
                      setIsDoctorMenuOpen(false);
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2 transition cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span>My Doctor Profile & Credentials</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigate("dashboard");
                      setIsDoctorMenuOpen(false);
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2 transition cursor-pointer"
                  >
                    <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                    <span>Doctor Dashboard</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full text-left p-2 rounded-xl hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2 transition cursor-pointer border-t border-slate-100 mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
