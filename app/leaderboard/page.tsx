import React from "react";
import type { Metadata } from "next";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { Footer } from "@/components/layout/Footer";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { Trophy, Crown, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Global Leaderboard — Hall of Fame & Top Spotters | Wica",
  description: "Rankings of the world's premier anomaly hunters. Filter by highest Wica Score, Weird Credits balance, Versus accuracy, and hunting streaks.",
};

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-ink">
      <SubpageHeader category="Community" currentPage="Leaderboard" />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Title Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-mono mb-3">
            <Trophy className="w-3.5 h-3.5" />
            <span>The Global Hall of Fame</span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-ink tracking-tight leading-[1.1] mb-3">
            Global Leaderboard: <span className="underline decoration-amber-400 decoration-wavy underline-offset-6">Elite Spotters.</span>
          </h1>

          <p className="text-zinc-600 text-sm sm:text-base max-w-2xl">
            Celebrating the keenest eyes in the physical world. Ranked by composite rarity, verified findings, community Versus accuracy, and observational streaks.
          </p>
        </div>

        {/* Leaderboard View Component */}
        <LeaderboardView />
      </main>

      <Footer />
    </div>
  );
}
