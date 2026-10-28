// Notifications API Client
import { API_BASE_URL, getAuthHeaders } from "./client";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  type: "EXPIRY" | "LOW_STOCK" | "OUT_OF_STOCK" | "SYSTEM";
  link: string;
  createdAt: string;
  isRead: boolean;
}

export interface NotificationsResponse {
  success: boolean;
  unreadCount: number;
  notifications: NotificationItem[];
}

export const notificationsApi = {
  async getNotifications(storeId?: string): Promise<NotificationsResponse> {
    const url = storeId
      ? `${API_BASE_URL}/notifications?storeId=${encodeURIComponent(storeId)}`
      : `${API_BASE_URL}/notifications`;
    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async markNotificationRead(id?: string, markAll?: boolean, ids?: string[], storeId?: string) {
    const res = await fetch(`${API_BASE_URL}/notifications/mark-read`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ id, markAll, ids, storeId }),
    });
    return res.json();
  },
};
