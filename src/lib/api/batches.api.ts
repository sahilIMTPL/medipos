// Batches & FEFO Expiry API Client
import { API_BASE_URL, getAuthHeaders } from "./client";
import { BatchItem } from "./types";

export const batchesApi = {
  async getBatches(params?: { filter?: string; status?: string; q?: string; storeId?: string }): Promise<{ success: boolean; batches: BatchItem[] }> {
    const query = new URLSearchParams();
    if (params?.filter) query.set("filter", params.filter);
    if (params?.status) query.set("status", params.status);
    if (params?.q) query.set("q", params.q);
    if (params?.storeId) query.set("storeId", params.storeId);

    const res = await fetch(`${API_BASE_URL}/batches?${query.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async quarantineBatch(id: string) {
    const res = await fetch(`${API_BASE_URL}/batches/${id}/quarantine`, {
      method: "PUT",
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async adjustBatchStock(id: string, data: { adjustedQty: number; reason: string }) {
    const res = await fetch(`${API_BASE_URL}/batches/${id}/adjust`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to adjust batch stock");
    return json;
  },
};
