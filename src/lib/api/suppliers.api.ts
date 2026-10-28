// Suppliers API Client
import { API_BASE_URL, getAuthHeaders } from "./client";
import { SupplierItem } from "./types";

export const suppliersApi = {
  async getSuppliers(params?: { q?: string; status?: string; storeId?: string }): Promise<{ success: boolean; suppliers: SupplierItem[] }> {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.status) query.set("status", params.status);
    if (params?.storeId) query.set("storeId", params.storeId);

    const res = await fetch(`${API_BASE_URL}/suppliers?${query.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async getSupplierById(id: string) {
    const res = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async createSupplier(data: any) {
    const res = await fetch(`${API_BASE_URL}/suppliers`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to create supplier");
    return json;
  },

  async updateSupplier(id: string, data: any) {
    const res = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to update supplier");
    return json;
  },

  async deleteSupplier(id: string) {
    const res = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async recordSupplierPayment(id: string, data: { amount: number; paymentMethod: string; referenceNumber?: string; notes?: string }) {
    const res = await fetch(`${API_BASE_URL}/suppliers/${id}/payments`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to record payment");
    return json;
  },
};
