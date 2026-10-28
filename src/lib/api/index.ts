// MediPOS Consolidated API Client Barrel & Exports

import { authApi } from "./auth.api";
import { dashboardApi } from "./dashboard.api";
import { storesApi } from "./stores.api";
import { productsApi } from "./products.api";
import { categoriesApi } from "./categories.api";
import { unitsApi } from "./units.api";
import { suppliersApi } from "./suppliers.api";
import { purchasesApi } from "./purchases.api";
import { batchesApi } from "./batches.api";
import { salesApi } from "./sales.api";
import { customersApi } from "./customers.api";
import { salesReturnsApi } from "./sales-returns.api";
import { purchaseReturnsApi } from "./purchase-returns.api";
import { inventoryApi } from "./inventory.api";
import { reportsApi } from "./reports.api";
import { notificationsApi } from "./notifications.api";
import { auditLogsApi } from "./audit-logs.api";
import { superAdminApi } from "./super-admin.api";
import { prescriptionsApi } from "./prescriptions.api";
import { doctorApi } from "./doctor.api";
import { gstApi } from "./gst.api";
import { digilockerApi } from "./digilocker.api";
import { accountingApi } from "./accounting.api";
import { drugcentralApi } from "./drugcentral.api";
import { usersApi } from "./users.api";

// Re-export all domain API modules
export * from "./client";
export * from "./types";
export * from "./users.api";
export * from "./super-admin.api";
export * from "./auth.api";
export * from "./dashboard.api";
export * from "./stores.api";
export * from "./products.api";
export * from "./categories.api";
export * from "./units.api";
export * from "./suppliers.api";
export * from "./purchases.api";
export * from "./batches.api";
export * from "./sales.api";
export * from "./customers.api";
export * from "./prescriptions.api";
export * from "./doctor.api";
export * from "./sales-returns.api";
export * from "./purchase-returns.api";
export * from "./inventory.api";
export * from "./reports.api";
export * from "./notifications.api";
export * from "./audit-logs.api";
export * from "./gst.api";
export * from "./digilocker.api";
export * from "./accounting.api";
export * from "./drugcentral.api";

// Consolidated `api` singleton preserving full backward-compatibility
export const api = {
  ...authApi,
  ...dashboardApi,
  ...storesApi,
  ...productsApi,
  ...categoriesApi,
  ...unitsApi,
  ...suppliersApi,
  ...purchasesApi,
  ...batchesApi,
  ...salesApi,
  ...customersApi,
  ...prescriptionsApi,
  ...doctorApi,
  ...salesReturnsApi,
  ...purchaseReturnsApi,
  ...inventoryApi,
  ...reportsApi,
  ...notificationsApi,
  ...auditLogsApi,
  ...superAdminApi,
  ...gstApi,
  ...digilockerApi,
  ...accountingApi,
  ...drugcentralApi,
  ...usersApi,
};

export default api;
