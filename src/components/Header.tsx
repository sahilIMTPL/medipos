"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Menu,
  Search,
  Bell,
  Store,
  ChevronDown,
  User,
  LogOut,
  Shield,
  ShieldCheck,
  ArrowRight,
  KeyRound,
  Check,
  CheckCheck,
  Users,
  Lock,
} from "lucide-react";

import { api } from "@/lib/api";
import { useStore } from "@/context/StoreContext";

interface HeaderProps {
  onToggleSidebar?: () => void;
  onLogout?: () => void;
  selectedStore?: string;
  onSelectStore?: (store: string) => void;
}

const LOCAL_READ_NOTIFICATIONS_KEY = "medipos_read_notifications";

export default function Header({
  onToggleSidebar,
  onLogout,
  selectedStore,
  onSelectStore,
}: HeaderProps) {
  const { stores, currentStore, setCurrentStore } = useStore();
  const [isStoreMenuOpen, setIsStoreMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifFilter, setNotifFilter] = useState<"ALL" | "UNREAD">("ALL");

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  const getLocalReadSet = (): Set<string> => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(LOCAL_READ_NOTIFICATIONS_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  };

  const saveLocalReadSet = (ids: Set<string>) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LOCAL_READ_NOTIFICATIONS_KEY, JSON.stringify(Array.from(ids)));
    } catch {}
  };

  const loadNotifications = () => {
    api.getNotifications(currentStore?.id)
      .then((res) => {
        if (res.success && Array.isArray(res.notifications)) {
          const localRead = getLocalReadSet();
          const merged = res.notifications.map((n: any) => ({
            ...n,
            isRead: Boolean(n.isRead || localRead.has(n.id)),
          }));
          setNotifications(merged);
          setUnreadCount(merged.filter((n: any) => !n.isRead).length);
        }
      })
      .catch((err) => console.log("Notifications fetch:", err));
  };

  React.useEffect(() => {
    setIsMounted(true);
    const user = api.getStoredUser();
    if (user) {
      setCurrentUser(user);
    }

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [currentStore?.id]);

  const handleMarkAllRead = async () => {
    const allIds = notifications.map((n) => n.id);
    const localRead = getLocalReadSet();
    allIds.forEach((id) => localRead.add(id));
    saveLocalReadSet(localRead);

    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      await api.markNotificationRead(undefined, true, allIds, currentStore?.id);
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  };

  const handleMarkSingleRead = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    const localRead = getLocalReadSet();
    localRead.add(id);
    saveLocalReadSet(localRead);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await api.markNotificationRead(id, false, [id], currentStore?.id);
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const isSuperAdmin = isMounted && currentUser?.role === "SUPER_ADMIN";
  const displayName = isSuperAdmin
    ? (currentUser?.fullName || "Super Admin")
    : (currentUser?.fullName || "Admin");
  const shortName = isSuperAdmin
    ? "Super Admin"
    : (currentUser?.fullName ? currentUser.fullName.split(" ")[0] : "Admin");
  const roleTitle = isSuperAdmin ? "Super Admin" : "Store Admin";
  const emailDisplay = currentUser?.email || (isSuperAdmin ? "superadmin@medipos.com" : "admin@citymedical.com");

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Left side: Hamburger + Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          aria-label="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search medicines or bills..."
            className="w-full pl-9 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-lg text-xs text-slate-800 placeholder-slate-400 transition outline-none"
          />
        </div>
      </div>

      {/* Right side: Notification + Store + Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg relative transition"
            aria-label="View notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center ring-2 ring-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-88 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 font-bold text-slate-900 border-b border-slate-100 flex justify-between items-center bg-slate-50/60 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <span>Notifications</span>
                  {unreadCount > 0 ? (
                    <span className="bg-rose-50 text-rose-600 text-[10px] font-black px-2 py-1 rounded-full border border-rose-200">
                      {unreadCount} new
                    </span>
                  ) : (
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      <span>All clear</span>
                    </span>
                  )}
                </div>
                {unreadCount > 0 ? (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer hover:underline flex items-center gap-1 transition"
                  >
                    <CheckCheck className="h-4 w-4" />
                    <span>Mark all read</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium">
                    All read
                  </span>
                )}
              </div>

              {/* Filter Tabs */}
              {notifications.length > 0 && (
                <div className="px-3 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setNotifFilter("ALL")}
                    className={`px-2 py-1 rounded-lg font-semibold transition cursor-pointer ${
                      notifFilter === "ALL"
                        ? "bg-white text-indigo-700 shadow-2xs font-bold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifFilter("UNREAD")}
                    className={`px-2 py-1 rounded-lg font-semibold transition cursor-pointer ${
                      notifFilter === "UNREAD"
                        ? "bg-white text-indigo-700 shadow-2xs font-bold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Unread ({unreadCount})
                  </button>
                </div>
              )}

              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto custom-scrollbar">
                {notifications.filter((n) => notifFilter === "ALL" || !n.isRead).length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 border border-emerald-100">
                      <Check className="h-5 w-5" />
                    </div>
                    <p className="font-bold text-slate-700 text-xs">All caught up</p>
                    <p className="text-[11px] mt-1 text-slate-400">
                      {notifFilter === "UNREAD" ? "No unread alerts" : "No pending expiry or stock warnings"}
                    </p>
                  </div>
                ) : (
                  notifications
                    .filter((n) => notifFilter === "ALL" || !n.isRead)
                    .map((n) => (
                      <div
                        key={n.id}
                        className={`block px-4 py-3 hover:bg-slate-50 transition group ${
                          !n.isRead ? "bg-indigo-50/25" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <Link
                            href={n.link}
                            onClick={() => {
                              handleMarkSingleRead(n.id);
                              setIsNotificationOpen(false);
                            }}
                            className="flex-1 min-w-0"
                          >
                            <p
                              className={`font-bold text-xs transition ${
                                n.severity === "CRITICAL"
                                  ? "text-rose-600 group-hover:text-rose-700"
                                  : n.severity === "WARNING"
                                  ? "text-amber-600 group-hover:text-amber-700"
                                  : "text-slate-800 group-hover:text-indigo-600"
                              }`}
                            >
                              {n.title}
                            </p>
                            <p className="text-slate-500 text-[11px] mt-1 line-clamp-2 leading-relaxed">
                              {n.description}
                            </p>
                          </Link>

                          <div className="flex items-center gap-1 flex-shrink-0 pt-1">
                            {!n.isRead ? (
                              <button
                                type="button"
                                onClick={(e) => handleMarkSingleRead(n.id, e)}
                                className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                                title="Click to mark as read"
                              >
                                <div className="w-3 h-3 rounded-full bg-indigo-600 ring-2 ring-indigo-200" />
                              </button>
                            ) : (
                              <span title="Read">
                                <Check className="h-4 w-4 text-slate-300" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Store Selector Dropdown or Fixed Single Store Badge for Store Admin */}
        {isMounted && currentUser?.role === "STORE_ADMIN" ? (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 font-medium shadow-2xs"
            title={`Assigned Branch: ${currentStore?.name || "Store"}`}
          >
            <Store className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline font-semibold">
              {currentStore?.name || selectedStore || "City Medical Store"}
            </span>
            <span className="hidden lg:flex items-center gap-1 text-[10px] bg-slate-200/80 text-slate-600 font-bold px-2 py-1 rounded">
              <Lock className="h-3 w-3" />
              <span>Assigned Branch</span>
            </span>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setIsStoreMenuOpen(!isStoreMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-xs text-slate-700 font-medium transition shadow-2xs"
              title={currentStore?.code ? `Store Code: ${currentStore.code}` : undefined}
            >
              <Store className="h-4 w-4 text-indigo-600" />
              <span className="hidden sm:inline font-semibold">
                {currentStore?.name || selectedStore || "City Medical Store"}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {isStoreMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                  <span>Stores</span>
                  <span className="text-[10px] text-indigo-600 font-bold">{stores.length} Active</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {stores.map((s) => {
                    const isCurrent = currentStore?.id === s.id || s.name === selectedStore;
                    const locationDisplay = s.city ? `${s.city}, ${s.state || "India"}` : (s.code || "Branch");
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          setCurrentStore(s);
                          onSelectStore && onSelectStore(s.name);
                          setIsStoreMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between transition ${
                          isCurrent ? "bg-indigo-50/40" : ""
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className={`font-semibold truncate ${isCurrent ? "text-indigo-900" : "text-slate-800"}`}>
                            {s.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">{locationDisplay}</p>
                        </div>
                        {isCurrent && (
                          <Check className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Launch Super Admin Portal for Super Admin */}
        {isSuperAdmin && (
          <Link
            href="/super-admin/dashboard"
            className="hidden md:flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs rounded-lg shadow-xs transition"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Super Admin Portal</span>
          </Link>
        )}

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 sm:px-2 py-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ring-1 ${
                isSuperAdmin
                  ? "bg-indigo-900 text-indigo-200 ring-indigo-500 shadow-xs"
                  : "bg-indigo-50 text-indigo-700 ring-indigo-200"
              }`}
            >
              {isSuperAdmin ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            <div className="text-left hidden sm:block leading-tight">
              <p className="text-xs font-bold text-slate-800">{shortName}</p>
              <p className="text-[10px] text-slate-500">{roleTitle}</p>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400 hidden sm:block" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-800">{displayName}</p>
                <p className="text-slate-400 text-[11px] truncate">{emailDisplay}</p>
                {isSuperAdmin ? (
                  <span className="inline-flex items-center gap-1 mt-1 bg-indigo-50 text-indigo-700 text-[10px] px-2 py-1 rounded font-bold border border-indigo-200">
                    <Shield className="h-3 w-3" />
                    <span>Super Admin Role</span>
                  </span>
                ) : (
                  <span className="inline-block mt-1 bg-emerald-50 text-emerald-700 text-[10px] px-2 py-1 rounded font-medium border border-emerald-200">
                    Store Admin Role
                  </span>
                )}
              </div>

              {isSuperAdmin && (
                <Link
                  href="/super-admin/dashboard"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full text-left px-3 py-2 bg-indigo-50 hover:bg-indigo-100 flex items-center justify-between text-indigo-700 font-bold border-b border-indigo-100 transition"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-indigo-600" />
                    <span>Super Admin Portal</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-indigo-600" />
                </Link>
              )}

              <Link
                href="/users"
                onClick={() => setIsUserMenuOpen(false)}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
              >
                <Users className="h-4 w-4 text-slate-400" />
                <span>Manage Store Staff</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  window.location.href = "/reset-password";
                  setIsUserMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
              >
                <KeyRound className="h-4 w-4 text-slate-400" />
                <span>Change Password</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  api.logout();
                  if (onLogout) {
                    onLogout();
                  } else {
                    window.location.href = "/login";
                  }
                  setIsUserMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 border-t border-slate-100 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span className="font-semibold">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
