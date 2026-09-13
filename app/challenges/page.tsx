import React from "react";
import type { Metadata } from "next";
import { ChallengesView } from "@/components/challenges/ChallengesView";
import { Flame } from "lucide-react";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Weekly Challenges & Bounties — Community Quests",
  description:
    "Participate in time-boxed community anomaly challenges. Compete for bonus Weird Credits with targeted optical observations.",
  alternates: {
    canonical: `${SITE_URL}/challenges`,
  },
  openGraph: {
    title: `Weekly Challenges & Bounties — Community Quests | ${SITE_NAME}`,
    description:
      "Participate in time-boxed community anomaly challenges. Compete for bonus Weird Credits with targeted optical observations.",
    url: `${SITE_URL}/challenges`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Weekly Challenges & Bounties — Community Quests | ${SITE_NAME}`,
    description:
      "Participate in time-boxed community anomaly challenges. Compete for bonus Weird Credits with targeted optical observations.",
  },
};

export default function ChallengesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Challenges & Bounties", path: "/challenges" },
        ]}
      />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Title Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/20 text-cyan text-xs font-mono mb-3">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Weekly Observation Sprints</span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-zinc-900 dark:text-white tracking-tight leading-[1.1] mb-3">
            Weekly Challenges: <span className="underline decoration-cyan decoration-wavy underline-offset-6">Thematic Bounties.</span>
          </h1>

          <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base max-w-2xl">
            Each week, a unique observational constraint is issued to the global network. Hunt down the matching physical anomaly, earn community endorsements, and claim the Weird Credit bounty pool.
          </p>
        </div>

        {/* Challenges View Component */}
        <ChallengesView />
      </main>
    </div>
  );
}
