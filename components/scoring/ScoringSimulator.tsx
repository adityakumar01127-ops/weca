"use client";

import React, { useState, useMemo } from "react";
import { getTierFromScore, getTierColor } from "@/lib/types";
import { Sparkles, Sliders, RefreshCw, CheckCircle2 } from "lucide-react";

export const ScoringSimulator: React.FC = () => {
  const [absurdity, setAbsurdity] = useState<number>(8);
  const [rarity, setRarity] = useState<number>(9);
  const [craft, setCraft] = useState<number>(7);
  const [culturalNovelty, setCulturalNovelty] = useState<number>(6);
  const [wit, setWit] = useState<number>(8);

  const compositeScore = useMemo(() => {
    return Math.min(100, Math.max(0, (absurdity + rarity + craft + culturalNovelty + wit) * 2));
  }, [absurdity, rarity, craft, culturalNovelty, wit]);

  const tier = useMemo(() => getTierFromScore(compositeScore), [compositeScore]);
  const tierColor = useMemo(() => getTierColor(tier), [tier]);

  const sampleVerdict = useMemo(() => {
    if (compositeScore >= 85) {
      return "A reality-defying statistical miracle that belongs in the permanent anomaly hall of fame.";
    }
    if (compositeScore >= 65) {
      return "An exquisite violation of physical expectations with high double-take potency.";
    }
    if (compositeScore >= 40) {
      return "An unmistakably odd incongruity that sparks genuine curiosity and quiet amusement.";
    }
    return "A charming, subtle quirk in the texture of everyday ordinary reality.";
  }, [compositeScore]);

  const handleReset = () => {
    setAbsurdity(8);
    setRarity(9);
    setCraft(7);
    setCulturalNovelty(6);
    setWit(8);
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan/10 text-cyan text-xs font-mono mb-2">
            <Sliders className="w-3.5 h-3.5" />
            <span>Interactive Simulator</span>
          </div>
          <h3 className="font-display font-bold text-xl text-zinc-900 dark:text-white">
            Test the 5-Dimensional Algorithm
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Adjust the dimension sliders below to simulate how Gemini Vision computes the composite Weca Score.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-mono text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset Defaults</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-center">
        {/* Sliders Area */}
        <div className="lg:col-span-7 space-y-5">
          {/* Dimension 1: Absurdity */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <span className="text-zinc-900 dark:text-zinc-200">1. Absurdity (Surreal Incongruity)</span>
              <span className="font-mono font-bold text-violet">{absurdity}/10</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={absurdity}
              onChange={(e) => setAbsurdity(Number(e.target.value))}
              className="w-full accent-violet h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Dimension 2: Rarity */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <span className="text-zinc-900 dark:text-zinc-200">2. Rarity (Encounter Probability)</span>
              <span className="font-mono font-bold text-cyan">{rarity}/10</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={rarity}
              onChange={(e) => setRarity(Number(e.target.value))}
              className="w-full accent-cyan h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Dimension 3: Craft */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <span className="text-zinc-900 dark:text-zinc-200">3. Craft (Candid vs. Staged Intention)</span>
              <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">{craft}/10</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={craft}
              onChange={(e) => setCraft(Number(e.target.value))}
              className="w-full accent-zinc-800 dark:accent-zinc-400 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Dimension 4: Cultural Novelty */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <span className="text-zinc-900 dark:text-zinc-200">4. Cultural Novelty (Regional Uniqueness)</span>
              <span className="font-mono font-bold text-magenta">{culturalNovelty}/10</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={culturalNovelty}
              onChange={(e) => setCulturalNovelty(Number(e.target.value))}
              className="w-full accent-magenta h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Dimension 5: Wit */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <span className="text-zinc-900 dark:text-zinc-200">5. Wit (Humor & Double-Take Factor)</span>
              <span className="font-mono font-bold text-amber-500">{wit}/10</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={wit}
              onChange={(e) => setWit(Number(e.target.value))}
              className="w-full accent-amber-500 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Real-time Calculation Result Card */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl bg-white dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 text-center relative overflow-hidden shadow-sm">
          {/* Subtle Glow aura */}
          <div
            className={`w-32 h-32 rounded-full absolute -top-10 -right-10 blur-3xl opacity-20 pointer-events-none ${
              tier === "Legendary Anomaly"
                ? "bg-amber-400"
                : tier === "Reality-Breaking"
                ? "bg-pink-500"
                : tier === "Certified Weird"
                ? "bg-purple-500"
                : "bg-cyan-400"
            }`}
          />

          <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
            Composite Weca Score
          </span>

          <div className="flex items-baseline justify-center gap-1 mb-2">
            <span className="font-display font-black text-6xl sm:text-7xl text-zinc-900 dark:text-white tracking-tight">
              {compositeScore}
            </span>
            <span className="font-mono text-zinc-400 dark:text-zinc-500 text-sm font-semibold">/100</span>
          </div>

          {/* Tier Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-tight mb-4 border ${tierColor.bg} ${tierColor.border} ${tierColor.text}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{tier}</span>
          </div>

          {/* Verdict Box */}
          <div className="w-full p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 italic">
            &ldquo;{sampleVerdict}&rdquo;
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 w-full flex items-center justify-between text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
            <span>Formula: Σ(5) × 2</span>
            <span>Raw Sum: {absurdity + rarity + craft + culturalNovelty + wit}/50</span>
          </div>
        </div>
      </div>
    </div>
  );
};
