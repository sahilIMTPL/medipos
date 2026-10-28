import { API_BASE_URL, getAuthHeaders } from "./client";

export interface UserItem {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone?: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "STORE_ADMIN" | "DOCTOR";
  status: "ACTIVE" | "SUSPENDED" | "EXPIRED" | "PENDING_VERIFICATION";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stores?: Array<{
    id: string;
    name: string;
    code: string;
    city?: string | null;
  }>;
}

export interface RoleDefItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  permissions: string[];
}

export const usersApi = {
  async getUsers(params?: {
    storeId?: string;
    role?: string;
    status?: string;
    q?: string;
  }): Promise<{ success: boolean; total: number; users: UserItem[] }> {
    const query = new URLSearchParams();
    if (params?.storeId) query.set("storeId", params.storeId);
    if (params?.role && params.role !== "ALL") query.set("role", params.role);
    if (params?.status && params.status !== "ALL") query.set("status", params.status);
    if (params?.q) query.set("q", params.q);

    const res = await fetch(`${API_BASE_URL}/users?${query.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async createUser(data: {
    fullName: string;
    email: string;
    username: string;
    password: string;
    phone?: string;
    role: "SUPER_ADMIN" | "ADMIN" | "STORE_ADMIN" | "DOCTOR";
    storeIds?: string[];
  }): Promise<{ success: boolean; message: string; user?: UserItem }> {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateUser(
    id: string,
    data: {
      fullName?: string;
      email?: string;
      phone?: string;
      role?: "SUPER_ADMIN" | "ADMIN" | "STORE_ADMIN" | "DOCTOR";
      password?: string;
      storeIds?: string[];
    }
  ): Promise<{ success: boolean; message: string; user?: UserItem }> {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateUserStatus(
    id: string,
    status: "ACTIVE" | "SUSPENDED" | "EXPIRED"
  ): Promise<{ success: boolean; message: string; user?: UserItem }> {
    const res = await fetch(`${API_BASE_URL}/users/${id}/status`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  async getRoles(): Promise<{ success: boolean; roles: RoleDefItem[] }> {
    const res = await fetch(`${API_BASE_URL}/users/roles`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },
};
