import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { 
  Sparkles, 
  ShieldCheck, 
  Award, 
  Layers, 
  ArrowRight,
  Flame,
  CheckCircle2,
  Coins
} from "lucide-react";

import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Rarity Tiers — Official Classification System",
  description:
    "Learn about the 4 official anomaly tiers: Mildly Odd, Certified Weird, Reality-Breaking, and Legendary Anomaly, along with Weird Credit rewards.",
  alternates: {
    canonical: `${SITE_URL}/rarity-tiers`,
  },
  openGraph: {
    title: `Rarity Tiers — Official Anomaly Classification System | ${SITE_NAME}`,
    description:
      "Learn about the 4 official anomaly tiers: Mildly Odd, Certified Weird, Reality-Breaking, and Legendary Anomaly, along with Weird Credit rewards.",
    url: `${SITE_URL}/rarity-tiers`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Rarity Tiers — Official Anomaly Classification System | ${SITE_NAME}`,
    description:
      "Learn about the 4 official anomaly tiers: Mildly Odd, Certified Weird, Reality-Breaking, and Legendary Anomaly, along with Weird Credit rewards.",
  },
};

const TIERS = [
  {
    name: "Mildly Odd",
    range: "0 – 39",
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50/70 dark:bg-cyan-950/20",
    border: "border-cyan-200 dark:border-cyan-800/50",
    glow: "shadow-[0_0_20px_rgba(34,211,238,0.1)] dark:shadow-[0_0_20px_rgba(34,211,238,0.15)]",
    badgeBg: "bg-cyan-500",
    wcReward: 10,
    probability: "~60% of daily quirks",
    hallmark: "Everyday eccentricities, minor signage misprints, odd produce",
    description:
      "The baseline tier of the index. Represents subtle anomalies that disrupt everyday visual rhythm without defying fundamental physical laws.",
    example: "A bell pepper containing a miniature second pepper; a parking sign with comic sans typography.",
  },
  {
    name: "Certified Weird",
    range: "40 – 64",
    color: "text-purple-600 dark:text-violet",
    bg: "bg-purple-50/70 dark:bg-purple-950/20",
    border: "border-purple-200 dark:border-purple-800/50",
    glow: "shadow-[0_0_20px_rgba(124,92,252,0.1)] dark:shadow-[0_0_20px_rgba(124,92,252,0.15)]",
    badgeBg: "bg-violet",
    wcReward: 25,
    probability: "~25% of verified uploads",
    hallmark: "Clear incongruity, animals in uncharacteristic scenarios, puzzling craft",
    description:
      "Unambiguously strange. Any observer passing by would stop, do an immediate double-take, and reach for their camera. Definite glitch vibes.",
    example: "An escalator ending into a solid brick wall; a cat using metal bird spikes as an acupuncture bed.",
  },
  {
    name: "Reality-Breaking",
    range: "65 – 84",
    color: "text-pink-600 dark:text-magenta",
    bg: "bg-pink-50/70 dark:bg-pink-950/20",
    border: "border-pink-200 dark:border-pink-800/50",
    glow: "shadow-[0_0_20px_rgba(255,77,141,0.1)] dark:shadow-[0_0_20px_rgba(255,77,141,0.2)]",
    badgeBg: "bg-magenta",
    wcReward: 50,
    probability: "~12% of submissions",
    hallmark: "Violations of physics, rare mutations, baffling optical synchronicity",
    description:
      "A level of strangeness that feels almost impossible in unedited reality. Often sparks intense debate and requires secondary forensic verification.",
    example: "Bioluminescent crimson mushroom growing upside down from a cave stalactite; a square cloud shadow cast on the ocean.",
  },
  {
    name: "Legendary Anomaly",
    range: "85 – 100",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50/70 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800/50",
    glow: "shadow-[0_0_25px_rgba(245,158,11,0.15)] dark:shadow-[0_0_25px_rgba(245,158,11,0.3)]",
    badgeBg: "bg-amber-500",
    wcReward: 100,
    probability: "< 3% of all submissions",
    hallmark: "Geological miracles, once-in-a-century coincidences, museum-grade anomalies",
    description:
      "The crown jewel of the Weca index. Truly singular phenomena that may occur once in a decade. Submissions in this tier receive the permanent Gold Verified Ledger Seal.",
    example: "A functioning 1970s rotary telephone half-fused into freshly solidified basalt lava in Iceland.",
  },
];

export default function RarityTiersPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Rarity Tiers", path: "/rarity-tiers" },
        ]}
      />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-mono mb-4">
            <Award className="w-3.5 h-3.5" />
            <span>The 4 Classification Tiers</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-zinc-900 dark:text-white tracking-tight leading-[1.08] mb-6">
            Calibrated for <span className="underline decoration-magenta decoration-wavy underline-offset-8">improbability.</span>
          </h1>

          <p className="text-zinc-600 dark:text-zinc-400 text-lg sm:text-xl leading-relaxed max-w-3xl">
            Not all anomalies are created equal. The Weca classification framework organizes discoveries into four distinct tiers based on their composite score, encounter probability, and visual disruption.
          </p>
        </div>

        {/* The 4 Tier Cards */}
        <div className="space-y-6 mb-16">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`p-6 sm:p-8 rounded-3xl border transition-all ${tier.bg} ${tier.border} ${tier.glow}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${tier.badgeBg} animate-pulse`} />
                  <h3 className={`font-display font-bold text-2xl ${tier.color}`}>
                    {tier.name}
                  </h3>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs">
                    Score: {tier.range}
                  </span>
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs">
                    <Coins className="w-3 h-3 text-amber-500" />
                    +{tier.wcReward} WC
                  </span>
                </div>
              </div>

              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4">
                {tier.description}
              </p>

              <div className="grid sm:grid-cols-2 gap-3 pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80 text-xs">
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 font-mono block">Encounter Frequency:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-200">{tier.probability}</span>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 font-mono block">Verified Real Example:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-200 italic">{tier.example}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tier Comparison Matrix */}
        <section className="mb-16">
          <h2 className="font-display font-bold text-2xl text-zinc-900 dark:text-white tracking-tight mb-6">
            Classification & Reward Matrix
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900/90 border-b border-zinc-200 dark:border-zinc-800 font-mono text-zinc-500 dark:text-zinc-400 uppercase">
                <tr>
                  <th className="p-4">Tier</th>
                  <th className="p-4">Score Range</th>
                  <th className="p-4">Weird Credits (WC)</th>
                  <th className="p-4">Probability</th>
                  <th className="p-4">Verification Seal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                <tr>
                  <td className="p-4 font-semibold text-cyan-600 dark:text-cyan-400">Mildly Odd</td>
                  <td className="p-4 font-mono text-zinc-700 dark:text-zinc-300">0 – 39</td>
                  <td className="p-4 font-mono font-medium text-zinc-900 dark:text-zinc-100">+10 WC</td>
                  <td className="p-4 text-zinc-600 dark:text-zinc-400">Common (~60%)</td>
                  <td className="p-4 text-zinc-500 dark:text-zinc-400">Standard Peer Stamp</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-purple-600 dark:text-violet">Certified Weird</td>
                  <td className="p-4 font-mono text-zinc-700 dark:text-zinc-300">40 – 64</td>
                  <td className="p-4 font-mono font-medium text-zinc-900 dark:text-zinc-100">+25 WC</td>
                  <td className="p-4 text-zinc-600 dark:text-zinc-400">Uncommon (~25%)</td>
                  <td className="p-4 text-zinc-500 dark:text-zinc-400">Dual-Review Check</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-pink-600 dark:text-magenta">Reality-Breaking</td>
                  <td className="p-4 font-mono text-zinc-700 dark:text-zinc-300">65 – 84</td>
                  <td className="p-4 font-mono font-medium text-zinc-900 dark:text-zinc-100">+50 WC</td>
                  <td className="p-4 text-zinc-600 dark:text-zinc-400">Rare (~12%)</td>
                  <td className="p-4 text-zinc-500 dark:text-zinc-400">High-Assurance Stamp</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-amber-600 dark:text-amber-400">Legendary Anomaly</td>
                  <td className="p-4 font-mono text-zinc-700 dark:text-zinc-300">85 – 100</td>
                  <td className="p-4 font-mono font-medium text-zinc-900 dark:text-zinc-100">+100 WC</td>
                  <td className="p-4 text-zinc-600 dark:text-zinc-400">Singular (&lt;3%)</td>
                  <td className="p-4 text-amber-600 dark:text-amber-400 font-semibold">Golden Archival Seal</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Weird Credits Economy */}
        <section className="mb-16 p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-white shadow-xl">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-2">
            <Coins className="w-4 h-4" />
            <span>The WC Economy</span>
          </div>

          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight mb-4">
            How Weird Credits (WC) Work
          </h2>

          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            Weird Credits are the reputation currency of Weca. They cannot be purchased with real money; they can only be earned by discovering and documenting genuine real-world anomalies.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/60">
              <span className="text-cyan-400 block mb-1">Spotter Ranking</span>
              <p className="text-zinc-300">
                Your accumulated WC determines your hunter rank on your public profile, from Novice Spotter to Archival Master.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/60">
              <span className="text-purple-400 block mb-1">Curation Weight</span>
              <p className="text-zinc-300">
                Higher-tier hunters receive greater voting weight when peer-reviewing pending submissions and resolving disputes.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/60">
              <span className="text-pink-400 block mb-1">Exclusives</span>
              <p className="text-zinc-300">
                Unlock custom profile badges, priority queue processing, and early access to regional anomaly expeditions.
              </p>
            </div>
          </div>
        </section>

        {/* Footer Navigation CTAs */}
        <section className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/scoring-engine"
            className="flex items-center gap-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <span>Back to Scoring Engine</span>
          </Link>

          <Link
            href="/directory"
            className="flex items-center gap-2 text-sm font-semibold text-violet hover:underline"
          >
            <span>Explore the Anomaly Directory</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
