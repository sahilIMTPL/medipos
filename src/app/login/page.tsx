"use client";

import React from "react";
import { useRouter } from "next/navigation";
import LoginView from "@/components/LoginView";

export default function LoginPage() {
  const router = useRouter();

  return (
    <LoginView
      onSuccessLogin={(role) => {
        if (role === "SUPER_ADMIN") {
          router.push("/super-admin/dashboard");
        } else {
          router.push("/");
        }
      }}
      onNavigateToForgotPassword={() => router.push("/forgot-password")}
    />
  );
}
