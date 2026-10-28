// MediPOS API Data Models and Type Definitions

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    username: string;
    fullName: string;
    role: "ADMIN" | "SUPER_ADMIN" | "CASHIER";
  };
  store?: {
    id: string;
    name: string;
    code: string;
    city?: string;
    gstin?: string;
    drugLicenseNo?: string;
  };
  assignedStores?: Array<{
    id: string;
    name: string;
    code: string;
    city?: string;
    isDefault?: boolean;
  }>;
}

export interface DashboardStatsResponse {
  success: boolean;
  store: {
    id: string;
    name: string;
    code: string;
    city?: string;
  };
  kpis: {
    todaySales: {
      amount: string;
      rawAmount: number;
      invoiceCount: number;
      percentChange: string;
      isPositive: boolean;
    };
    todayPurchases: {
      amount: string;
      rawAmount: number;
      invoiceCount: number;
      percentChange: string;
      isPositive: boolean;
    };
    currentStockValue: {
      amount: string;
      rawAmount: number;
      itemCount: string;
    };
    lowStock: {
      count: number;
    };
    expiringSoon: {
      count: number;
    };
    expired: {
      count: number;
    };
  };
  chartDays: Array<{
    day: string;
    sales: number;
    purchases: number;
    salesVal: string;
    purVal: string;
  }>;
  topMedicines: Array<{
    rank: number;
    name: string;
    qty: number;
    amount: string;
  }>;
  recentInvoices: Array<{
    invoiceNo: string;
    time: string;
    customer: string;
    amount: string;
  }>;
}

export interface ProductItem {
  id: string;
  name: string;
  brandName: string;
  genericName: string;
  manufacturer: string;
  categoryId?: string;
  categoryName: string;
  dosageForm: string;
  strength: string;
  packDescription: string;
  sku: string;
  barcode: string;
  hsnCode: string;
  gstRate: number;
  mrp: number;
  defaultPurchasePrice: number;
  defaultSellingPrice: number;
  baseUnitId?: string;
  saleUnitId?: string;
  baseUnit: string;
  purchaseUnit: string;
  saleUnit: string;
  reorderLevel: number;
  isPrescriptionRequired: boolean;
  isActive: boolean;
  totalBaseStock: number;
  totalPacks: number;
  isLowStock: boolean;
  batches: Array<{
    id: string;
    batchNumber: string;
    mfgDate?: string | null;
    expiryDate: string;
    availableQty: number;
    mrp: number;
    purchasePrice: number;
  }>;
  conversions?: Array<{
    fromUnit: string;
    toUnit: string;
    factor: number;
  }>;
}

export interface CategoryItem {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  productCount: number;
}

export interface SupplierItem {
  id: string;
  businessName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  drugLicenseNo: string;
  paymentTerms: string;
  openingBalance: number;
  currentBalance: number;
  totalPurchases: number;
  totalPaid: number;
  invoiceCount: number;
  isActive: boolean;
  notes: string;
  createdAt: string;
}

export interface PurchaseItemDetail {
  id: string;
  invoiceNumber: string;
  supplierInvoiceNumber: string;
  supplierId: string;
  supplierName: string;
  supplierPhone?: string;
  supplierGstin?: string;
  supplier?: {
    id: string;
    businessName: string;
    contactPerson?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    gstin?: string | null;
    drugLicenseNo?: string | null;
  };
  invoiceDate: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
  status: string;
  itemCount: number;
  items?: Array<{
    id: string;
    productId: string;
    productName: string;
    genericName?: string;
    sku: string;
    packDescription: string;
    batchNumber: string;
    mfgDate?: string | null;
    expiryDate: string;
    purchaseQty: number;
    unit: string;
    conversionFactor: number;
    baseQuantity: number;
    baseUnit: string;
    unitRate: number;
    discountAmount: number;
    gstRate: number;
    gstAmount: number;
    totalAmount: number;
  }>;
  payments?: Array<{
    id: string;
    voucherNumber?: string;
    receiptNumber?: string;
    date: string;
    amount: number;
    paymentMethod: string;
    referenceNumber?: string;
    ref?: string;
  }>;
  store?: {
    name: string;
    address?: string;
    city?: string;
    phone?: string;
    gstin?: string;
    drugLicenseNo?: string;
  };
}

export interface BatchItem {
  id: string;
  batchNumber: string;
  productId: string;
  productName: string;
  genericName: string;
  categoryName: string;
  packDescription: string;
  baseUnit: string;
  saleUnit: string;
  conversionFactor: number;
  mfgDate?: string | null;
  expiryDate: string;
  daysRemaining: number;
  expiryCategory: "EXPIRED" | "CRITICAL" | "WARNING" | "HEALTHY";
  purchasePrice: number;
  mrp: number;
  receivedQty: number;
  availableQty: number;
  availablePacks: number;
  status: "ACTIVE" | "EXPIRED" | "QUARANTINED";
  supplierId?: string;
  supplierName: string;
}

export interface CustomerSaleSummary {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  itemCount: number;
  grandTotal: number;
  paidAmount: number;
  paymentStatus: string;
  paymentMethod: string;
}

export interface CustomerStats {
  totalCustomers: number;
  totalOrders: number;
  totalSales: number;
  newCustomersThisMonth: number;
}

export interface CustomerItem {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt?: string;
  invoiceCount?: number;
  totalOrders?: number;
  totalPaid?: number;
  lastPurchase?: string | null;
  salesInvoices?: CustomerSaleSummary[];
}

