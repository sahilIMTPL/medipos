// Units & Conversions API Client
import { API_BASE_URL, getAuthHeaders } from "./client";

export const unitsApi = {
  async getUnits() {
    const res = await fetch(`${API_BASE_URL}/units`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async getUnitConversions() {
    const res = await fetch(`${API_BASE_URL}/units/conversions`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async createUnit(data: { name: string; code: string; isBaseUnit?: boolean }) {
    const res = await fetch(`${API_BASE_URL}/units`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to create unit");
    return json;
  },

  async createUnitConversion(data: {
    productId: string;
    fromUnitId: string;
    toUnitId: string;
    conversionFactor: number;
  }) {
    const res = await fetch(`${API_BASE_URL}/units/conversions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to save unit conversion");
    return json;
  },
};
