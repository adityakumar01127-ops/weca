import React from "react";
import type { Metadata } from "next";
import { AuthConsole } from "@/components/auth/AuthConsole";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Create Account — Join the Anomaly Spotters",
  description:
 `Join ${SITE_NAME} to document authentic candid anomalies, earn Weird Credits, climb the global leaderboard, and verify strange phenomena.`,
  alternates: {
    canonical: `${SITE_URL}/signup`,
  },
};

export default function SignUpPage() {
  return <AuthConsole initialMode="signup" />;
}