export interface SalesInvoiceListItem {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerPhone?: string;
  doctorName?: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  itemCount: number;
  payments?: Array<{
    id: string;
    receiptNumber: string;
    amount: number;
    paymentMethod: string;
    date: string;
    ref?: string;
  }>;
}

export interface SalesInvoicePrintDetail {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  store: {
    name: string;
    address: string;
    city: string;
    phone: string;
    gstin: string;
    drugLicenseNo: string;
  };
  customer: {
    name: string;
    phone?: string;
    address?: string;
  };
  prescription?: {
    doctorName: string;
    doctorRegNo?: string;
    clinicName?: string;
  } | null;
  cashier: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  grandTotal: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  notes?: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    genericName?: string;
    hsnCode: string;
    packDescription?: string;
    batchNumber: string;
    expiryDate: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    discountType: string;
    discountValue: number;
    discountAmount: number;
    netRate: number;
    gstRate: number;
    gstAmount: number;
    subtotal: number;
    totalAmount: number;
  }>;
  payments: Array<{
    id: string;
    receiptNumber?: string;
    method: string;
    paymentMethod?: string;
    amount: number;
    reference?: string;
    date: string;
  }>;
}

export interface SalesReturnListItem {
  id: string;
  returnNumber: string;
  returnDate: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  originalInvoiceDate: string;
  customerName: string;
  customerPhone?: string;
  totalRefundAmount: number;
  refundMethod: string;
  reason: string;
  itemCount: number;
  items: Array<{
    id: string;
    productName: string;
    genericName?: string;
    batchNumber: string;
    returnQty: number;
    unit: string;
    refundAmount: number;
    isRestocked: boolean;
    reason: string;
  }>;
}

export interface EligibleReturnItem {
  salesItemId: string;
  productId: string;
  productName: string;
  genericName?: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  saleUnit: string;
  soldQuantity: number;
  previouslyReturnedQty: number;
  remainingReturnableQty: number;
  unitPrice: number;
  netRate: number;
  ratePerUnit: number;
  conversionFactor: number;
  canReturn: boolean;
}

export interface EligibleReturnInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerPhone?: string;
  grandTotal: number;
  paymentMethod: string;
  items: EligibleReturnItem[];
}

export interface SalesReturnPrintDetail {
  id: string;
  returnNumber: string;
  returnDate: string;
  originalInvoiceNumber: string;
  originalInvoiceDate: string;
  store: {
    name: string;
    address: string;
    city: string;
    phone: string;
    gstin: string;
    drugLicenseNo: string;
  };
  customer: {
    name: string;
    phone?: string;
  };
  refundMethod: string;
  totalRefundAmount: number;
  reason: string;
  items: Array<{
    id: string;
    productName: string;
    genericName?: string;
    hsnCode: string;
    batchNumber: string;
    expiryDate: string;
    unit: string;
    returnQty: number;
    refundAmount: number;
    isRestocked: boolean;
    reason: string;
  }>;
}

export interface PurchaseReturnListItem {
  id: string;
  returnNumber: string;
  returnDate: string;
  supplierId: string;
  supplierName: string;
  supplierPhone?: string;
  supplierGstin?: string;
  purchaseInvoiceNumber: string;
  totalAmount: number;
  reason: string;
  itemCount: number;
}

export interface PurchaseReturnPrintDetail {
  id: string;
  returnNumber: string;
  returnDate: string;
  purchaseInvoiceNumber: string;
  purchaseInvoiceDate?: string | null;
  store: {
    name: string;
    address: string;
    city: string;
    phone: string;
    gstin: string;
    drugLicenseNo: string;
  };
  supplier: {
    name: string;
    contactPerson?: string;
    phone?: string;
    address?: string;
    gstin?: string;
    drugLicenseNo?: string;
  };
  totalAmount: number;
  reason: string;
  items: Array<{
    id: string;
    productName: string;
    genericName?: string;
    hsnCode: string;
    batchNumber: string;
    expiryDate: string;
    returnQty: number;
    unit: string;
    unitRate: number;
    totalAmount: number;
    reason: string;
  }>;
}

export interface InventoryOverviewStats {
  totalValuationCost: number;
  totalValuationMrp: number;
  totalBaseUnits: number;
  totalProducts: number;
  totalBatches: number;
  lowStockCount: number;
  nearExpiryCount: number;
  expiredCount: number;
}

export interface StockLedgerItem {
  id: string;
  createdAt: string;
  productId: string;
  productName: string;
  genericName?: string;
  sku: string;
  batchNumber: string;
  expiryDate: string | null;
  movementType: "PURCHASE" | "SALE" | "SALE_RETURN" | "PURCHASE_RETURN" | "DAMAGE" | "EXPIRED_DISPOSAL" | "ADJUSTMENT";
  isInflow: boolean;
  isOutflow: boolean;
  quantity: number;
  baseQuantity: number;
  unitName: string;
  currentBatchStock: number;
  referenceType: string;
  referenceId: string;
  performedBy: string;
  reason: string;
}

export interface ReconciliationWorksheetItem {
  batchId: string;
  productId: string;
  productName: string;
  genericName: string;
  categoryName: string;
  batchNumber: string;
  expiryDate: string;
  systemQty: number;
  systemPacks: number;
  factor: number;
  baseUnit: string;
  saleUnit: string;
  mrp: number;
  purchasePrice: number;
}
