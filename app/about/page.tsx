import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { Footer } from "@/components/layout/Footer";
import { 
  Sparkles, 
  ShieldCheck, 
  Eye, 
  Flame, 
  Compass, 
  Cpu, 
  Layers, 
  Award, 
  ArrowRight,
  Globe2,
  CheckCircle2
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Wica — The Global Weirdness Index",
  description: "Learn why Wica exists: cataloging humanity's most inexplicable candid encounters through real photos and multimodal AI scoring.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-ink">
      <SubpageHeader category="About" currentPage="Overview" />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Badge & Title */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet/10 border border-violet/20 text-violet text-xs font-mono mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Global Weirdness Index</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-ink tracking-tight leading-[1.08] mb-6">
            The antidote to <span className="underline decoration-cyan decoration-wavy underline-offset-8">synthetic slop.</span>
          </h1>

          <p className="text-zinc-600 text-lg sm:text-xl leading-relaxed max-w-3xl">
            Wica is a public ledger and social discovery platform dedicated to documenting the statistically improbable, the surreal, and the beautifully inexplicable phenomena found in real, unedited physical reality.
          </p>
        </div>

        {/* Live Platform Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl bg-zinc-50 border border-zinc-200 mb-16 font-mono text-center">
          <div className="p-2">
            <div className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">14,280+</div>
            <div className="text-[11px] text-zinc-500 uppercase tracking-wider mt-1">Anomalies Logged</div>
          </div>
          <div className="p-2 border-l border-zinc-200">
            <div className="text-2xl sm:text-3xl font-bold text-violet tracking-tight">89</div>
            <div className="text-[11px] text-zinc-500 uppercase tracking-wider mt-1">Countries Mapped</div>
          </div>
          <div className="p-2 border-t sm:border-t-0 sm:border-l border-zinc-200">
            <div className="text-2xl sm:text-3xl font-bold text-cyan tracking-tight">99.4%</div>
            <div className="text-[11px] text-zinc-500 uppercase tracking-wider mt-1">Candid Accuracy</div>
          </div>
          <div className="p-2 border-t sm:border-t-0 sm:border-l border-zinc-200">
            <div className="text-2xl sm:text-3xl font-bold text-magenta tracking-tight">5-Dim</div>
            <div className="text-[11px] text-zinc-500 uppercase tracking-wider mt-1">Gemini Scoring</div>
          </div>
        </div>

        {/* Why Wica Exists (The Genesis) */}
        <section className="mb-16 space-y-6">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-ink tracking-tight">
            Why Wica? The Crisis of Real Wonder
          </h2>
          <div className="prose prose-zinc text-zinc-600 leading-relaxed space-y-4 text-base">
            <p>
              The modern internet has succumbed to an epidemic of algorithmic homogeneity. Feeds are saturated with manufactured drama, heavily filtered lifestyle curation, and generative AI imagery where anything can be fabricated in seconds. When everything can be faked, genuine surprise disappears.
            </p>
            <p>
              Yet our physical world remains stubbornly, delightfully strange. A telephone encased in cooling Icelandic basalt; a mushroom glowing upside down in a New Zealand limestone grotto; an accidental architectural glitch that produces a staircase leading straight into a solid concrete wall.
            </p>
            <p>
              These moments cannot be staged on demand. They are rare gifts of observational serendipity. Wica was founded to build a permanent, verified archive for these anomalies—ranked not by influencer popularity or rage-bait, but by genuine rarity and absurdity.
            </p>
          </div>
        </section>

        {/* The 4 Foundational Pillars */}
        <section className="mb-16">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-ink tracking-tight mb-8">
            The 4 Foundational Pillars
          </h2>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-zinc-200 bg-white hover:border-violet/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-violet/10 text-violet flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-ink mb-2">1. Unflinching Candor</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Zero tolerance for AI-generated images, digital composites, or Photoshop tricks. Every submission passes forensic visual checks to guarantee it was captured by a real optical sensor in the physical world.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-200 bg-white hover:border-cyan/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-cyan/10 text-cyan flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-ink mb-2">2. Multimodal AI Precision</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Powered by contemporary Google Gemini Vision models. Each image is scored across 5 objective dimensions: Absurdity, Rarity, Craft, Cultural Novelty, and Wit—yielding a composite score out of 100.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-200 bg-white hover:border-magenta/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-magenta/10 text-magenta flex items-center justify-center mb-4">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-ink mb-2">3. The Anti-Algorithm</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                No engagement optimization, no clickbait amplification. The Wica World Feed ranks anomalies strictly by their rarity tier and composite score. The strangest finds rise to the top naturally.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-200 bg-white hover:border-amber-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-ink mb-2">4. Weird Credits Economy</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Observers who spot genuine anomalies are credited with Weird Credits (WC). Rarer discoveries unlock prestigious tier titles—from Mildly Odd to the coveted Legendary Anomaly rank.
              </p>
            </div>
          </div>
        </section>

        {/* How the Wica Loop Operates */}
        <section className="mb-16 p-8 rounded-3xl bg-zinc-900 text-white">
          <div className="max-w-3xl">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan mb-2 block">
              System Architecture
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight mb-4">
              How the Anomaly Cycle Works
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-8">
              From field discovery to the global ledger in under 3 seconds:
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <span className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono text-sm text-cyan shrink-0">
                  01
                </span>
                <div>
                  <h4 className="font-semibold text-white text-base">Field Observation & Capture</h4>
                  <p className="text-sm text-zinc-400 mt-1">
                    An anomaly hunter encounters an unexpected oddity, snaps a photo, and submits it with optional contextual caption and geographic tags.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono text-sm text-violet shrink-0">
                  02
                </span>
                <div>
                  <h4 className="font-semibold text-white text-base">Gemini Vision 5-D Tensor Evaluation</h4>
                  <p className="text-sm text-zinc-400 mt-1">
                    Gemini Vision inspects the subject matter, evaluates scene composition against millions of normative data points, generates dimension scores (0-10), and produces an instant one-line verdict.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono text-sm text-magenta shrink-0">
                  03
                </span>
                <div>
                  <h4 className="font-semibold text-white text-base">Tier Assignment & Archival Minting</h4>
                  <p className="text-sm text-zinc-400 mt-1">
                    The submission is indexed into the World Feed, assigned to one of four Rarity Tiers, and Weird Credits (WC) are awarded directly to the hunter&apos;s profile.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Explore Next CTAs */}
        <section className="pt-8 border-t border-zinc-200">
          <h3 className="font-mono text-xs uppercase tracking-wider text-zinc-400 mb-6">
            Dive Deeper Into the Technology
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link
              href="/scoring-engine"
              className="p-4 rounded-xl border border-zinc-200 hover:border-ink hover:bg-zinc-50 transition-all group"
            >
              <div className="font-semibold text-sm text-ink group-hover:text-violet flex items-center justify-between">
                <span>Scoring Engine</span>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-zinc-500 mt-1">Explore the 5 scoring dimensions & try the live simulator.</p>
            </Link>

            <Link
              href="/rarity-tiers"
              className="p-4 rounded-xl border border-zinc-200 hover:border-ink hover:bg-zinc-50 transition-all group"
            >
              <div className="font-semibold text-sm text-ink group-hover:text-cyan flex items-center justify-between">
                <span>Rarity Tiers</span>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-zinc-500 mt-1">Understand the 4 tiers from Mildly Odd to Legendary.</p>
            </Link>

            <Link
              href="/directory"
              className="p-4 rounded-xl border border-zinc-200 hover:border-ink hover:bg-zinc-50 transition-all group"
            >
              <div className="font-semibold text-sm text-ink group-hover:text-magenta flex items-center justify-between">
                <span>Anomaly Directory</span>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-zinc-500 mt-1">Browse the categorized global taxonomy of weirdness.</p>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
