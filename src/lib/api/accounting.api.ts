import { API_BASE_URL, getAuthHeaders } from "./client";

export interface AccountItem {
  id: string;
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";
  currentBalance: number;
  description: string;
  isActive: boolean;
}

export interface JournalItemDto {
  id: string;
  code: string;
  name: string;
  type: "CASH" | "BANK" | "SALE" | "PURCHASE" | "GENERAL";
  defaultAccount: string | null;
  entryCount: number;
}

export interface JournalEntryLineDto {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  partnerType: string | null;
  partnerId: string | null;
  partnerName: string;
  label: string;
  debit: number;
  credit: number;
  reconciled: boolean;
  matchingNumber: string;
}

export interface JournalEntryDto {
  id: string;
  entryNumber: string;
  reference: string;
  date: string;
  journalName: string;
  journalCode: string;
  journalType: string;
  state: string;
  notes: string;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  items: JournalEntryLineDto[];
}

export interface AccountingDashboardStats {
  cashBankBalance: number;
  accountsReceivable: number;
  accountsPayable: number;
  inventoryValuation: number;
  salesRevenue: number;
  netProfitEstimate: number;
  openInvoicesCount: number;
  totalInvoicesDue: number;
  openBillsCount: number;
  totalBillsDue: number;
}

export interface GeneralLedgerLine {
  id: string;
  date: string;
  entryNumber: string;
  reference: string;
  journalCode: string;
  partnerName: string;
  label: string;
  debit: number;
  credit: number;
  balance: number;
  matchingNumber: string;
}

export interface GeneralLedgerAccount {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  totalDebit: number;
  totalCredit: number;
  endingBalance: number;
  lineCount: number;
  lines: GeneralLedgerLine[];
}

export interface PartnerLedgerLine {
  id: string;
  date: string;
  entryNumber: string;
  reference: string;
  journalCode: string;
  accountCode: string;
  label: string;
  debit: number;
  credit: number;
  runningBalance: number;
  matchingNumber: string;
  reconciled: boolean;
}

export interface PartnerLedgerEntry {
  partnerKey: string;
  partnerType: "CUSTOMER" | "SUPPLIER";
  partnerId: string | null;
  partnerName: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
  lines: PartnerLedgerLine[];
}

export interface InvoiceDueItem {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerPhone: string;
  customerId: string | null;
  grandTotal: number;
  paidAmount: number;
  remainingDue: number;
  paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
  payments: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    date: string;
    ref: string;
  }>;
}

export interface BillDueItem {
  id: string;
  invoiceNumber: string;
  supplierInvoiceNumber: string;
  invoiceDate: string;
  supplierId: string;
  supplierName: string;
  supplierPhone: string;
  totalAmount: number;
  paidAmount: number;
  remainingDue: number;
  paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
  payments: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    date: string;
    ref: string;
  }>;
}

export interface UnreconciledItem {
  id: string;
  date: string;
  entryNumber: string;
  reference: string;
  journalCode: string;
  accountCode: string;
  accountName: string;
  partnerType: string | null;
  partnerId: string | null;
  partnerName: string;
  label: string;
  debit: number;
  credit: number;
}

export interface AccountingAuditLogChange {
  field: string;
  label: string;
  from: any;
  to: any;
}

export interface AccountingAuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: {
    accountCode?: string;
    accountName?: string;
    journalCode?: string;
    journalName?: string;
    entryNumber?: string;
    invoiceNumber?: string;
    customerName?: string;
    supplierName?: string;
    billNumber?: string;
    changes?: AccountingAuditLogChange[];
    [key: string]: any;
  };
  createdAt: string;
  actorName: string;
  actorRole: string;
  ipAddress: string;
}

