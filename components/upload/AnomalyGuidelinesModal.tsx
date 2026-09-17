"use client";

import React from "react";
import { X, CheckCircle2, XCircle, Sparkles, HelpCircle, Compass, Zap, Camera, Eye, AlertTriangle } from "lucide-react";

interface AnomalyGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnomalyGuidelinesModal: React.FC<AnomalyGuidelinesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 sm:p-7 max-h-[90vh] overflow-y-auto text-zinc-900 dark:text-zinc-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Close Guidelines"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet/10 border border-violet/30 text-violet text-xs font-mono font-bold mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>Official Weca Field Handbook</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-zinc-900 dark:text-white tracking-tight">
            What Counts as a Weca Anomaly?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Weca is the global index of real-world glitches, funny absurdities, and physical serendipity. Read our criteria to maximize your Weird Points and Weird Credits.
          </p>
        </div>

        {/* The Dual Pillars: Weird Point & Unique Point */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 font-mono">
          <div className="p-4 rounded-2xl bg-violet/5 dark:bg-violet-950/30 border border-violet/20">
            <div className="flex items-center gap-2 text-violet font-bold text-sm mb-1.5">
              <Zap className="w-4 h-4" />
              <span>Weird Point (0–100)</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Measures <strong>Absurdity, Incongruity & Wit</strong>. How much does the scene defy logic, common sense, or expectation? Does it provoke an instant double-take or a genuine laugh?
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-cyan/5 dark:bg-cyan-950/30 border border-cyan/20">
            <div className="flex items-center gap-2 text-cyan font-bold text-sm mb-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Unique Point (0–100)</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Measures <strong>Statistical Rarity & Freshness</strong>. How seldom would an average person ever stumble across this exact physical scene? Is it an unscripted, once-in-a-lifetime find?
            </p>
          </div>
        </div>

        {/* Qualifying vs Ineligible Sections */}
        <div className="space-y-6 mb-6">
          {/* Qualifying Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Qualifying Submissions (Score ≥ 30)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800">
                <span className="font-bold text-zinc-900 dark:text-white block mb-0.5">
                  🏢 Physical & Architectural Glitches
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                  Stairs leading directly into solid walls, bizarre plumbing loops, impossible angles, gravity-defying municipal fixes.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800">
                <span className="font-bold text-zinc-900 dark:text-white block mb-0.5">
                  🪑 Absurd Juxtapositions
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                  A refrigerator chained to a park bench, an office chair balanced in a tree canopy, wildly misplaced objects.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800">
                <span className="font-bold text-zinc-900 dark:text-white block mb-0.5">
                  😂 Candid Street Humor & Typos
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                  Unintentional billboard misspellings, real accidental visual puns, surreal public notices (NOT staged pranks).
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800">
                <span className="font-bold text-zinc-900 dark:text-white block mb-0.5">
                  🍄 Botanical & Nature Curiosities
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                  Mutant produce (lemon shaped like a duck), twin sunflowers, trees growing around metal street signs.
                </span>
              </div>
            </div>
          </div>

          {/* Ineligible Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-mono font-bold uppercase tracking-wider">
              <XCircle className="w-4 h-4" />
              <span>Ineligible Submissions (Intercepted & Rejected)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
                <span className="font-bold text-rose-900 dark:text-rose-300 block mb-0.5">
                  ☕ Mundane Everyday Photos
                </span>
                <span className="text-rose-700/80 dark:text-rose-400/80 text-[11px]">
                  Standard selfies, cafe coffee cups, clean desks, ordinary sunsets, normal pet photos with zero strange context.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
                <span className="font-bold text-rose-900 dark:text-rose-300 block mb-0.5">
                  📱 Digital Memes & Screenshots
                </span>
                <span className="text-rose-700/80 dark:text-rose-400/80 text-[11px]">
                  Screenshots of Twitter, Reddit, TikTok, WhatsApp chat bubbles, or meme templates. Must be an optical camera photo!
                </span>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
                <span className="font-bold text-rose-900 dark:text-rose-300 block mb-0.5">
                  🤖 AI-Generated / Deepfakes
                </span>
                <span className="text-rose-700/80 dark:text-rose-400/80 text-[11px]">
                  Midjourney, DALL-E, or Stable Diffusion graphics. Only authentic physical findings captured by camera sensors qualify.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
                <span className="font-bold text-rose-900 dark:text-rose-300 block mb-0.5">
                  🕶️ Dark, Blurry or Obstructed
                </span>
                <span className="text-rose-700/80 dark:text-rose-400/80 text-[11px]">
                  Photos taken with lens cap on, pure black frames, or severe blur where the anomaly cannot be identified.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4">
          <div className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
            Keep your camera ready. When reality breaks, report it to Weca!
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs transition-colors shrink-0 cursor-pointer"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
