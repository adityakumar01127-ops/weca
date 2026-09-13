import React from "react";
import type { Metadata } from "next";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { Trophy } from "lucide-react";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Global Leaderboard — Hall of Fame & Top Spotters",
  description:
    "Rankings of the world's premier anomaly hunters. Filter by highest Weca Score, Weird Credits balance, Versus accuracy, and hunting streaks.",
  alternates: {
    canonical: `${SITE_URL}/leaderboard`,
  },
  openGraph: {
    title: `Global Leaderboard — Hall of Fame & Top Spotters | ${SITE_NAME}`,
    description:
      "Rankings of the world's premier anomaly hunters. Filter by highest Weca Score, Weird Credits, and Versus accuracy.",
    url: `${SITE_URL}/leaderboard`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Global Leaderboard — Hall of Fame & Top Spotters | ${SITE_NAME}`,
    description:
      "Rankings of the world's premier anomaly hunters. Filter by highest Weca Score, Weird Credits, and Versus accuracy.",
  },
};

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-amber-500/20 transition-colors duration-200">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Global Leaderboard", path: "/leaderboard" },
        ]}
      />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Title Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-mono mb-3">
            <Trophy className="w-3.5 h-3.5" />
            <span>The Global Hall of Fame</span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-zinc-900 dark:text-white tracking-tight leading-[1.1] mb-3">
            Global Leaderboard: <span className="underline decoration-amber-400 decoration-wavy underline-offset-6">Elite Spotters.</span>
          </h1>

          <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base max-w-2xl">
            Celebrating the keenest eyes in the physical world. Ranked by composite rarity, verified findings, community Versus accuracy, and observational streaks.
          </p>
        </div>

        {/* Leaderboard View Component */}
        <LeaderboardView />
      </main>
    </div>
  );
}
