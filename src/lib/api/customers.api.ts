// Customers API Client
import { API_BASE_URL, getAuthHeaders } from "./client";
import { CustomerItem, CustomerStats } from "./types";

export const customersApi = {
  async getCustomers(params?: { q?: string; storeId?: string }): Promise<{
    success: boolean;
    customers: CustomerItem[];
    stats?: CustomerStats;
  }> {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.storeId) query.set("storeId", params.storeId);

    const res = await fetch(`${API_BASE_URL}/customers?${query.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async createCustomer(data: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    customer: CustomerItem;
    existed: boolean;
  }> {
    const res = await fetch(`${API_BASE_URL}/customers`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to add customer");
    return json;
  },

  async updateCustomer(
    id: string,
    data: {
      name?: string;
      phone?: string;
      email?: string;
      address?: string;
      notes?: string;
    }
  ): Promise<{
    success: boolean;
    customer: CustomerItem;
  }> {
    const res = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to update customer");
    return json;
  },

  async deleteCustomer(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to delete customer");
    return json;
  },
};
