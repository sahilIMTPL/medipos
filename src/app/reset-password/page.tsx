"use client";

import React from "react";
import { useRouter } from "next/navigation";
import ResetPasswordView from "@/components/ResetPasswordView";

export default function ResetPasswordPage() {
  const router = useRouter();

  return (
    <ResetPasswordView
      onSuccessReset={() => router.push("/login")}
      onBackToLogin={() => router.push("/login")}
    />
  );
}
