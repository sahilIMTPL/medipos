// Base HTTP Client & Configuration for MediPOS Frontend

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/**
 * Retrieve the current active store ID from localStorage
 */
export function getActiveStoreId(): string | null {
  if (typeof window === "undefined") return null;
  const storeId = localStorage.getItem("medipos_store_id");
  if (storeId) return storeId;
  try {
    const raw = localStorage.getItem("medipos_current_store");
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.id || null;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Constructs standard headers for API calls, including Bearer token and active Store Tenant header
 */
export function getAuthHeaders(extraHeaders?: Record<string, string>): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("medipos_token") : null;
  const storeId = getActiveStoreId();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(storeId ? { "x-store-id": storeId } : {}),
    ...(extraHeaders || {}),
  };
}
