import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  AlertTriangle, 
  UserX, 
  Lock, 
  Scale, 
  ArrowRight,
  HeartHandshake
} from "lucide-react";

import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Community Guidelines — Preserving the Integrity of Weirdness",
  description:
    "Read the official Weca Community Guidelines: our strict No-AI policy, safety protocols, honest attribution, and moderation enforcement.",
  alternates: {
    canonical: `${SITE_URL}/community-guidelines`,
  },
  openGraph: {
    title: `Community Guidelines — Preserving the Integrity of Weirdness | ${SITE_NAME}`,
    description:
      "Read the official Weca Community Guidelines: our strict No-AI policy, safety protocols, and honest attribution.",
    url: `${SITE_URL}/community-guidelines`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Community Guidelines — Preserving the Integrity of Weirdness | ${SITE_NAME}`,
    description:
      "Read the official Weca Community Guidelines: our strict No-AI policy, safety protocols, and honest attribution.",
  },
};

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Community Guidelines", path: "/community-guidelines" },
        ]}
      />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet/10 border border-violet/20 text-violet text-xs font-mono mb-4">
            <Scale className="w-3.5 h-3.5" />
            <span>Community Standards v1.0</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-zinc-900 dark:text-white tracking-tight leading-[1.08] mb-6">
            Preserving the <span className="underline decoration-violet decoration-wavy underline-offset-8">sanctity</span> of weirdness.
          </h1>

          <p className="text-zinc-600 dark:text-zinc-400 text-lg sm:text-xl leading-relaxed max-w-3xl">
            Weca exists because real-world wonder is worth protecting. To maintain an authentic global archive, all anomaly hunters and contributors adhere to our community charter.
          </p>
        </div>

        {/* The 5 Golden Rules */}
        <section className="space-y-6 mb-16">
          <h2 className="font-display font-bold text-2xl text-zinc-900 dark:text-white tracking-tight mb-8">
            The 5 Golden Rules
          </h2>

          {/* Rule 1 */}
          <div className="p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-violet/40 dark:hover:border-violet/50 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    Rule 01 • Zero Tolerance
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl text-zinc-900 dark:text-white">
                  Strict No-AI / No-CGI / No-Photoshop Policy
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Every image submitted must originate from an optical sensor in the physical world. Generative AI (Midjourney, DALL-E, Stable Diffusion), deepfakes, 3D renderings, and composite Photoshop manipulations are strictly banned.
                </p>
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800 text-xs font-mono text-zinc-600 dark:text-zinc-400">
                  ⚠️ Penalty: Submitting synthetic imagery results in an immediate permanent ban and forfeiture of all accumulated Weird Credits.
                </div>
              </div>
            </div>
          </div>

          {/* Rule 2 */}
          <div className="p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-violet/40 dark:hover:border-violet/50 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-violet/10 text-violet flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-violet">
                  Rule 02 • Safety & Consent
                </span>
                <h3 className="font-display font-bold text-xl text-zinc-900 dark:text-white">
                  Respect Privacy, Physical Safety & Consent
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Never photograph unconsenting private individuals in sensitive or private spaces. Obscure identifiable personal documents, license plates, and private residential addresses.
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Do not trespass on private property, harass wildlife, or place yourself or others in physical danger to capture an anomaly. No photo is worth bodily harm or legal violation.
                </p>
              </div>
            </div>
          </div>

          {/* Rule 3 */}
          <div className="p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-violet/40 dark:hover:border-violet/50 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-cyan/10 text-cyan flex items-center justify-center shrink-0">
                <Eye className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-cyan">
                  Rule 03 • Radical Transparency
                </span>
                <h3 className="font-display font-bold text-xl text-zinc-900 dark:text-white">
                  Accurate Context & Honest Attribution
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  If you fabricated an oddity yourself (e.g. an art installation or quirky craft), state it openly in your caption. Weca celebrates intentional craft, but claiming an engineered art piece was a &ldquo;spontaneous natural miracle&rdquo; corrupts the index.
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Do not upload generic viral images from Reddit or Twitter claiming you discovered them this morning. Original candid discoveries receive archival preference.
                </p>
              </div>
            </div>
          </div>

          {/* Rule 4 */}
          <div className="p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-violet/40 dark:hover:border-violet/50 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Rule 04 • Civil Curiosity
                </span>
                <h3 className="font-display font-bold text-xl text-zinc-900 dark:text-white">
                  Constructive Skepticism & Civil Discourse
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Healthy debate is the engine of anomaly verification. If you believe a submission is an optical illusion or has a rational scientific explanation, explain it with evidence and good cheer.
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Attacking or harassing submitters, trolling, hate speech, or xenophobic remarks will result in swift removal.
                </p>
              </div>
            </div>
          </div>

          {/* Rule 5 */}
          <div className="p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-violet/40 dark:hover:border-violet/50 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Rule 05 • System Fairness
                </span>
                <h3 className="font-display font-bold text-xl text-zinc-900 dark:text-white">
                  No Sybil Farming or Vote Manipulation
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Creating multiple accounts to artificially upvote submissions, farm Weird Credits, or brigade community verification queues is strictly prohibited. Automated bot interactions will trigger IP blocks.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The 3-Tier Moderation System */}
        <section className="mb-16 p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-white shadow-xl">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan mb-2 block">
            Enforcement Hierarchy
          </span>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight mb-4">
            How Violations Are Processed
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">
            Our multi-layered moderation pipeline balances automated safety checks with community peer review:
          </p>

          <div className="grid sm:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
              <div className="text-violet font-bold text-sm mb-1">Tier 1 • AI Flag</div>
              <p className="text-zinc-400">
                Gemini Vision flags suspected AI artifacts, duplicates, or adult content at the moment of upload. Quarantined pending review.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
              <div className="text-cyan font-bold text-sm mb-1">Tier 2 • Peer Review</div>
              <p className="text-zinc-400">
                Trusted community curators inspect quarantined submissions, analyze EXIF metadata, and cross-reference image hashes.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
              <div className="text-rose-400 font-bold text-sm mb-1">Tier 3 • Three Strikes</div>
              <p className="text-zinc-400">
                Strike 1: Formal Warning.<br />
                Strike 2: 14-day posting freeze.<br />
                Strike 3: Permanent hardware and account ban.
              </p>
            </div>
          </div>
        </section>

        {/* Report an Anomaly CTA */}
        <section className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Have concerns about a specific submission? Reach our moderation board at{" "}
            <span className="text-zinc-900 dark:text-zinc-100 font-mono font-medium">integrity@weca.io</span>
          </div>

          <Link
            href="/anomaly-guidelines"
            className="flex items-center gap-1.5 text-xs font-semibold text-violet hover:underline"
          >
            <span>Read Submission Guidelines</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
