import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { Footer } from "@/components/layout/Footer";
import { ScoringSimulator } from "@/components/scoring/ScoringSimulator";
import { 
  Sliders, 
  Cpu, 
  Calculator, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Terminal,
  Sparkles,
  Zap
} from "lucide-react";

export const metadata: Metadata = {
  title: "Scoring Engine — Wica Weirdness Engine v1.0",
  description: "Explore the 5-dimensional rubric, mathematical formula, and Google Gemini Vision multimodal prompt architecture that powers Wica.",
};

export default function ScoringEnginePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-ink">
      <SubpageHeader category="Documentation" currentPage="Scoring Engine" />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/20 text-cyan text-xs font-mono mb-4">
            <Cpu className="w-3.5 h-3.5" />
            <span>Wica Weirdness Engine v1.0</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-ink tracking-tight leading-[1.08] mb-6">
            Scoring the <span className="underline decoration-violet decoration-wavy underline-offset-8">improbable.</span>
          </h1>

          <p className="text-zinc-600 text-lg sm:text-xl leading-relaxed max-w-3xl">
            Wica does not rank photos by follower count, vanity likes, or hashtags. Every submission is analyzed by multimodal artificial intelligence against an uncompromising 5-dimensional rubric of physical uniqueness.
          </p>
        </div>

        {/* Interactive Simulator Section */}
        <section className="mb-16">
          <ScoringSimulator />
        </section>

        {/* The 5 Scoring Dimensions in Detail */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-ink tracking-tight">
                The 5 Evaluation Dimensions
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                Each dimension receives a calibrated score from 0 to 10.
              </p>
            </div>
            <span className="hidden sm:inline-block font-mono text-xs text-zinc-400">
              Weights: Equal 20%
            </span>
          </div>

          <div className="space-y-4">
            {/* Dimension 1 */}
            <div className="p-6 rounded-2xl border border-zinc-200 hover:border-violet/40 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-violet/10 text-violet font-mono font-bold text-xs flex items-center justify-center">
                    01
                  </span>
                  <h3 className="font-display font-bold text-lg text-ink">Absurdity</h3>
                </div>
                <span className="font-mono text-xs text-violet font-semibold">0 – 10 Points</span>
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed pl-10">
                Measures the cognitive dissonance and unexpectedness of the scene. How contradictory or surreal is the juxtaposition of elements? Does it break conventional perceptual assumptions about how objects, architecture, or spaces behave?
              </p>
            </div>

            {/* Dimension 2 */}
            <div className="p-6 rounded-2xl border border-zinc-200 hover:border-cyan/40 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-cyan/10 text-cyan font-mono font-bold text-xs flex items-center justify-center">
                    02
                  </span>
                  <h3 className="font-display font-bold text-lg text-ink">Rarity</h3>
                </div>
                <span className="font-mono text-xs text-cyan font-semibold">0 – 10 Points</span>
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed pl-10">
                Calculates the empirical probability of an average observer encountering this exact phenomenon in the wild. Higher scores are awarded to biological sports, rare meteorological conditions, or singular physical coincidences.
              </p>
            </div>

            {/* Dimension 3 */}
            <div className="p-6 rounded-2xl border border-zinc-200 hover:border-zinc-400 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-700 font-mono font-bold text-xs flex items-center justify-center">
                    03
                  </span>
                  <h3 className="font-display font-bold text-lg text-ink">Craft</h3>
                </div>
                <span className="font-mono text-xs text-zinc-600 font-semibold">0 – 10 Points</span>
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed pl-10">
                Assesses whether the weirdness represents a candid, naturally occurring phenomenon or an intentional, human-crafted installation. Both are valid in the Wica index, but craft is tracked neutrally to ensure transparency in community records.
              </p>
            </div>

            {/* Dimension 4 */}
            <div className="p-6 rounded-2xl border border-zinc-200 hover:border-magenta/40 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-magenta/10 text-magenta font-mono font-bold text-xs flex items-center justify-center">
                    04
                  </span>
                  <h3 className="font-display font-bold text-lg text-ink">Cultural Novelty</h3>
                </div>
                <span className="font-mono text-xs text-magenta font-semibold">0 – 10 Points</span>
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed pl-10">
                Examines whether the anomaly exhibits distinct regional, folkloric, or architectural peculiarities that would feel startling or novel to a global audience outside its local geography.
              </p>
            </div>

            {/* Dimension 5 */}
            <div className="p-6 rounded-2xl border border-zinc-200 hover:border-amber-500/40 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 font-mono font-bold text-xs flex items-center justify-center">
                    05
                  </span>
                  <h3 className="font-display font-bold text-lg text-ink">Wit</h3>
                </div>
                <span className="font-mono text-xs text-amber-500 font-semibold">0 – 10 Points</span>
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed pl-10">
                The cosmic double-take factor. Does the photo elicit a laugh, an incredulous pause, or a delighted &ldquo;wait, what?&rdquo; reaction? Wit measures the comedic timing and visual irony inherent in the discovery.
              </p>
            </div>
          </div>
        </section>

        {/* Mathematical Formulation & Weighting */}
        <section className="mb-16 p-8 rounded-3xl bg-zinc-900 text-white">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan uppercase tracking-wider mb-2">
            <Calculator className="w-4 h-4" />
            <span>Mathematical Specification</span>
          </div>

          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight mb-4">
            Composite Wica Score Formula
          </h2>

          <div className="p-4 rounded-xl bg-zinc-800/80 border border-zinc-700 font-mono text-sm sm:text-base text-cyan mb-6 overflow-x-auto">
            Wica_Score = (Absurdity + Rarity + Craft + Cultural_Novelty + Wit) × 2
          </div>

          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            By summing the 5 dimensions (maximum raw score of 50) and applying a scalar multiplier of 2, the composite Wica score seamlessly resolves into an intuitive 0 to 100 percentage-style index.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
              <span className="text-zinc-400 block mb-1">Subject Matter Focus</span>
              <p className="text-zinc-200">
                Score reflects the anomaly itself—a grainy phone photo of an improbable event scores just as high as a studio photograph.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
              <span className="text-zinc-400 block mb-1">Forensic Guardrails</span>
              <p className="text-zinc-200">
                Submissions flagged as <code className="text-magenta">likely_ai_generated</code> or <code className="text-amber-400">likely_repost</code> trigger automatic quarantine for manual review.
              </p>
            </div>
          </div>
        </section>

        {/* System Prompt Architecture */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="w-5 h-5 text-violet" />
            <h2 className="font-display font-bold text-2xl text-ink tracking-tight">
              Gemini Multimodal Prompt Architecture
            </h2>
          </div>

          <p className="text-sm text-zinc-600 mb-4">
            Here is the exact zero-shot rubric prompt passed to the Google GenAI vision tensor model:
          </p>

          <div className="p-5 rounded-2xl bg-zinc-950 text-zinc-300 font-mono text-xs leading-relaxed overflow-x-auto border border-zinc-800">
            <pre className="text-emerald-400">
{`You are the Wica Weirdness Engine. Analyze the attached image and score it
0-10 on each dimension:

1. Absurdity — how unexpected or incongruous is the combination of elements?
2. Rarity — how rarely would an average person encounter this exact scene?
3. Craft — does the weirdness look intentional/staged, or like a candid find?
4. Cultural novelty — is there a distinctive regional/cultural element likely
   unfamiliar to a global audience?
5. Wit — does it provoke a laugh or a delighted "wait, what?" reaction?

Score the subject matter, never the photo's technical quality — a blurry
phone photo of something genuinely strange should score as well as a
studio shot of the same thing.

Return strict JSON only:
{
  "absurdity": int, "rarity": int, "craft": int,
  "cultural_novelty": int, "wit": int,
  "one_line_verdict": string (under 15 words, punchy and shareable),
  "flags": array (e.g. "likely_ai_generated", "likely_repost")
}`}
            </pre>
          </div>
        </section>

        {/* Next links */}
        <section className="pt-8 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/rarity-tiers"
            className="flex items-center gap-2 text-sm font-semibold text-violet hover:underline"
          >
            <span>Learn how scores translate into Rarity Tiers</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/gemini-vision-api"
            className="flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-ink"
          >
            <span>View Gemini Vision API Technical Docs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
