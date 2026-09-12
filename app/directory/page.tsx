import React from "react";
import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { AnomalyDirectoryClient } from "@/components/directory/AnomalyDirectoryClient";
import { BookOpen } from "lucide-react";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Anomaly Directory — Global Taxonomy of Weirdness",
  description:
    "Browse the standardized taxonomy of real-world anomalies across Nature, Animals, Objects, Food, Human-Made, and Coincidences.",
  alternates: {
    canonical: `${SITE_URL}/directory`,
  },
  openGraph: {
    title: `Anomaly Directory — Global Taxonomy of Weirdness | ${SITE_NAME}`,
    description:
      "Browse the standardized taxonomy of real-world anomalies across Nature, Animals, Objects, Food, Human-Made, and Coincidences.",
    url: `${SITE_URL}/directory`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Anomaly Directory — Global Taxonomy of Weirdness | ${SITE_NAME}`,
    description:
      "Browse the standardized taxonomy of real-world anomalies across Nature, Animals, Objects, Food, Human-Made, and Coincidences.",
  },
};

export default function DirectoryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Anomaly Directory", path: "/directory" },
        ]}
      />
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet/10 border border-violet/20 text-violet text-xs font-mono mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Standard Taxonomy v1.0</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-zinc-900 dark:text-white tracking-tight leading-[1.08] mb-6">
            The Anomaly <span className="underline decoration-cyan decoration-wavy underline-offset-8">Directory.</span>
          </h1>

          <p className="text-zinc-600 dark:text-zinc-300 text-lg sm:text-xl leading-relaxed max-w-3xl">
            Explore the categorized master catalog of real-world anomalies. Filter by classification codes, geographic coordinates, and rarity tiers.
          </p>
        </div>

        {/* Directory Client */}
        <AnomalyDirectoryClient />
      </main>

      <Footer />
    </div>
  );
}
