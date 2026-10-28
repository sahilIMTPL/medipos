"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface StoreInfo {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  drugLicenseNo?: string;
  productCount?: number;
  batchCount?: number;
  salesCount?: number;
  settings?: any;
}

interface StoreContextType {
  stores: StoreInfo[];
  currentStore: StoreInfo | null;
  setCurrentStore: (store: StoreInfo) => void;
  isLoading: boolean;
  refreshStores: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType>({
  stores: [],
  currentStore: null,
  setCurrentStore: () => {},
  isLoading: true,
  refreshStores: async () => {},
});

export const STORE_STORAGE_KEY = "medipos_current_store";
export const STORE_ID_KEY = "medipos_store_id";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [currentStore, setCurrentStoreState] = useState<StoreInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setCurrentStore = useCallback((store: StoreInfo) => {
    setCurrentStoreState(store);
    try {
      localStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(store));
      localStorage.setItem(STORE_ID_KEY, store.id);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("medipos:store-changed", { detail: store }));
      }
    } catch (e) {
      console.error("Failed to persist active store to localStorage:", e);
    }
  }, []);

  const refreshStores = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.getStores();
      if (res.success && Array.isArray(res.stores) && res.stores.length > 0) {
        const fetchedStores: StoreInfo[] = res.stores;
        setStores(fetchedStores);

        // Check if there is already a saved store in localStorage
        let savedStore: StoreInfo | null = null;
        try {
          const raw = localStorage.getItem(STORE_STORAGE_KEY);
          if (raw) savedStore = JSON.parse(raw);
        } catch { }

        if (savedStore && fetchedStores.some((s) => s.id === savedStore?.id)) {
          const matched = fetchedStores.find((s) => s.id === savedStore?.id)!;
          setCurrentStoreState(matched);
          try {
            localStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(matched));
            localStorage.setItem(STORE_ID_KEY, matched.id);
          } catch { }
        } else {
          // Default to first active store
          setCurrentStoreState(fetchedStores[0]);
          try {
            localStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(fetchedStores[0]));
            localStorage.setItem(STORE_ID_KEY, fetchedStores[0].id);
          } catch { }
        }
      }
    } catch (err) {
      console.error("Failed to load stores from API:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial optimistic hydrate from localStorage if available
    try {
      const raw = localStorage.getItem(STORE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setCurrentStoreState(parsed);
        if (parsed?.id) {
          localStorage.setItem(STORE_ID_KEY, parsed.id);
        }
      }
    } catch { }

    refreshStores();
  }, [refreshStores]);

  return (
    <StoreContext.Provider
      value={{
        stores,
        currentStore,
        setCurrentStore,
        isLoading,
        refreshStores,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
