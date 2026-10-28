// Sales Returns API Client
import { API_BASE_URL, getAuthHeaders } from "./client";
import { EligibleReturnInvoice, SalesReturnListItem, SalesReturnPrintDetail } from "./types";

export const salesReturnsApi = {
  async getSalesReturns(params?: { q?: string; startDate?: string; endDate?: string }): Promise<{
    success: boolean;
    total: number;
    totalRefunded: number;
    returns: SalesReturnListItem[];
  }> {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);

    const res = await fetch(`${API_BASE_URL}/sales-returns?${query.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async getSalesReturnEligibleInvoice(invoiceNo: string): Promise<{
    success: boolean;
    invoice: EligibleReturnInvoice;
  }> {
    const res = await fetch(`${API_BASE_URL}/sales-returns/eligible/${encodeURIComponent(invoiceNo.trim())}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `Invoice ${invoiceNo} not found`);
    return json;
  },

  async getSalesReturnDetails(id: string): Promise<{ success: boolean; returnSlip: SalesReturnPrintDetail }> {
    const res = await fetch(`${API_BASE_URL}/sales-returns/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Return slip not found");
    return json;
  },

  async createSalesReturn(data: {
    originalInvoiceId: string;
    refundMethod?: string;
    reason?: string;
    items: Array<{
      salesItemId: string;
      batchId: string;
      returnQty: number;
      refundAmount: number;
      isRestocked?: boolean;
      reason?: string;
    }>;
  }): Promise<{ success: boolean; message: string; returnId: string; returnNumber: string; totalRefundAmount: number }> {
    const res = await fetch(`${API_BASE_URL}/sales-returns`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to process sales return");
    return json;
  },
};
