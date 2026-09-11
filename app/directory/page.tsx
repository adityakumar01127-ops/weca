import React from "react";
import type { Metadata } from "next";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { Footer } from "@/components/layout/Footer";
import { AnomalyDirectoryClient } from "@/components/directory/AnomalyDirectoryClient";
import { BookOpen, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Anomaly Directory — Global Taxonomy of Weirdness",
  description: "Browse the standardized taxonomy of real-world anomalies across Nature, Animals, Objects, Food, Human-Made, and Coincidences.",
};

export default function DirectoryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-ink">
      <SubpageHeader category="Archive" currentPage="Anomaly Directory" />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet/10 border border-violet/20 text-violet text-xs font-mono mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Standard Taxonomy v1.0</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-ink tracking-tight leading-[1.08] mb-6">
            The Anomaly <span className="underline decoration-cyan decoration-wavy underline-offset-8">Directory.</span>
          </h1>

          <p className="text-zinc-600 text-lg sm:text-xl leading-relaxed max-w-3xl">
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
