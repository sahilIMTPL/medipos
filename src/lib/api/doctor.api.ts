// Doctor OPD Desk API Client
import { API_BASE_URL, getAuthHeaders } from "./client";

export interface DoctorFormularyMedicine {
  id: string;
  name: string;
  brandName?: string | null;
  genericName?: string | null;
  strength?: string | null;
  dosageForm: string;
  packDescription?: string | null;
  mrp: number;
  baseUnit: string;
  saleUnit: string;
  conversionFactor: number;
  totalBaseQty: number;
  packQty: number;
  looseQty: number;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  isPrescriptionRequired: boolean;
  earliestExpiry?: string | null;
}

export interface PatientPastMedicine {
  productName: string;
  genericName: string;
  lastPrescribedDate: string;
  lastDosage: string;
  lastFrequency: string;
  lastTiming: string;
  lastDuration: string;
  doctorName: string;
}

export interface PatientPastVisit {
  id: string;
  date: string;
  doctorName: string;
  doctorRegNo?: string;
  clinicName?: string;
  diagnosis: string;
  vitals?: {
    bp?: string;
    pulse?: string;
    temp?: string;
    weight?: string;
    height?: string;
    spo2?: string;
    bloodSugar?: string;
  } | null;
  symptoms: string[];
  allergies: string[];
  clinicalNotes: string;
  items: Array<{
    productId?: string;
    productName: string;
    genericName?: string;
    dosage: string;
    frequency: string;
    timing: string;
    duration: string;
    quantity: number;
    instructions?: string;
  }>;
  isDispensed: boolean;
}

export interface PatientClinicalDossier {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  chronicDiseases: string[];
  allergies: string[];
  totalVisits: number;
  pastVisits: PatientPastVisit[];
  previouslyGivenMedicines: PatientPastMedicine[];
}

export interface PrescribedMedicineInput {
  productId?: string;
  productName: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  timing: string;
  duration: string;
  quantity: number;
  instructions?: string;
}

export interface CreateDoctorPrescriptionPayload {
  storeId?: string;
  patientName: string;
  patientPhone?: string;
  patientAddress?: string;
  patientAge?: string | number;
  patientGender?: string;
  customerId?: string;
  doctorName: string;
  doctorRegNo?: string;
  clinicName?: string;
  specialization?: string;
  diagnosis: string;
  symptoms?: string[];
  vitals?: {
    bp?: string;
    pulse?: string;
    temp?: string;
    weight?: string;
    height?: string;
    spo2?: string;
    bloodSugar?: string;
  };
  allergies?: string[];
  clinicalNotes?: string;
  items: PrescribedMedicineInput[];
}

export interface PendingQueueRxItem {
  id: string;
  rxNumber: string;
  createdAt: string;
  timeAgo: string;
  patientName: string;
  patientPhone: string;
  patientAddress: string;
  customerId?: string | null;
  doctorName: string;
  doctorRegNo: string;
  clinicName: string;
  diagnosis: string;
  vitals?: any;
  allergies: string[];
  clinicalNotes: string;
  totalItems: number;
  availableCount: number;
  outOfStockCount: number;
  isFullyAvailable: boolean;
  items: Array<
    PrescribedMedicineInput & {
      isAvailable: boolean;
      matchedProductId: string | null;
      availableQty: number;
      feffoBatch?: {
        id: string;
        batchNumber: string;
        expiryDate: string;
        mrp: number;
        availableQty: number;
      } | null;
      suggestedSubstitute?: {
        id: string;
        name: string;
        genericName: string;
        mrp: number;
        availableQty: number;
      } | null;
    }
  >;
}

export interface DoctorAuthUser {
  id: string;
  name: string;
  mciNumber: string;
  email: string;
  specialization: string;
  clinicName: string;
  storeId?: string;
  storeName?: string;
}

export const DOCTOR_SESSION_KEY = "medcare_doctor_session";
export const DOCTOR_TOKEN_KEY = "medcare_doctor_token";

