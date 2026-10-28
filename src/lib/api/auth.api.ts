// Authentication API Client
import { API_BASE_URL } from "./client";
import { LoginResponse } from "./types";

export const authApi = {
  async login(emailOrUsername: string, password: string): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrUsername, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Authentication failed");
    }

    if (data.token) {
      localStorage.setItem("medipos_token", data.token);
      localStorage.setItem("medipos_user", JSON.stringify(data.user));
      if (data.store) {
        localStorage.setItem("medipos_store", JSON.stringify(data.store));
      }
    }

    return data;
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string; resetToken?: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (data.resetToken && typeof window !== "undefined") {
      sessionStorage.setItem("medipos_reset_token", data.resetToken);
    }
    return data;
  },

  async resetPassword(email: string, newPassword: string, resetToken?: string): Promise<{ success: boolean; message: string }> {
    const token = resetToken || (typeof window !== "undefined" ? sessionStorage.getItem("medipos_reset_token") : null);
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newPassword, resetToken: token }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to reset password");
    }
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("medipos_reset_token");
    }
    return data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const token = typeof window !== "undefined" ? localStorage.getItem("medipos_token") : null;
    const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to change password");
    }
    return data;
  },

  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("medipos_token");
      localStorage.removeItem("medipos_user");
      localStorage.removeItem("medipos_store");
    }
  },

  getStoredUser() {
    if (typeof window === "undefined") return null;
    const str = localStorage.getItem("medipos_user");
    return str ? JSON.parse(str) : null;
  },

  getStoredStore() {
    if (typeof window === "undefined") return null;
    const str = localStorage.getItem("medipos_store");
    return str ? JSON.parse(str) : null;
  },
};
