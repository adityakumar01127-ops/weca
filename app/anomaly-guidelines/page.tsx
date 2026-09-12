import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { SubmissionChecklist } from "@/components/guidelines/SubmissionChecklist";
import { 
  Compass, 
  CheckCircle2, 
  XCircle, 
  Camera, 
  Sparkles, 
  Eye, 
  Layers, 
  ArrowRight 
} from "lucide-react";

export const metadata: Metadata = {
  title: "Anomaly Guidelines — Field Handbook & Submission Criteria",
  description: "Official Wica submission criteria: what qualifies as a genuine anomaly, photography best practices, and our interactive pre-flight checklist.",
};

export default function AnomalyGuidelinesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/20 text-cyan text-xs font-mono mb-4">
            <Compass className="w-3.5 h-3.5" />
            <span>Official Field Handbook</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-zinc-900 dark:text-white tracking-tight leading-[1.08] mb-6">
            The Anomaly <span className="underline decoration-cyan decoration-wavy underline-offset-8">Guidelines.</span>
          </h1>

          <p className="text-zinc-600 dark:text-zinc-400 text-lg sm:text-xl leading-relaxed max-w-3xl">
            What separates an authentic anomaly from an everyday photograph? This guide establishes the baseline standards for submitting candid discoveries to the Wica index.
          </p>
        </div>

        {/* Pre-flight interactive checklist */}
        <section className="mb-16">
          <SubmissionChecklist />
        </section>

        {/* What Qualifies vs What Does Not */}
        <section className="mb-16 space-y-8">
          <div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-zinc-900 dark:text-white tracking-tight">
              Qualifying vs. Non-Qualifying Submissions
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Side-by-side examples across our core taxonomic categories.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Category: Nature */}
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-4">
              <div className="font-mono text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase">
                Taxonomy: Nature
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>QUALIFIES: Botanical & Geological Glitches</span>
                </div>
                <p className="text-xs text-emerald-900 dark:text-emerald-200/90 leading-relaxed">
                  A conjoined double-headed sunflower, albino redwood shoots, trees naturally fusing into living geometric knots, minerals forming impossible right angles.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300 mb-1">
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>DOES NOT QUALIFY: Everyday Plant Life</span>
                </div>
                <p className="text-xs text-rose-900 dark:text-rose-200/90 leading-relaxed">
                  A common potted fern, a garden rose with a brown spot, standard fall foliage changing color, or a slightly asymmetrical leaf.
                </p>
              </div>
            </div>

            {/* Category: Architecture & Human-Made */}
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-4">
              <div className="font-mono text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase">
                Taxonomy: Human-Made
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>QUALIFIES: Inexplicable Built Glitches</span>
                </div>
                <p className="text-xs text-emerald-900 dark:text-emerald-200/90 leading-relaxed">
                  Staircases leading into solid brick walls, exterior doors located three stories up with no balcony, bridges misaligned by 5 feet, street lamps planted through railings.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300 mb-1">
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>DOES NOT QUALIFY: Construction & Ordinary Art</span>
                </div>
                <p className="text-xs text-rose-900 dark:text-rose-200/90 leading-relaxed">
                  An active construction site with unfinished dry-wall, ordinary street graffiti, or standard modern architecture meant to be artistic.
                </p>
              </div>
            </div>

            {/* Category: Animals */}
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-4">
              <div className="font-mono text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase">
                Taxonomy: Animals
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>QUALIFIES: Behavioral & Spatial Incongruities</span>
                </div>
                <p className="text-xs text-emerald-900 dark:text-emerald-200/90 leading-relaxed">
                  A cat sleeping soundly across sharp metal bird spikes, pigeons navigating underground transit like commuters, impossible inter-species camaraderie.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300 mb-1">
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>DOES NOT QUALIFY: Ordinary Pet Photos</span>
                </div>
                <p className="text-xs text-rose-900 dark:text-rose-200/90 leading-relaxed">
                  Your golden retriever taking a standard nap, a cat yawning, birds sitting on a telephone wire, or animals in a zoo doing normal zoo things.
                </p>
              </div>
            </div>

            {/* Category: Coincidences */}
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-4">
              <div className="font-mono text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase">
                Taxonomy: Coincidences
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>QUALIFIES: Unstaged Cosmic Synchronicity</span>
                </div>
                <p className="text-xs text-emerald-900 dark:text-emerald-200/90 leading-relaxed">
                  A cloud casting a perfectly razor-sharp 90-degree square shadow across a valley, two cars with sequential vintage license plates parked together by chance.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300 mb-1">
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>DOES NOT QUALIFY: Forced Perspective Tricks</span>
                </div>
                <p className="text-xs text-rose-900 dark:text-rose-200/90 leading-relaxed">
                  Posing with your hand &ldquo;holding up&rdquo; the Leaning Tower of Pisa, holding the sun between your fingers, or staged TikTok alignment gags.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Photography Standards */}
        <section className="mb-16 p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-white shadow-xl">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan uppercase tracking-wider mb-2">
            <Camera className="w-4 h-4" />
            <span>Field Craft</span>
          </div>

          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight mb-4">
            Photographic Best Practices
          </h2>

          <div className="grid sm:grid-cols-3 gap-4 font-mono text-xs mt-6">
            <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
              <span className="text-cyan block mb-1">Wide Context Shot</span>
              <p className="text-zinc-300">
                Include the surrounding landscape or architecture. Close-up crops without context make scale and authenticity impossible to verify.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
              <span className="text-violet block mb-1">Natural Unfiltered Light</span>
              <p className="text-zinc-300">
                Do not apply HDR presets, vintage filters, or color grading. The stranger the scene looks naturally, the higher its score.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
              <span className="text-magenta block mb-1">Preserve EXIF Metadata</span>
              <p className="text-zinc-300">
                Submit directly from your camera roll so the file&apos;s sensor model, focal length, and timestamp remain intact for forensic scoring.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom Navigation */}
        <section className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/scoring-engine"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <span>Learn how Gemini scores anomalies</span>
          </Link>

          <Link
            href="/community-guidelines"
            className="flex items-center gap-1.5 text-xs font-semibold text-violet hover:underline"
          >
            <span>Review Community Guidelines</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
