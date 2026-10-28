// Categories API Client
import { API_BASE_URL, getAuthHeaders } from "./client";
import { CategoryItem } from "./types";

export const categoriesApi = {
  async getCategories(): Promise<{ success: boolean; categories: CategoryItem[] }> {
    const res = await fetch(`${API_BASE_URL}/categories`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async createCategory(data: { name: string; description?: string }) {
    const res = await fetch(`${API_BASE_URL}/categories`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to create category");
    return json;
  },

  async updateCategory(id: string, data: { name?: string; description?: string; isActive?: boolean }) {
    const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to update category");
    return json;
  },

  async deleteCategory(id: string) {
    const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to delete category");
    return json;
  },
};
