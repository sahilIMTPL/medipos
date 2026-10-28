// Prescriptions API Client
import { API_BASE_URL, getAuthHeaders } from "./client";

export interface PrescriptionListItem {
  id: string;
  rxNumber: string;
  patientName: string;
  patientPhone: string;
  patientAddress: string;
  customerId?: string | null;
  doctorName: string;
  doctorRegNo: string;
  clinicName: string;
  prescriptionDate: string;
  date: string;
  imageUrl?: string | null;
  notes?: string;
  status: "Dispensed" | "Pending";
  medicines: string[];
  salesInvoices: Array<{
    id: string;
    invoiceNumber: string;
    date: string;
    grandTotal: number;
  }>;
}

export const prescriptionsApi = {
  async getPrescriptions(params?: {
    q?: string;
    startDate?: string;
    endDate?: string;
    storeId?: string;
    limit?: number;
  }): Promise<{ success: boolean; prescriptions: PrescriptionListItem[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    if (params?.storeId) query.set("storeId", params.storeId);
    if (params?.limit) query.set("limit", String(params.limit));

    const res = await fetch(`${API_BASE_URL}/prescriptions?${query.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async getPrescriptionById(id: string) {
    const res = await fetch(`${API_BASE_URL}/prescriptions/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async createPrescription(data: {
    patientName: string;
    patientPhone?: string;
    patientAddress?: string;
    customerId?: string;
    doctorName: string;
    doctorRegNo?: string;
    clinicName?: string;
    prescriptionDate?: string;
    medicines?: string[];
    notes?: string;
    imageUrl?: string;
    storeId?: string;
  }): Promise<{ success: boolean; prescription: any; message: string }> {
    const res = await fetch(`${API_BASE_URL}/prescriptions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to create prescription");
    return json;
  },

  async updatePrescription(id: string, data: any) {
    const res = await fetch(`${API_BASE_URL}/prescriptions/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to update prescription");
    return json;
  },

  async deletePrescription(id: string) {
    const res = await fetch(`${API_BASE_URL}/prescriptions/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to delete prescription");
    return json;
  },
};
