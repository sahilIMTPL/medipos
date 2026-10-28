// Audit Logs API Client
import { API_BASE_URL, getAuthHeaders } from "./client";

export interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: any;
  ipAddress: string | null;
  createdAt: string;
  actorName: string;
  actorRole: string;
}

export interface AuditLogsResponse {
  success: boolean;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  logs: AuditLogItem[];
}

export const auditLogsApi = {
  async getAuditLogs(params?: {
    action?: string;
    entity?: string;
    search?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<AuditLogsResponse> {
    const query = new URLSearchParams();
    if (params?.action) query.append("action", params.action);
    if (params?.entity) query.append("entity", params.entity);
    if (params?.search) query.append("search", params.search);
    if (params?.from) query.append("from", params.from);
    if (params?.to) query.append("to", params.to);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());

    const res = await fetch(`${API_BASE_URL}/audit-logs?${query.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async createAuditLog(data: { action: string; entity: string; entityId?: string; details?: any }) {
    const res = await fetch(`${API_BASE_URL}/audit-logs`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
