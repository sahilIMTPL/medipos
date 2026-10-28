import { API_BASE_URL, getAuthHeaders } from "./client";

export interface GstSummaryResponse {
  success: boolean;
  scheme: {
    currentScheme: "REGULAR" | "COMPOSITION";
    filingFrequency: "MONTHLY" | "QRMP_QUARTERLY";
    stateCode: string;
    gstin: string;
    isComposition: boolean;
    compositionRate: number;
    isEInvoicingEligible: boolean;
  };
  summary: {
    totalGrossSales: number;
    totalTaxableSales: number;
    nilRatedSales: number;
    exemptSales: number;
    totalOutputGst: number;
    adjustedOutputGst: number;
    outputCgst: number;
    outputSgst: number;
    outputIgst: number;
    totalTaxablePurchases: number;
    grossInputItc: number;
    itcReversals: number;
    netEligibleItc: number;
    salesReturnTaxAdjustment: number;
    netGstPayable: number;
    excessCreditCarryForward: number;
    compositionTaxPayable: number;
  };
  rateWiseSales: Record<
    string,
    {
      taxable: number;
      cgst: number;
      sgst: number;
      igst: number;
      totalTax: number;
      count: number;
    }
  >;
  counts: {
    invoices: number;
    purchases: number;
    returns: number;
    damagedMovements: number;
  };
}

export interface Gstr1Response {
  success: boolean;
  period: { from: string; to: string };
  b2b: {
    count: number;
    taxable: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
    invoices: Array<{
      invoiceNumber: string;
      invoiceDate: string;
      customerName: string;
      customerGstin: string;
      taxableValue: number;
      cgst: number;
      sgst: number;
      totalAmount: number;
      placeOfSupply: string;
    }>;
  };
  b2c: {
    count: number;
    taxable: number;
    cgst: number;
    sgst: number;
    total: number;
  };
  hsnSummary: Array<{
    hsnCode: string;
    description: string;
    uqc: string;
    totalQty: number;
    totalValue: number;
    taxableValue: number;
    rate: number;
    cgst: number;
    sgst: number;
    igst: number;
  }>;
}

export interface Gstr3bResponse {
  success: boolean;
  table31: {
    outwardTaxableSupplies: {
      taxableValue: number;
      integratedTax: number;
      centralTax: number;
      stateTax: number;
      cess: number;
    };
    nilRatedExempt: {
      taxableValue: number;
      integratedTax: number;
      centralTax: number;
      stateTax: number;
    };
  };
  table4: {
    itcAvailable: {
      allOtherItc: {
        integratedTax: number;
        centralTax: number;
        stateTax: number;
        totalItc: number;
      };
    };
    itcReversed: {
      asPerRules: number;
      others: number;
    };
    netItcAvailable: {
      centralTax: number;
      stateTax: number;
      total: number;
    };
  };
  table6: {
    taxPayable: {
      centralTax: number;
      stateTax: number;
      total: number;
    };
    paidThroughItc: {
      centralTax: number;
      stateTax: number;
    };
    paidInCashRequired: {
      centralTax: number;
      stateTax: number;
      totalCashRequired: number;
    };
  };
}

export interface Gstr2bReconciliationResponse {
  success: boolean;
  summary: {
    totalPurchaseBills: number;
    matchedCount: number;
    missingIn2BCount: number;
    mismatchCount: number;
    eligibleItcTotal: number;
  };
  reconciledInvoices: Array<{
    id: string;
    supplierName: string;
    supplierGstin: string;
    invoiceNumber: string;
    invoiceDate: string;
    bookTaxable: number;
    bookTax: number;
    gstr2bTaxable: number;
    gstr2bTax: number;
    matchStatus: "MATCHED" | "MISSING_IN_2B" | "VALUE_MISMATCH" | "INELIGIBLE_ITC";
    itcEligibility: "ELIGIBLE" | "INELIGIBLE" | "BLOCKED";
  }>;
}

export interface GstFilingSchedule {
  returnType: string;
  frequency: string;
  period: string;
  dueDate: string;
  description: string;
  applicable: boolean;
}

export interface GstFilingRecordItem {
  id: string;
  storeId: string;
  returnType: string;
  taxPeriod: string;
  financialYear: string;
  dueDate: string | null;
  filingDate: string | null;
  arnNumber: string | null;
  status: "PENDING" | "READY" | "FILED";
  taxableSales: number;
  outputTax: number;
  inputItc: number;
  netTaxPaid: number;
  digilockerDocId: string | null;
  notes: string | null;
}

export interface GstFilingsResponse {
  success: boolean;
  scheme: string;
  frequency: string;
  schedules: GstFilingSchedule[];
  filingRecords: GstFilingRecordItem[];
}

export const gstApi = {
  getSummary: async (params?: { from?: string; to?: string }): Promise<GstSummaryResponse> => {
    const query = new URLSearchParams();
    if (params?.from) query.append("from", params.from);
    if (params?.to) query.append("to", params.to);
    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/gst/summary${qs}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch GST summary");
    return res.json();
  },

  getGstr1: async (params?: { from?: string; to?: string }): Promise<Gstr1Response> => {
    const query = new URLSearchParams();
    if (params?.from) query.append("from", params.from);
    if (params?.to) query.append("to", params.to);
    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/gst/gstr1${qs}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch GSTR-1 outward supplies");
    return res.json();
  },

  getGstr3b: async (params?: { from?: string; to?: string }): Promise<Gstr3bResponse> => {
    const query = new URLSearchParams();
    if (params?.from) query.append("from", params.from);
    if (params?.to) query.append("to", params.to);
    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/gst/gstr3b${qs}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch GSTR-3B tax computation");
    return res.json();
  },

  getGstr2bReconciliation: async (params?: { from?: string; to?: string }): Promise<Gstr2bReconciliationResponse> => {
    const query = new URLSearchParams();
    if (params?.from) query.append("from", params.from);
    if (params?.to) query.append("to", params.to);
    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/gst/gstr2b-reconciliation${qs}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch GSTR-2B reconciliation");
    return res.json();
  },

  getFilings: async (): Promise<GstFilingsResponse> => {
    const res = await fetch(`${API_BASE_URL}/gst/filings`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch statutory filings");
    return res.json();
  },

  saveFilingRecord: async (data: {
    returnType: string;
    taxPeriod: string;
    arnNumber?: string;
    filingDate?: string;
    status?: string;
    netTaxPaid?: number;
    notes?: string;
  }): Promise<{ success: boolean; message: string; record: GstFilingRecordItem }> => {
    const res = await fetch(`${API_BASE_URL}/gst/filings`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to save filing record");
    return res.json();
  },

  getExportSalesRegisterUrl: (params?: { from?: string; to?: string }): string => {
    const query = new URLSearchParams();
    if (params?.from) query.append("from", params.from);
    if (params?.to) query.append("to", params.to);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return `${API_BASE_URL}/gst/export/sales-register${qs}`;
  },
};
