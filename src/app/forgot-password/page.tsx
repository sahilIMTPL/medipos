"use client";

import React from "react";
import { useRouter } from "next/navigation";
import ForgotPasswordView from "@/components/ForgotPasswordView";

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <ForgotPasswordView
      onBackToLogin={() => router.push("/login")}
      onProceedToReset={() => router.push("/reset-password")}
    />
  );
}
