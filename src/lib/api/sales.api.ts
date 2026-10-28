// Sales & POS Invoicing API Client
import { API_BASE_URL, getAuthHeaders } from "./client";
import { SalesInvoiceListItem, SalesInvoicePrintDetail } from "./types";

export const salesApi = {
  async getSales(params?: {
    q?: string;
    startDate?: string;
    endDate?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    limit?: number;
    storeId?: string;
  }): Promise<{ success: boolean; invoices: SalesInvoiceListItem[] }> {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    if (params?.paymentMethod) query.set("paymentMethod", params.paymentMethod);
    if (params?.paymentStatus) query.set("paymentStatus", params.paymentStatus);
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.storeId) query.set("storeId", params.storeId);

    const res = await fetch(`${API_BASE_URL}/sales?${query.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async getSaleById(id: string): Promise<{ success: boolean; invoice: SalesInvoicePrintDetail }> {
    const res = await fetch(`${API_BASE_URL}/sales/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async createSale(
    data: any,
    idempotencyKey?: string
  ): Promise<{
    success: boolean;
    invoiceId: string;
    invoiceNumber: string;
    grandTotal: number;
    paidAmount: number;
    changeAmount: number;
    message: string;
  }> {
    const headers = getAuthHeaders(
      idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : undefined
    );
    const res = await fetch(`${API_BASE_URL}/sales`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to complete sale checkout");
    return json;
  },
};
