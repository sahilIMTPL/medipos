// Products API Client
import { API_BASE_URL, getAuthHeaders } from "./client";
import { ProductItem } from "./types";

export const productsApi = {
  async getProducts(params?: {
    q?: string;
    categoryId?: string;
    manufacturer?: string;
    status?: string;
    storeId?: string;
  }): Promise<{ success: boolean; products: ProductItem[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.categoryId) query.set("categoryId", params.categoryId);
    if (params?.manufacturer) query.set("manufacturer", params.manufacturer);
    if (params?.status) query.set("status", params.status);
    if (params?.storeId) query.set("storeId", params.storeId);

    const res = await fetch(`${API_BASE_URL}/products?${query.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async getProductById(id: string) {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async lookupBarcode(code: string): Promise<{
    success: boolean;
    matchType: "PRODUCT" | "BATCH";
    matchedBatch?: {
      id: string;
      batchNumber: string;
      expiryDate: string;
      availableQty: number;
      mrp: number;
      purchasePrice: number;
    };
    product: ProductItem & { totalBaseStock: number; totalPacks: number; factor: number };
  }> {
    const res = await fetch(`${API_BASE_URL}/products/lookup-barcode/${encodeURIComponent(code)}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `No medicine found for barcode "${code}"`);
    return json;
  },

  async assignBarcode(productId: string, barcode: string): Promise<{
    success: boolean;
    message: string;
    product: ProductItem;
  }> {
    const res = await fetch(`${API_BASE_URL}/products/assign-barcode`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ productId, barcode }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to assign barcode");
    return json;
  },

  async decodeServer(text: string): Promise<{
    success: boolean;
    matchType: "PRODUCT" | "BATCH";
    matchedBatch?: {
      id: string;
      batchNumber: string;
      expiryDate: string;
      availableQty: number;
      mrp: number;
      purchasePrice: number;
    };
    product: ProductItem & { totalBaseStock: number; totalPacks: number; factor: number };
  }> {
    const res = await fetch(`${API_BASE_URL}/products/decode-server`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "No medicine recognized from server scan");
    return json;
  },

  async createProduct(data: any) {
    const res = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to create medicine");
    return json;
  },

  async updateProduct(id: string, data: any) {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to update medicine");
    return json;
  },

  async deleteProduct(id: string) {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getManufacturers(): Promise<{
    success: boolean;
    manufacturers: string[];
    details?: Array<{
      name: string;
      productCount: number;
      inStockCount: number;
      totalStock: number;
    }>;
  }> {
    const res = await fetch(`${API_BASE_URL}/products/manufacturers`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async getSubstitutes(productId: string): Promise<{
    success: boolean;
    target: { id: string; name: string; genericName: string; mrp: number };
    totalFound: number;
    substitutes: Array<ProductItem & { inStock: boolean }>;
    message?: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/products/substitutes/${productId}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },
};
