import React from "react";
import type { Metadata } from "next";
import { VersusClient } from "@/components/versus/VersusClient";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Versus Arena — Head-to-Head Anomaly Battles",
  description:
    "Vote on head-to-head candid anomaly matchups. Back the stranger photograph, earn Weird Credits, and climb the Versus community accuracy rankings.",
  alternates: {
    canonical: `${SITE_URL}/versus`,
  },
  openGraph: {
    title: `Versus Arena — Head-to-Head Anomaly Battles | ${SITE_NAME}`,
    description:
      "Vote on head-to-head candid anomaly matchups. Back the stranger photograph and earn Weird Credits.",
    url: `${SITE_URL}/versus`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Versus Arena — Head-to-Head Anomaly Battles | ${SITE_NAME}`,
    description:
      "Vote on head-to-head candid anomaly matchups. Back the stranger photograph and earn Weird Credits.",
  },
};

export default function VersusPage() {
  return <VersusClient />;
}