export const accountingApi = {
  // 1. Dashboard
  async getAccountingDashboard(storeId?: string): Promise<{ success: boolean; stats: AccountingDashboardStats; recentEntries: any[] }> {
    const query = storeId ? `?storeId=${storeId}` : "";
    const res = await fetch(`${API_BASE_URL}/accounting/dashboard${query}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load accounting dashboard");
    return res.json();
  },

  // 2. Chart of Accounts
  async getChartOfAccounts(storeId?: string): Promise<{ success: boolean; accounts: AccountItem[] }> {
    const query = storeId ? `?storeId=${storeId}` : "";
    const res = await fetch(`${API_BASE_URL}/accounting/accounts${query}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load chart of accounts");
    return res.json();
  },

  async createAccount(data: { code: string; name: string; type: string; description?: string; openingBalance?: number; storeId?: string }) {
    const res = await fetch(`${API_BASE_URL}/accounting/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to create account");
    return json;
  },

  // 3. Journals
  async getJournals(storeId?: string): Promise<{ success: boolean; journals: JournalItemDto[] }> {
    const query = storeId ? `?storeId=${storeId}` : "";
    const res = await fetch(`${API_BASE_URL}/accounting/journals${query}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load journals");
    return res.json();
  },

  // 4. Journal Entries
  async getJournalEntries(params?: {
    journalId?: string;
    startDate?: string;
    endDate?: string;
    q?: string;
    limit?: number;
    storeId?: string;
  }): Promise<{ success: boolean; entries: JournalEntryDto[] }> {
    const searchParams = new URLSearchParams();
    if (params?.journalId) searchParams.append("journalId", params.journalId);
    if (params?.startDate) searchParams.append("startDate", params.startDate);
    if (params?.endDate) searchParams.append("endDate", params.endDate);
    if (params?.q) searchParams.append("q", params.q);
    if (params?.limit) searchParams.append("limit", String(params.limit));
    if (params?.storeId) searchParams.append("storeId", params.storeId);

    const qs = searchParams.toString();
    const res = await fetch(`${API_BASE_URL}/accounting/journal-entries${qs ? `?${qs}` : ""}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load journal entries");
    return res.json();
  },

  // 5. General Ledger
  async getGeneralLedger(params?: {
    accountId?: string;
    startDate?: string;
    endDate?: string;
    storeId?: string;
  }): Promise<{ success: boolean; report: GeneralLedgerAccount[] }> {
    const searchParams = new URLSearchParams();
    if (params?.accountId) searchParams.append("accountId", params.accountId);
    if (params?.startDate) searchParams.append("startDate", params.startDate);
    if (params?.endDate) searchParams.append("endDate", params.endDate);
    if (params?.storeId) searchParams.append("storeId", params.storeId);

    const qs = searchParams.toString();
    const res = await fetch(`${API_BASE_URL}/accounting/general-ledger${qs ? `?${qs}` : ""}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load general ledger");
    return res.json();
  },

  // 6. Partner Ledger
  async getPartnerLedger(params?: {
    partnerType?: "CUSTOMER" | "SUPPLIER" | "ALL";
    partnerId?: string;
    startDate?: string;
    endDate?: string;
    storeId?: string;
  }): Promise<{ success: boolean; partners: PartnerLedgerEntry[] }> {
    const searchParams = new URLSearchParams();
    if (params?.partnerType) searchParams.append("partnerType", params.partnerType);
    if (params?.partnerId) searchParams.append("partnerId", params.partnerId);
    if (params?.startDate) searchParams.append("startDate", params.startDate);
    if (params?.endDate) searchParams.append("endDate", params.endDate);
    if (params?.storeId) searchParams.append("storeId", params.storeId);

    const qs = searchParams.toString();
    const res = await fetch(`${API_BASE_URL}/accounting/partner-ledger${qs ? `?${qs}` : ""}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load partner ledger");
    return res.json();
  },

  // 7. Invoices Due
  async getInvoicesDue(storeId?: string): Promise<{ success: boolean; invoices: InvoiceDueItem[] }> {
    const query = storeId ? `?storeId=${storeId}` : "";
    const res = await fetch(`${API_BASE_URL}/accounting/invoices-due${query}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load due invoices");
    return res.json();
  },

  // 8. Vendor Bills Due
  async getBillsDue(storeId?: string): Promise<{ success: boolean; bills: BillDueItem[] }> {
    const query = storeId ? `?storeId=${storeId}` : "";
    const res = await fetch(`${API_BASE_URL}/accounting/bills-due${query}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load due bills");
    return res.json();
  },

  // 9. Register Customer Payment
  async registerCustomerPayment(
    data: {
      salesInvoiceId: string;
      amount: number;
      paymentMethod: "CASH" | "UPI" | "CARD" | "CREDIT";
      paymentDate?: string;
      referenceNumber?: string;
      notes?: string;
    },
    idempotencyKey?: string
  ) {
    const res = await fetch(`${API_BASE_URL}/accounting/customer-payments`, {
      method: "POST",
      headers: getAuthHeaders(
        idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : undefined
      ),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to record payment");
    return json;
  },

  // 10. Register Vendor Payment
  async registerVendorPayment(
    data: {
      supplierId: string;
      purchaseInvoiceId?: string;
      amount: number;
      paymentMethod: "CASH" | "UPI" | "CARD" | "CREDIT";
      paymentDate?: string;
      referenceNumber?: string;
      notes?: string;
    },
    idempotencyKey?: string
  ) {
    const res = await fetch(`${API_BASE_URL}/accounting/vendor-payments`, {
      method: "POST",
      headers: getAuthHeaders(
        idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : undefined
      ),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to record payment");
    return json;
  },

  // 11. Unreconciled Items
  async getUnreconciledItems(params?: { partnerType?: string; storeId?: string }): Promise<{ success: boolean; items: UnreconciledItem[] }> {
    const searchParams = new URLSearchParams();
    if (params?.partnerType) searchParams.append("partnerType", params.partnerType);
    if (params?.storeId) searchParams.append("storeId", params.storeId);

    const qs = searchParams.toString();
    const res = await fetch(`${API_BASE_URL}/accounting/unreconciled${qs ? `?${qs}` : ""}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load unreconciled items");
    return res.json();
  },

  // 12. Reconcile Items
  async reconcileJournalItems(itemIds: string[]): Promise<{ success: boolean; matchingNumber: string; itemCount: number }> {
    const res = await fetch(`${API_BASE_URL}/accounting/reconcile`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ itemIds }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Reconciliation failed");
    return json;
  },

  // 13. Sync Historical Entries
  async syncHistoricalAccountingEntries(storeId?: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/accounting/sync-historical-entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ storeId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Historical sync failed");
    return json;
  },

  // 14. Update Account
  async updateAccount(id: string, data: { name?: string; description?: string; isActive?: boolean; currentBalance?: number }) {
    const res = await fetch(`${API_BASE_URL}/accounting/accounts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to update account");
    return json;
  },

  // 15. Update Journal
  async updateJournal(id: string, data: { name?: string; code?: string; defaultAccountId?: string }) {
    const res = await fetch(`${API_BASE_URL}/accounting/journals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to update journal");
    return json;
  },

  // 16. Update Journal Entry
  async updateJournalEntry(id: string, data: { reference?: string; narration?: string; status?: string; date?: string }) {
    const res = await fetch(`${API_BASE_URL}/accounting/journal-entries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to update journal entry");
    return json;
  },

  // 17. Update Payment (Customer or Vendor)
  async updatePayment(
    id: string,
    data: {
      paymentType: "CUSTOMER" | "VENDOR";
      amount?: number;
      paymentMethod?: string;
      paymentDate?: string;
      referenceNumber?: string;
      notes?: string;
    }
  ) {
    const res = await fetch(`${API_BASE_URL}/accounting/payments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to update payment");
    return json;
  },

  // 18. Get Accounting Audit Logs
  async getAccountingAuditLogs(params?: { entity?: string; search?: string; limit?: number }): Promise<{ success: boolean; logs: AccountingAuditLogItem[] }> {
    const searchParams = new URLSearchParams();
    if (params?.entity) searchParams.append("entity", params.entity);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.limit) searchParams.append("limit", String(params.limit));

    const qs = searchParams.toString();
    const res = await fetch(`${API_BASE_URL}/accounting/audit-logs${qs ? `?${qs}` : ""}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load accounting audit logs");
    return res.json();
  },

  // 19. Get Unified Payments (Customer Receipts & Vendor Disbursements)
  async getPayments(params?: {
    type?: "ALL" | "CUSTOMER" | "VENDOR";
    paymentMethod?: string;
    q?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<{ success: boolean; payments: UnifiedPaymentItem[]; summary: PaymentsSummary }> {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.append("type", params.type);
    if (params?.paymentMethod && params.paymentMethod !== "ALL") searchParams.append("paymentMethod", params.paymentMethod);
    if (params?.q) searchParams.append("q", params.q);
    if (params?.startDate) searchParams.append("startDate", params.startDate);
    if (params?.endDate) searchParams.append("endDate", params.endDate);
    if (params?.limit) searchParams.append("limit", String(params.limit));

    const qs = searchParams.toString();
    const res = await fetch(`${API_BASE_URL}/accounting/payments${qs ? `?${qs}` : ""}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load payments list");
    return res.json();
  },

  // 20. Get Payment Details for Official GST Voucher / Receipt
  async getPaymentById(id: string): Promise<{ success: boolean; payment: UnifiedPaymentItem }> {
    const res = await fetch(`${API_BASE_URL}/accounting/payments/${id}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to load payment voucher");
    return json;
  },
};

export interface UnifiedPaymentItem {
  id: string;
  paymentNumber: string;
  paymentType: "CUSTOMER" | "VENDOR";
  date: string;
  amount: number;
  amountInWords: string;
  paymentMethod: string;
  transactionRef: string;
  notes: string;
  partnerId: string;
  partnerName: string;
  partnerPhone: string;
  partnerAddress: string;
  partnerGstin: string;
  partnerType: "CUSTOMER" | "SUPPLIER";
  invoiceId: string | null;
  invoiceNumber: string;
  invoiceTotal: number;
  invoicePaid: number;
  invoiceBalanceRemaining: number;
  invoiceStatus: string;
  store: {
    id?: string;
    name: string;
    code?: string;
    address: string;
    city: string;
    state?: string;
    pincode?: string;
    phone: string;
    email?: string;
    gstin: string;
    drugLicenseNo: string;
  };
  installments?: Array<{
    id: string;
    amount: number;
    date: string;
    method: string;
    ref: string;
  }>;
  previewItems?: Array<{
    productName: string;
    hsn: string;
    batch: string;
    qty: number;
    rate: number;
    total: number;
  }>;
}

export interface PaymentsSummary {
  totalReceipts: number;
  totalDisbursements: number;
  netCashflow: number;
  count: number;
}

