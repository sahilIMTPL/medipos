// Inventory & Stock Ledger API Client
import { API_BASE_URL, getAuthHeaders } from "./client";
import { InventoryOverviewStats, ReconciliationWorksheetItem, StockLedgerItem } from "./types";

export const inventoryApi = {
  async getInventoryOverview(storeId?: string): Promise<{ success: boolean; overview: InventoryOverviewStats }> {
    const query = storeId ? `?storeId=${storeId}` : "";
    const res = await fetch(`${API_BASE_URL}/inventory/overview${query}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async getStockLedger(params?: {
    q?: string;
    movementType?: string;
    productId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    storeId?: string;
  }): Promise<{
    success: boolean;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    movements: StockLedgerItem[];
  }> {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.movementType && params.movementType !== "ALL") query.set("movementType", params.movementType);
    if (params?.productId) query.set("productId", params.productId);
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    if (params?.page) query.set("page", params.page.toString());
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.storeId) query.set("storeId", params.storeId);

    const res = await fetch(`${API_BASE_URL}/inventory/ledger?${query.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async getReconciliationWorksheet(params?: { categoryId?: string; storeId?: string }): Promise<{
    success: boolean;
    totalBatches: number;
    worksheet: ReconciliationWorksheetItem[];
  }> {
    const query = new URLSearchParams();
    if (params?.categoryId && params.categoryId !== "ALL") query.set("categoryId", params.categoryId);
    if (params?.storeId) query.set("storeId", params.storeId);

    const res = await fetch(`${API_BASE_URL}/inventory/reconciliation-worksheet?${query.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async submitStockReconciliation(data: {
    notes?: string;
    items: Array<{
      batchId: string;
      countedQty: number;
      reason?: string;
    }>;
  }): Promise<{
    success: boolean;
    message: string;
    auditRef: string;
    adjustedCount: number;
    totalSurplus: number;
    totalDeficit: number;
  }> {
    const res = await fetch(`${API_BASE_URL}/inventory/reconciliation`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to submit stock reconciliation");
    return json;
  },
};
