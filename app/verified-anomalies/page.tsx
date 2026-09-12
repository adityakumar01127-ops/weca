import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { VerifiedAnomaliesClient } from "@/components/anomalies/VerifiedAnomaliesClient";
import { Award, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Verified Anomalies — The Golden Ledger of Reality Glitches",
  description: "Explore the Wica Golden Ledger: the world's most rigorously peer-reviewed, multi-angle verified real-world anomalies.",
};

export default function VerifiedAnomaliesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-mono mb-4">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>The Golden Ledger</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-zinc-900 dark:text-white tracking-tight leading-[1.08] mb-6">
            Verified <span className="underline decoration-amber-400 decoration-wavy underline-offset-8">Anomalies.</span>
          </h1>

          <p className="text-zinc-600 dark:text-zinc-400 text-lg sm:text-xl leading-relaxed max-w-3xl">
            The permanent Hall of Fame. Each anomaly cataloged here has survived multimodal AI forensic cross-scans, EXIF sensor verification, and peer consensus review from senior field spotters.
          </p>
        </div>

        {/* Verification Standards Banner */}
        <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 mb-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-zinc-700 dark:text-zinc-300">
              Four-Factor Verification: EXIF Raw Sensor Check • Gemini Forensic Scan • 85%+ Consensus • Archival Board Seal
            </span>
          </div>
          <Link
            href="/anomaly-guidelines"
            className="text-violet hover:underline flex items-center gap-1 font-semibold shrink-0"
          >
            <span>Verification Criteria</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Verified Anomalies Grid */}
        <VerifiedAnomaliesClient />
      </main>

      <Footer />
    </div>
  );
}
