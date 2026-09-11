import React from "react";
import type { Metadata } from "next";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { Footer } from "@/components/layout/Footer";
import { ProView } from "@/components/pro/ProView";
import { Sparkles, Zap, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Wica Pro & Brand Marketplace — Subscriptions & Licensing",
  description: "Upgrade to Hunter Pro for raw Gemini Vision tensor metrics and 4K downloads, or license candid real-world anomalies for commercial campaigns.",
};

export default function ProPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-ink">
      <SubpageHeader category="Subscription" currentPage="Wica Pro & Marketplace" />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Title Header */}
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet/10 border border-violet/20 text-violet text-xs font-mono mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hunter Pro & Brand Licensing</span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-ink tracking-tight leading-[1.1] mb-3">
            Wica Pro: Power the <span className="underline decoration-violet decoration-wavy underline-offset-6">Archive.</span>
          </h1>

          <p className="text-zinc-600 text-sm sm:text-base">
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
