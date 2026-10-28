// Reports API Client
import { API_BASE_URL, getAuthHeaders } from "./client";

export interface SalesReportResponse {
  success: boolean;
  summary: {
    invoiceCount: number;
    totalGross: number;
    totalDiscount: number;
    totalTax: number;
    totalNet: number;
    paymentBreakdown: Record<string, number>;
  };
  topSellingProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    date: string;
    customerName: string;
    customerPhone: string | null;
    doctorName: string | null;
    itemCount: number;
    subtotal: number;
    discount: number;
    tax: number;
    grandTotal: number;
    paymentMethod: string;
    cashier: string;
  }>;
}

export interface PurchaseReportResponse {
  success: boolean;
  summary: {
    purchaseCount: number;
    totalAmount: number;
    totalTax: number;
    totalDiscount: number;
    supplierSpend: Array<{ supplierName: string; count: number; spend: number }>;
  };
  purchases: Array<{
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    supplierName: string;
    supplierGstin: string | null;
    itemCount: number;
    subtotal: number;
    tax: number;
    grandTotal: number;
    paymentStatus: string;
  }>;
}

export interface InventoryValuationResponse {
  success: boolean;
  summary: {
    totalBatches: number;
    costValuation: number;
    retailValuation: number;
    potentialGrossProfit: number;
    marginPercentage: number;
    categoryBreakdown: Array<{ categoryName: string; stockCount: number; costVal: number; retailVal: number }>;
  };
  batches: Array<{
    id: string;
    batchNumber: string;
    productName: string;
    genericName: string | null;
    category: string;
    expiryDate: string;
    availableQty: number;
    unit: string;
    purchasePrice: number;
    mrp: number;
    costTotal: number;
    retailTotal: number;
  }>;
}

export interface ExpiryScheduleResponse {
  success: boolean;
  summary: {
    expiredCount: number;
    expiredRiskValue: number;
    expiring30Count: number;
    riskValue30: number;
    expiring60Count: number;
    riskValue60: number;
    expiring90Count: number;
    riskValue90: number;
    totalRiskValue: number;
  };
  expired: any[];
  expiring30: any[];
  expiring60: any[];
  expiring90: any[];
}

export interface ProfitLossResponse {
  success: boolean;
  report: {
    period: { from: string; to: string };
    invoiceCount: number;
    grossRevenue: number;
    totalDiscount: number;
    netRevenue: number;
    costOfGoodsSold: number;
    totalTaxCollected: number;
    grossProfit: number;
    grossMarginPercent: number;
  };
}

export interface GstReportResponse {
  success: boolean;
  summary: {
    totalTaxableSales: number;
    totalOutputGst: number;
    totalTaxablePurchases: number;
    totalInputGst: number;
    netGstPayable: number;
  };
  taxSlabs: Record<string, { taxableAmount: number; cgst: number; sgst: number; totalTax: number }>;
}

export const reportsApi = {
  async getSalesReport(params?: { from?: string; to?: string; paymentMethod?: string }): Promise<SalesReportResponse> {
    const query = new URLSearchParams();
    if (params?.from) query.append("from", params.from);
    if (params?.to) query.append("to", params.to);
    if (params?.paymentMethod) query.append("paymentMethod", params.paymentMethod);

    const res = await fetch(`${API_BASE_URL}/reports/sales?${query.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async getPurchaseReport(params?: { from?: string; to?: string; supplierId?: string }): Promise<PurchaseReportResponse> {
    const query = new URLSearchParams();
    if (params?.from) query.append("from", params.from);
    if (params?.to) query.append("to", params.to);
    if (params?.supplierId) query.append("supplierId", params.supplierId);

    const res = await fetch(`${API_BASE_URL}/reports/purchases?${query.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async getInventoryValuationReport(): Promise<InventoryValuationResponse> {
    const res = await fetch(`${API_BASE_URL}/reports/inventory-valuation`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async getExpiryScheduleReport(): Promise<ExpiryScheduleResponse> {
    const res = await fetch(`${API_BASE_URL}/reports/expiry-schedule`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async getProfitLossReport(params?: { from?: string; to?: string }): Promise<ProfitLossResponse> {
    const query = new URLSearchParams();
    if (params?.from) query.append("from", params.from);
    if (params?.to) query.append("to", params.to);

    const res = await fetch(`${API_BASE_URL}/reports/profit-loss?${query.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async getGstReport(params?: { from?: string; to?: string }): Promise<GstReportResponse> {
    const query = new URLSearchParams();
    if (params?.from) query.append("from", params.from);
    if (params?.to) query.append("to", params.to);

    const res = await fetch(`${API_BASE_URL}/reports/gst?${query.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },
};
