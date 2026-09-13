import React from "react";
import type { Metadata } from "next";
import { ResetPasswordView } from "@/components/auth/ResetPasswordView";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Reset Password — ${SITE_NAME}`,
  description: `Choose a new secure password for your ${SITE_NAME} account.`,
  alternates: {
    canonical: `${SITE_URL}/reset-password`,
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResetPasswordPage() {
  return <ResetPasswordView />;
}
