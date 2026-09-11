import React from "react";
import type { Metadata } from "next";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { Footer } from "@/components/layout/Footer";
import { VersusBattleArena } from "@/components/versus/VersusBattleArena";
import { Swords, Sparkles, Trophy, Flame } from "lucide-react";

export const metadata: Metadata = {
  title: "Versus Battles — Wica Head-to-Head Anomaly Clash",
  description: "Vote head-to-head on the world's weirdest candid anomalies. 24-hour category showdowns scored by the global community.",
};

export default function VersusPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-ink">
      <SubpageHeader category="Arena" currentPage="Versus Battles" />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Title */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-magenta/10 border border-magenta/20 text-magenta text-xs font-mono mb-3">
            <Swords className="w-3.5 h-3.5" />
            <span>Daily Community Clash</span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-ink tracking-tight leading-[1.1] mb-3">
            Versus: The Weirdness <span className="underline decoration-magenta decoration-wavy underline-offset-6">Showdown.</span>
          </h1>

          <p className="text-zinc-600 text-sm sm:text-base max-w-2xl">
            Two candid anomalies from the same category enter. You decide which breaks reality more. Cast your vote to reveal the community split, earn Weird Credits, and build your prediction streak.
          </p>
        </div>

        {/* Interactive Battle Arena */}
        <VersusBattleArena />
      </main>

      <Footer />
    </div>
  );
}
