"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SignUpPageView } from "@/components/auth/SignUpPageView";
import { ConfirmationCodeView } from "@/components/auth/ConfirmationCodeView";

interface PendingSignUpData {
  email: string;
  password: string;
  username: string;
  fullName: string;
  dob: { day: string; month: string; year: string };
}

export default function SignUpPage() {
  const router = useRouter();
  const { user, signUpWithEmail } = useAuth();

  const [step, setStep] = useState<"form" | "confirm">("form");
  const [formData, setFormData] = useState<PendingSignUpData | null>(null);

  // If already logged in, redirect to home feed
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleProceedToConfirm = (data: PendingSignUpData) => {
    setFormData(data);
    setStep("confirm");
  };

  const handleConfirmCode = async (code: string): Promise<{ error?: string } | void> => {
    if (!formData) {
      return { error: "Missing registration details. Please restart." };
    }

    // Demo/any valid code simulation or Supabase signup
    const res = await signUpWithEmail(formData.email, formData.password, formData.username);
    if (res && res.error) {
      return { error: res.error };
    }

    // Successfully verified & logged in -> navigate to world feed
    router.push("/");
  };

  if (step === "confirm" && formData) {
    return (
      <ConfirmationCodeView
        email={formData.email}
        onBack={() => setStep("form")}
        onConfirm={handleConfirmCode}
        onResend={() => {
          console.log("Resending confirmation code to:", formData.email);
        }}
      />
    );
  }

  return (
    <SignUpPageView
      onProceedToConfirm={handleProceedToConfirm}
      onBackToLogin={() => router.push("/login")}
    />
  );
}
