// Purchase Returns API Client
import { API_BASE_URL, getAuthHeaders } from "./client";
import { PurchaseReturnListItem, PurchaseReturnPrintDetail } from "./types";

export const purchaseReturnsApi = {
  async getPurchaseReturns(params?: { q?: string; supplierId?: string; startDate?: string; endDate?: string }): Promise<{
    success: boolean;
    total: number;
    totalDebit: number;
    returns: PurchaseReturnListItem[];
  }> {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.supplierId) query.set("supplierId", params.supplierId);
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);

    const res = await fetch(`${API_BASE_URL}/purchase-returns?${query.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async getPurchaseReturnEligibleInvoice(invoiceNo: string): Promise<{
    success: boolean;
    invoice: {
      id: string;
      invoiceNumber: string;
      invoiceDate: string;
      supplierId: string;
      supplierName: string;
      supplierGstin?: string;
      items: Array<{
        productId: string;
        productName: string;
        genericName?: string;
        batchId: string;
        batchNumber: string;
        expiryDate: string;
        availableQty: number;
        receivedQty: number;
        unit: string;
        unitCost: number;
      }>;
    };
  }> {
    const res = await fetch(`${API_BASE_URL}/purchase-returns/eligible/${encodeURIComponent(invoiceNo.trim())}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `Purchase invoice ${invoiceNo} not found`);
    return json;
  },

  async getPurchaseReturnDetails(id: string): Promise<{ success: boolean; debitNote: PurchaseReturnPrintDetail }> {
    const res = await fetch(`${API_BASE_URL}/purchase-returns/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Debit note not found");
    return json;
  },

  async createPurchaseReturn(data: {
    supplierId: string;
    purchaseInvoiceId?: string;
    reason?: string;
    items: Array<{
      productId: string;
      batchId: string;
      returnQty: number;
      unitRate: number;
      reason?: string;
    }>;
  }): Promise<{ success: boolean; message: string; returnId: string; returnNumber: string; totalDebitAmount: number }> {
    const res = await fetch(`${API_BASE_URL}/purchase-returns`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to create debit note");
    return json;
  },
};
