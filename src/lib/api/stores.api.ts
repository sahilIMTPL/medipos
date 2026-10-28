// Stores API Client
import { API_BASE_URL, getAuthHeaders } from "./client";

export interface CurrentStoreResponse {
  success: boolean;
  store: {
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
    settings: {
      invoicePrefix: string;
      thermalPrintWidth: number;
      expiryAlertDays: number;
      lowStockThreshold: number;
      maxDiscountPercent: number;
      defaultTaxRate: number;
      enableLooseSale: boolean;
      requireDoctorInfo: boolean;
      gstScheme?: "REGULAR" | "COMPOSITION";
      filingFrequency?: "MONTHLY" | "QUARTERLY_QRMP";
      stateCode?: string;
      compositionTaxRate?: number;
      isEInvoicingEligible?: boolean;
      digilockerEnabled?: boolean;
      digilockerClientId?: string;
      digilockerClientSecret?: string;
      digilockerOrgName?: string;
      digilockerMode?: "SANDBOX" | "PRODUCTION";
    };
  };
}

export const storesApi = {
  async getStores() {
    const res = await fetch(`${API_BASE_URL}/stores`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async getCurrentStore(storeId?: string): Promise<CurrentStoreResponse> {
    const url = storeId ? `${API_BASE_URL}/stores/current?storeId=${storeId}` : `${API_BASE_URL}/stores/current`;
    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async updateCurrentStore(data: {
    storeId?: string;
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    gstin?: string;
    drugLicenseNo?: string;
  }) {
    const res = await fetch(`${API_BASE_URL}/stores/current`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateStoreSettings(data: {
    storeId?: string;
    invoicePrefix?: string;
    thermalPrintWidth?: number;
    expiryAlertDays?: number;
    lowStockThreshold?: number;
    maxDiscountPercent?: number;
    defaultTaxRate?: number;
    enableLooseSale?: boolean;
    requireDoctorInfo?: boolean;
    gstScheme?: "REGULAR" | "COMPOSITION";
    filingFrequency?: "MONTHLY" | "QUARTERLY_QRMP";
    stateCode?: string;
    compositionTaxRate?: number;
    isEInvoicingEligible?: boolean;
    digilockerEnabled?: boolean;
    digilockerClientId?: string;
    digilockerClientSecret?: string;
    digilockerOrgName?: string;
    digilockerMode?: "SANDBOX" | "PRODUCTION";
  }) {
    const res = await fetch(`${API_BASE_URL}/stores/settings`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getStoreBackup() {
    const res = await fetch(`${API_BASE_URL}/stores/backup`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },
};
