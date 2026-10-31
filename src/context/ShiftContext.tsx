"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, ShiftSummary } from "@/lib/api";
import { useStore } from "./StoreContext";

interface ShiftContextType {
  currentShift: ShiftSummary | null;
  isLoading: boolean;
  refreshShift: () => Promise<void>;
  isShiftOpen: boolean;
  isOpenShiftModalOpen: boolean;
  setIsOpenShiftModalOpen: (open: boolean) => void;
  isCloseShiftModalOpen: boolean;
  setIsCloseShiftModalOpen: (open: boolean) => void;
  isCashMovementModalOpen: boolean;
  setIsCashMovementModalOpen: (open: boolean) => void;
  zReportModalShiftId: string | null;
  setZReportModalShiftId: (id: string | null) => void;
}

const ShiftContext = createContext<ShiftContextType>({
  currentShift: null,
  isLoading: true,
  refreshShift: async () => {},
  isShiftOpen: false,
  isOpenShiftModalOpen: false,
  setIsOpenShiftModalOpen: () => {},
  isCloseShiftModalOpen: false,
  setIsCloseShiftModalOpen: () => {},
  isCashMovementModalOpen: false,
  setIsCashMovementModalOpen: () => {},
  zReportModalShiftId: null,
  setZReportModalShiftId: () => {},
});

export const ShiftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentStore } = useStore();
  const [currentShift, setCurrentShift] = useState<ShiftSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal control states
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [isCashMovementModalOpen, setIsCashMovementModalOpen] = useState(false);
  const [zReportModalShiftId, setZReportModalShiftId] = useState<string | null>(null);

  const refreshShift = useCallback(async () => {
    if (!currentStore?.id) return;
    try {
      setIsLoading(true);
      const res = await api.getCurrentShift(currentStore.id);
      if (res.success) {
        setCurrentShift(res.shift || null);
      } else {
        setCurrentShift(null);
      }
    } catch (err) {
      console.warn("Failed to load active shift:", err);
      setCurrentShift(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentStore?.id]);

  useEffect(() => {
    refreshShift();
  }, [refreshShift]);

  // Listen to custom store changed events
  useEffect(() => {
    const handleStoreChange = () => {
      refreshShift();
    };
    window.addEventListener("medipos:store-changed", handleStoreChange);
    return () => {
      window.removeEventListener("medipos:store-changed", handleStoreChange);
    };
  }, [refreshShift]);

  return (
    <ShiftContext.Provider
      value={{
        currentShift,
        isLoading,
        refreshShift,
        isShiftOpen: Boolean(currentShift && currentShift.status === "OPEN"),
        isOpenShiftModalOpen,
        setIsOpenShiftModalOpen,
        isCloseShiftModalOpen,
        setIsCloseShiftModalOpen,
        isCashMovementModalOpen,
        setIsCashMovementModalOpen,
        zReportModalShiftId,
        setZReportModalShiftId,
      }}
    >
      {children}
    </ShiftContext.Provider>
  );
};

export function useShift() {
  const context = useContext(ShiftContext);
  if (!context) {
    throw new Error("useShift must be used within a ShiftProvider");
  }
  return context;
}