export const doctorApi = {
  // Doctor Auth: Login
  async loginDoctor(data: {
    mciOrEmail: string;
    password: string;
    storeId?: string;
  }): Promise<{
    success: boolean;
    message: string;
    token: string;
    doctor: DoctorAuthUser;
  }> {
    const res = await fetch(`${API_BASE_URL}/doctor/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Invalid doctor credentials");

    if (typeof window !== "undefined" && json.token && json.doctor) {
      localStorage.setItem(DOCTOR_TOKEN_KEY, json.token);
      localStorage.setItem(DOCTOR_SESSION_KEY, JSON.stringify(json.doctor));
    }
    return json;
  },

  // Doctor Auth: Get demo doctors list for fast 1-click test login
  async getRegisteredDoctors(): Promise<{
    success: boolean;
    doctors: Array<Omit<DoctorAuthUser, "storeId" | "storeName">>;
  }> {
    const res = await fetch(`${API_BASE_URL}/doctor/registered-list`, {
      method: "GET",
      cache: "no-store",
    });
    return res.json();
  },

  // Get active stores for doctor dispensary assignment
  async getDoctorStores(): Promise<{
    success: boolean;
    stores: Array<{ id: string; name: string; city: string; phone: string }>;
  }> {
    const res = await fetch(`${API_BASE_URL}/doctor/stores`, {
      method: "GET",
      cache: "no-store",
    });
    return res.json();
  },

  // Local doctor session helpers
  getStoredDoctorSession(): DoctorAuthUser | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(DOCTOR_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  clearDoctorSession(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(DOCTOR_SESSION_KEY);
      localStorage.removeItem(DOCTOR_TOKEN_KEY);
    }
  },

  async getDoctorMedicines(params?: {
    q?: string;
    storeId?: string;
    limit?: number;
  }): Promise<{ success: boolean; count: number; medicines: DoctorFormularyMedicine[] }> {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.storeId) query.set("storeId", params.storeId);
    if (params?.limit) query.set("limit", String(params.limit));

    const res = await fetch(`${API_BASE_URL}/doctor/medicines?${query.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async getPatientClinicalHistory(params: {
    query?: string;
    customerId?: string;
    storeId?: string;
  }): Promise<{ success: boolean; patient: PatientClinicalDossier | null; message?: string }> {
    const query = new URLSearchParams();
    if (params.query) query.set("query", params.query);
    if (params.customerId) query.set("customerId", params.customerId);
    if (params.storeId) query.set("storeId", params.storeId);

    const res = await fetch(`${API_BASE_URL}/doctor/patient-history?${query.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async createDoctorPrescription(
    data: CreateDoctorPrescriptionPayload
  ): Promise<{
    success: boolean;
    message: string;
    prescriptionId: string;
    rxNumber: string;
    prescription: any;
  }> {
    const res = await fetch(`${API_BASE_URL}/doctor/prescriptions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to issue prescription");
    return json;
  },

  async getPendingDoctorRxQueue(params?: {
    storeId?: string;
  }): Promise<{ success: boolean; count: number; pendingRxList: PendingQueueRxItem[] }> {
    const query = new URLSearchParams();
    if (params?.storeId) query.set("storeId", params.storeId);

    const res = await fetch(`${API_BASE_URL}/doctor/pending-pos-queue?${query.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async getAllPrescriptions(params?: {
    storeId?: string;
    q?: string;
    limit?: number;
  }): Promise<{ success: boolean; prescriptions: any[] }> {
    const query = new URLSearchParams();
    if (params?.storeId) query.set("storeId", params.storeId);
    if (params?.q) query.set("q", params.q);
    if (params?.limit) query.set("limit", String(params.limit));

    const res = await fetch(`${API_BASE_URL}/prescriptions?${query.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },

  async getAllPatients(params?: {
    storeId?: string;
    q?: string;
  }): Promise<{ success: boolean; customers: any[] }> {
    const query = new URLSearchParams();
    if (params?.storeId) query.set("storeId", params.storeId);
    if (params?.q) query.set("q", params.q);

    const res = await fetch(`${API_BASE_URL}/customers?${query.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return res.json();
  },
};
