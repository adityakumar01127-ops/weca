import React from "react";
import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { WorldMapExplorer } from "@/components/map/WorldMapExplorer";
import { Globe2, MapPin, Compass, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "World Map Explorer — Global Weirdness Geographic Index",
  description: "Explore the geographic distribution of verified candid anomalies. Browse bizarre finds mapped across 89 countries with coordinates and vision scores.",
};

export default function MapPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Title Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/20 text-cyan text-xs font-mono mb-3">
            <Globe2 className="w-3.5 h-3.5" />
            <span>Geographic Cartography</span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-zinc-900 dark:text-white tracking-tight leading-[1.1] mb-3">
            The World Map: <span className="underline decoration-cyan decoration-wavy underline-offset-6">Pinpointed Weirdness.</span>
          </h1>

          <p className="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base max-w-2xl">
            Real physical anomalies logged with geographical precision. Tap on coordinates to inspect the discovery, compare continental rarity distributions, and filter by region.
          </p>
        </div>

        {/* Interactive World Map Component */}
        <WorldMapExplorer />
      </main>

      <Footer />
    </div>
  );
}
