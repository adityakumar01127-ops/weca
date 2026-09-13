import React from "react";
import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { ProView } from "@/components/pro/ProView";
import { Sparkles } from "lucide-react";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Hunter Pro & Brand Marketplace — Subscriptions & Licensing",
  description:
    "Upgrade to Hunter Pro for raw Gemini Vision tensor metrics and 4K downloads, or license candid real-world anomalies for commercial campaigns.",
  alternates: {
    canonical: `${SITE_URL}/pro`,
  },
  openGraph: {
    title: `${SITE_NAME} Pro & Brand Marketplace — Subscriptions & Licensing | ${SITE_NAME}`,
    description:
      "Upgrade to Hunter Pro for raw Gemini Vision tensor metrics and 4K downloads, or license candid real-world anomalies for commercial campaigns.",
    url: `${SITE_URL}/pro`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} Pro & Brand Marketplace — Subscriptions & Licensing | ${SITE_NAME}`,
    description:
      "Upgrade to Hunter Pro for raw Gemini Vision tensor metrics and 4K downloads, or license candid real-world anomalies for commercial campaigns.",
  },
};

export default function ProPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Weca Pro & Marketplace", path: "/pro" },
        ]}
      />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Title Header */}
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet/10 border border-violet/20 text-violet text-xs font-mono mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hunter Pro & Brand Licensing</span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-zinc-900 dark:text-white tracking-tight leading-[1.1] mb-3">
            Weca Pro: Power the <span className="underline decoration-violet decoration-wavy underline-offset-6">Archive.</span>
          </h1>

          <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">
            Whether you are an observational researcher wanting raw 5-D vision telemetry or a creative studio licensing candid physical anomalies for global campaigns.
          </p>
        </div>

        {/* Pro View Component */}
        <ProView />
      </main>

      <Footer />
    </div>
  );
}
