// Super Admin Platform API Client
import { API_BASE_URL, getAuthHeaders } from "./client";

export interface SuperAdminDashboardKpis {
  networkGmv: number;
  networkOrders: number;
  totalStores: number;
  activeStores: number;
  suspendedStores: number;
  activeStaff: number;
  complianceAlerts: number;
}

export interface SuperAdminStoreSummary {
  id: string;
  name: string;
  code: string;
  city: string;
  isActive: boolean;
  productCount: number;
  invoiceCount: number;
  staffCount: number;
  totalRevenue: number;
  gstin: string;
  drugLicenseNo: string;
}

export interface SuperAdminRecentSale {
  id: string;
  invoiceNumber: string;
  storeName: string;
  storeCode: string;
  customerName: string;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

export interface SuperAdminDashboardResponse {
  success: boolean;
  kpis: SuperAdminDashboardKpis;
  storesSummary: SuperAdminStoreSummary[];
  recentSales: SuperAdminRecentSale[];
}

export interface SuperAdminStoreItem {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  gstin: string;
  drugLicenseNo: string;
  isActive: boolean;
  createdAt: string;
  productCount: number;
  batchCount: number;
  orderCount: number;
  staffCount: number;
  customerCount: number;
  totalSales: number;
  manager: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
}

export const superAdminApi = {
  // Fetch executive dashboard metrics
  async getSuperAdminDashboard(): Promise<SuperAdminDashboardResponse> {
    const res = await fetch(`${API_BASE_URL}/super-admin/dashboard`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  // List all pharmacy store branches
  async getSuperAdminStores(): Promise<{ success: boolean; stores: SuperAdminStoreItem[] }> {
    const res = await fetch(`${API_BASE_URL}/super-admin/stores`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  // Onboard new pharmacy store branch
  async createStoreBranch(data: {
    name: string;
    code: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
    email?: string;
    gstin?: string;
    drugLicenseNo?: string;
    adminEmail?: string;
  }): Promise<{ success: boolean; store: any; message: string }> {
    const res = await fetch(`${API_BASE_URL}/super-admin/stores`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to onboard store branch");
    return json;
  },

  // Toggle store active / suspended status
  async updateStoreBranchStatus(
    id: string,
    isActive: boolean
  ): Promise<{ success: boolean; store: any; message: string }> {
    const res = await fetch(`${API_BASE_URL}/super-admin/stores/${id}/status`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ isActive }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to update store status");
    return json;
  },

  // Update store branch details
  async updateStoreBranch(
    id: string,
    data: {
      name?: string;
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
      phone?: string;
      email?: string;
      gstin?: string;
      drugLicenseNo?: string;
    }
  ): Promise<{ success: boolean; store: any; message: string }> {
    const res = await fetch(`${API_BASE_URL}/super-admin/stores/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to update store branch");
    return json;
  },
};
