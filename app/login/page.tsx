import React from "react";
import type { Metadata } from "next";
import { AuthConsole } from "@/components/auth/AuthConsole";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Sign In — Access the Anomaly Vault",
  description:
    `Sign in to ${SITE_NAME} to submit candid photographs, participate in Versus battles, and manage your Weird Credits rewards ledger.`,
  alternates: {
    canonical: `${SITE_URL}/login`,
  },
};

export default function LoginPage() {
  return <AuthConsole initialMode="signin" />;
}
