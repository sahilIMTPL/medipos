import { API_BASE_URL, getAuthHeaders } from "./client";

export interface PatientVerificationData {
  verified: boolean;
  idType: "ABHA" | "AADHAAR";
  idNumber: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  abhaAddress?: string;
  mobile: string;
  state: string;
  district: string;
  verificationTimestamp: string;
  digilockerRefId: string;
}

export interface DoctorVerificationData {
  verified: boolean;
  doctorName: string;
  registrationNumber: string;
  stateMedicalCouncil: string;
  yearOfRegistration: number;
  qualification: string;
  status: "ACTIVE" | "EXPIRED" | "SUSPENDED";
  verifiedAt: string;
  digilockerDocUri: string;
}

export interface VaultDocument {
  id: string;
  docType: string;
  title: string;
  issuingAuthority: string;
  documentNumber: string;
  validFrom: string;
  validUpto?: string;
  status: "VERIFIED" | "ACTIVE" | "RENEWAL_DUE";
  digilockerUri: string;
  fileSize: string;
  downloadUrl: string;
}

export interface DigiLockerVaultResponse {
  success: boolean;
  store: {
    name: string;
    gstin?: string;
    drugLicenseNo?: string;
    digilockerOrgName: string;
    digilockerMode: "SANDBOX" | "PRODUCTION";
  };
  documents: VaultDocument[];
}

export interface DigiLockerStatusResponse {
  success: boolean;
  enabled: boolean;
  mode: "SANDBOX" | "PRODUCTION";
  orgName: string;
  hasCredentials: boolean;
  gatewayStatus: "CONNECTED" | "DISCONNECTED";
  capabilities: string[];
}

export const digilockerApi = {
  getStatus: async (): Promise<DigiLockerStatusResponse> => {
    const res = await fetch(`${API_BASE_URL}/digilocker/status`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch DigiLocker status");
    return res.json();
  },

  getVault: async (): Promise<DigiLockerVaultResponse> => {
    const res = await fetch(`${API_BASE_URL}/digilocker/vault`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch DigiLocker compliance vault");
    return res.json();
  },

  verifyPatient: async (data: {
    idType: "ABHA" | "AADHAAR";
    idNumber: string;
    customerId?: string;
  }): Promise<{ success: boolean; verification: PatientVerificationData }> => {
    const res = await fetch(`${API_BASE_URL}/digilocker/verify-patient`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "DigiLocker patient verification failed");
    }
    return res.json();
  },

  verifyDoctor: async (data: {
    doctorName: string;
    regNumber: string;
    stateCouncil?: string;
  }): Promise<{ success: boolean; doctor: DoctorVerificationData }> => {
    const res = await fetch(`${API_BASE_URL}/digilocker/verify-doctor`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Doctor registration verification failed");
    }
    return res.json();
  },

  pushInvoice: async (invoiceId: string): Promise<{
    success: boolean;
    receipt: {
      docId: string;
      digilockerUri: string;
      pushedAt: string;
      recipientAbha: string;
      message: string;
    };
  }> => {
    const res = await fetch(`${API_BASE_URL}/digilocker/push-invoice`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId }),
    });
    if (!res.ok) throw new Error("Failed to push invoice to DigiLocker");
    return res.json();
  },

  updateConfig: async (config: {
    enabled?: boolean;
    clientId?: string;
    clientSecret?: string;
    orgName?: string;
    mode?: "SANDBOX" | "PRODUCTION";
  }): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_BASE_URL}/digilocker/config`, {
      method: "PUT",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error("Failed to update DigiLocker config");
    return res.json();
  },
};
