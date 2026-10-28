// Purchases & Receiving API Client
import { API_BASE_URL, getAuthHeaders } from "./client";
import { PurchaseItemDetail } from "./types";

export const purchasesApi = {
  async getPurchases(params?: { supplierId?: string; paymentStatus?: string; q?: string; storeId?: string }): Promise<{ success: boolean; purchases: PurchaseItemDetail[] }> {
    const query = new URLSearchParams();
    if (params?.supplierId) query.set("supplierId", params.supplierId);
    if (params?.paymentStatus) query.set("paymentStatus", params.paymentStatus);
    if (params?.q) query.set("q", params.q);
    if (params?.storeId) query.set("storeId", params.storeId);

    const res = await fetch(`${API_BASE_URL}/purchases?${query.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async getPurchaseById(id: string): Promise<{ success: boolean; purchase: PurchaseItemDetail }> {
    const res = await fetch(`${API_BASE_URL}/purchases/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async createPurchase(data: any) {
    const res = await fetch(`${API_BASE_URL}/purchases`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to record purchase receipt");
    return json;
  },
};
