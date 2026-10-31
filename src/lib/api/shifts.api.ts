import { API_BASE_URL, getAuthHeaders } from "./client";

export type ShiftStatus = "OPEN" | "CLOSED";
export type CashMovementType = "CASH_IN" | "CASH_OUT" | "BANK_DROP";

export interface DenominationBreakdown {
  [key: string]: number;
}

export interface ShiftSummary {
  shiftId: string;
  shiftNumber: number;
  status: ShiftStatus;
  openedAt: string;
  closedAt: string | null;
  openedBy: {
    id: string;
    fullName: string;
    email: string;
  };
  closedBy?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  openingCashFloat: number;
  openingBankBalance: number;
  openingNotes: string | null;

  invoiceCount: number;
  totalCashSales: number;
  totalUpiSales: number;
  totalCardSales: number;
  totalCreditSales: number;
  totalSalesRevenue: number;

  totalCustomerDuesCash: number;
  totalCustomerDuesBank: number;

  totalSupplierPaidCash: number;
  totalSupplierPaidBank: number;

  totalCashIn: number;
  totalCashOut: number;
  totalBankDrop: number;
  totalCashRefunds: number;

  expectedCash: number;
  expectedBank: number;

  actualClosingCash?: number;
  cashVariance?: number;
  denominations?: DenominationBreakdown;
  closingNotes?: string | null;

  recentMovements: Array<{
    id: string;
    type: CashMovementType;
    amount: number;
    reason: string;
    createdAt: string;
  }>;
}

export interface ShiftHistoryItem {
  id: string;
  shiftNumber: number;
  status: ShiftStatus;
  openedAt: string;
  closedAt: string | null;
  openedBy: string;
  closedBy: string | null;
  openingCashFloat: number;
  totalCashSales: number;
  totalUpiSales: number;
  totalCardSales: number;
  expectedClosingCash: number;
  actualClosingCash: number;
  cashVariance: number;
  invoiceCount: number;
  movementCount: number;
}

export interface ZReportData {
  store: {
    name: string;
    address: string;
    city: string;
    phone: string;
    gstin: string;
    drugLicenseNo: string;
  };
  shiftNumber: number;
  openedAt: string;
  closedAt: string | null;
  cashierOpened: string;
  cashierClosed: string;
  summary: ShiftSummary;
  movements: Array<{
    type: CashMovementType;
    amount: number;
    reason: string;
    time: string;
  }>;
  denominations?: DenominationBreakdown;
}

export const shiftsApi = {
  // 1. Get currently open shift
  async getCurrentShift(storeId?: string): Promise<{ success: boolean; shift: ShiftSummary | null }> {
    try {
      const q = storeId ? `?storeId=${storeId}` : "";
      const res = await fetch(`${API_BASE_URL}/shifts/current${q}`, {
        method: "GET",
        headers: getAuthHeaders(),
        cache: "no-store",
      });
      if (!res.ok) return { success: false, shift: null };
      return await res.json();
    } catch {
      return { success: false, shift: null };
    }
  },

  // 2. Open a new register shift
  async openShift(data: {
    storeId?: string;
    openingCashFloat: number;
    openingBankBalance?: number;
    openingNotes?: string;
  }): Promise<{ success: boolean; message?: string; shift?: ShiftSummary }> {
    const res = await fetch(`${API_BASE_URL}/shifts/open`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to open shift");
    return json;
  },

  // 3. Get live calculated shift summary
  async getShiftSummary(shiftId: string): Promise<{ success: boolean; summary: ShiftSummary }> {
    const res = await fetch(`${API_BASE_URL}/shifts/${shiftId}/summary`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to load shift summary");
    return json;
  },

  // 4. Record petty cash in / out / bank drop
  async recordCashMovement(data: {
    shiftId: string;
    storeId?: string;
    type: CashMovementType;
    amount: number;
    reason: string;
  }): Promise<{ success: boolean; message?: string; summary?: ShiftSummary }> {
    const res = await fetch(`${API_BASE_URL}/shifts/cash-movement`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to record cash movement");
    return json;
  },

  // 5. Close shift & perform blind cash reconciliation
  async closeShift(data: {
    shiftId: string;
    storeId?: string;
    actualClosingCash: number;
    denominations?: DenominationBreakdown;
    closingNotes?: string;
  }): Promise<{ success: boolean; message?: string; shift?: ShiftSummary }> {
    const res = await fetch(`${API_BASE_URL}/shifts/close`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to close shift");
    return json;
  },

  // 6. Get Z-Report formatted data
  async getShiftZReport(shiftId: string): Promise<{ success: boolean; zReport: ZReportData }> {
    const res = await fetch(`${API_BASE_URL}/shifts/${shiftId}/z-report`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to load Z-Report");
    return json;
  },

  // 7. Get shift history
  async getShiftHistory(storeId?: string, limit = 30): Promise<{ success: boolean; shifts: ShiftHistoryItem[] }> {
    try {
      const q = storeId ? `?storeId=${storeId}&limit=${limit}` : `?limit=${limit}`;
      const res = await fetch(`${API_BASE_URL}/shifts/history${q}`, {
        method: "GET",
        headers: getAuthHeaders(),
        cache: "no-store",
      });
      if (!res.ok) return { success: false, shifts: [] };
      return await res.json();
    } catch {
      return { success: false, shifts: [] };
    }
  },
};

