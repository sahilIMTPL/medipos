// Dashboard Metrics API Client
import { API_BASE_URL, getAuthHeaders } from "./client";
import { DashboardStatsResponse } from "./types";

export const dashboardApi = {
  async getDashboardStats(storeId?: string): Promise<DashboardStatsResponse> {
    const url = storeId
      ? `${API_BASE_URL}/dashboard/stats?storeId=${storeId}`
      : `${API_BASE_URL}/dashboard/stats`;

    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to load dashboard metrics");
    }
    return data;
  },
};
