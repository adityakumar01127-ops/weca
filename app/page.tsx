import React from "react";
import type { Metadata } from "next";
import { FeedClient } from "@/components/feed/FeedClient";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    absolute: `${SITE_NAME} — The Global Weirdness Index & Candid Anomaly Feed`,
  },
  description:
    "Explore authentic, candid real-world photographs scored 0-100 by multimodal Gemini Vision for surrealism and uniqueness. The antidote to synthetic slop.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${SITE_NAME} — The Global Weirdness Index & Candid Anomaly Feed`,
    description:
      "Explore authentic, candid real-world photographs scored by multimodal AI for weirdness and rarity.",
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — The Global Weirdness Index & Candid Anomaly Feed`,
    description:
      "Explore authentic, candid real-world photographs scored by multimodal AI for weirdness and rarity.",
  },
};

export default function FeedPage() {
  return <FeedClient />;
}
