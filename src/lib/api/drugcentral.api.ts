import { API_BASE_URL, getAuthHeaders } from "./client";

export interface DrugCentralProduct {
  id: number;
  productName: string;
  genericName: string;
  dosageForm: string;
  route: string;
  ndcProductCode: string;
  activeIngredients: {
    name: string;
    quantity: number | null;
    unit: string | null;
  }[];
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  riskLevel: string;
  description: string;
}

export const drugcentralApi = {
  searchDrugCentral: async (
    query: string,
    limit = 25
  ): Promise<{ success: boolean; count: number; medicines: DrugCentralProduct[] }> => {
    const res = await fetch(
      `${API_BASE_URL}/drugcentral/search?q=${encodeURIComponent(query)}&limit=${limit}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
        cache: "no-store",
      }
    );
    return res.json();
  },

  getDrugCentralSubstitutes: async (
    productId: number
  ): Promise<{ success: boolean; count: number; substitutes: DrugCentralProduct[] }> => {
    const res = await fetch(`${API_BASE_URL}/drugcentral/substitutes/${productId}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  checkDrugInteractions: async (
    drugs: string[]
  ): Promise<{
    success: boolean;
    hasInteractions: boolean;
    interactions: DrugInteraction[];
  }> => {
    const res = await fetch(`${API_BASE_URL}/drugcentral/check-interactions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ drugs }),
    });
    return res.json();
  },

  importDrugCentralMedicine: async (
    productId: number,
    storeId?: string,
    defaultPrice?: number
  ): Promise<{ success: boolean; message: string; product: any }> => {
    const res = await fetch(`${API_BASE_URL}/drugcentral/import`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ productId, storeId, defaultPrice }),
    });
    return res.json();
  },
};
