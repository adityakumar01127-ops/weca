"use client";

import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { ScoreBreakdown, getTierColor, WicaImage } from "@/lib/types";
import { Logo } from "@/components/brand/Logo";
import { Check, ArrowRight, ShieldAlert, Sparkles, Share2, MapPin } from "lucide-react";
import { getSafeImageUrl } from "@/lib/utils/image";

interface ScoreRevealProps {
  image: WicaImage;
  breakdown: ScoreBreakdown;
  onFinish: () => void;
  heldForReview?: boolean;
  previewUrl?: string | null;
}

export const ScoreReveal: React.FC<ScoreRevealProps> = ({
  image,
  breakdown,
  onFinish,
  heldForReview = false,
  previewUrl,
}) => {
  const [stage, setStage] = useState<"scanning" | "revealing" | "complete">("scanning");
  const [displayScore, setDisplayScore] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const initialSrc = previewUrl || getSafeImageUrl(image.storage_path);
  const [imgSrc, setImgSrc] = useState<string>(initialSrc);

  const tierColors = getTierColor(breakdown.tier);

  useEffect(() => {
    // Stage 1: Scanning simulation for 1.8 seconds
    const scanTimer = setTimeout(() => {
      setStage("revealing");
    }, 1800);

    return () => clearTimeout(scanTimer);
  }, []);

  useEffect(() => {
    if (stage !== "revealing") return;

    // Fast ticker roll-up from 0 to breakdown.composite_score
    const target = breakdown.composite_score;
    const duration = 1200; // ms
    const startTime = performance.now();

    const animateNumber = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / duration);
      // easeOutExpo curve
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentVal = Math.round(eased * target);

      setDisplayScore(currentVal);

      if (progress < 1) {
        requestAnimationFrame(animateNumber);
      } else {
        setDisplayScore(target);
        setStage("complete");

        // Fire festive chromatic confetti
        confetti({
          particleCount: 55,
          spread: 75,
          origin: { y: 0.6 },
          colors: ["#7C5CFC", "#FF4D8D", "#22D3EE"],
        });
      }
    };

    requestAnimationFrame(animateNumber);
  }, [stage, breakdown.composite_score]);

  const handleCopyVerdict = () => {
    navigator.clipboard.writeText(
      `Wica Score: ${breakdown.composite_score}/100 [${breakdown.tier}]\n"${breakdown.one_line_verdict}" — scored by the Wica Weirdness Engine`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-ink/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden p-5 sm:p-7 max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3.5 mb-4">
          <div className="flex items-center gap-2">
            <Logo size={26} showWordmark={true} />
            <span className="text-xs text-zinc-400 font-mono">/ Weirdness Engine</span>
          </div>
          <div className="flex items-center gap-2">
            {image.country && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500">
                <MapPin className="w-3 h-3 text-cyan" /> {image.country}
              </span>
            )}
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 font-medium">
              {image.category}
            </span>
          </div>
        </div>

        {/* Stage 1: Scanning Aperture with Visible Uploaded Image */}
        {stage === "scanning" && (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            {/* Visual Photo Scan Frame */}
            <div className="relative w-full max-h-72 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-5">
              <img
                src={imgSrc}
                alt="Scanning anomaly photo"
                onError={() => {
                  if (image.storage_path && imgSrc !== image.storage_path) {
                    setImgSrc(image.storage_path);
                  } else {
                    setImgSrc("/anom-1.jpg");
                  }
                }}
                className="max-h-72 w-full object-contain opacity-85"
              />

              {/* High-tech Scanning Laser Beam */}
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-cyan via-violet to-magenta shadow-[0_0_18px_rgba(34,211,238,0.9)] animate-scan-beam" />

              {/* Corner Target Reticles */}
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-cyan pointer-events-none" />
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-cyan pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-cyan pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-cyan pointer-events-none" />

              {/* Scanning Overlay Pill */}
              <div className="absolute bottom-3 inset-x-0 mx-auto w-fit px-3 py-1 rounded-full bg-ink/80 backdrop-blur-md border border-white/20 text-white text-[11px] font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan animate-ping" />
                <span>Calibrating Vision Rubric...</span>
              </div>
            </div>

            <h3 className="font-display font-bold text-xl text-ink tracking-tight">
              Analyzing Anomaly Rarity & Absurdity...
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm font-mono">
              Running Gemini multimodal rubric: Absurdity, Rarity, Craft, Cultural Novelty & Wit
            </p>
          </div>
        )}

        {/* Stage 2: Revealed Score State with Visible Image */}
        {(stage === "revealing" || stage === "complete") && (
          <div className="animate-in fade-in duration-300">
            {/* Moderation Alert if Held */}
            {heldForReview && (
              <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Under Moderation Review</span>
                  This submission triggered automated review flags and will appear in the public feed after verification.
                </div>
              </div>
            )}

            {/* Showcase Grid: Left Photo, Right Score */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Photo Card with Badges */}
              <div className="relative rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-200 flex items-center justify-center min-h-[220px] max-h-64 sm:max-h-none">
                <img
                  src={imgSrc}
                  alt={image.caption || "Scored anomaly photo"}
                  onError={() => {
                    if (image.storage_path && imgSrc !== image.storage_path) {
                      setImgSrc(image.storage_path);
                    } else {
                      setImgSrc("/anom-1.jpg");
                    }
                  }}
                  className="w-full h-full max-h-64 object-contain"
                />

                {/* Overlaid Badges */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                  <span className="px-2 py-0.5 rounded-md bg-ink/80 backdrop-blur-md text-[10px] font-mono font-medium text-white/90 border border-white/10">
                    {image.category}
                  </span>
                  <div
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/95 backdrop-blur-md border shadow-xs ${tierColors.text} ${tierColors.border}`}
                  >
                    ★ {breakdown.tier}
                  </div>
                </div>

                {image.country && (
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-ink/75 backdrop-blur-sm text-[10px] text-white/90 font-mono">
                    <MapPin className="w-3 h-3 text-cyan" />
                    <span>{image.country}</span>
                  </div>
                )}
              </div>

              {/* Score Showcase Hero */}
              <div className="relative rounded-2xl bg-zinc-900 text-white p-5 flex flex-col justify-between overflow-hidden">
                {/* Background ambient chromatic glow */}
                <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-violet/30 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-cyan/20 blur-2xl pointer-events-none" />

                <div className="relative z-10">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-cyan block mb-1">
                    WICA COMPOSITE SCORE
                  </span>
                  <div className="flex items-baseline gap-1.5 my-1">
                    <span className="font-display font-black text-5xl sm:text-6xl tracking-tighter text-white">
                      {displayScore}
                    </span>
                    <span className="text-zinc-400 font-display text-xl font-bold">/100</span>
                  </div>

                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-mono text-white">
                    <Sparkles className="w-3 h-3 text-cyan" />
                    <span>+{breakdown.composite_score} Weird Credits</span>
                  </div>
                </div>

                <div className="relative z-10 mt-4 pt-3 border-t border-white/10 text-xs text-zinc-400 font-mono">
                  Tier: <span className="text-white font-semibold">{breakdown.tier}</span>
                </div>
              </div>
            </div>

            {/* Verdict Card */}
            <div className="relative p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 mb-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-0.5">
                AI Verdict
              </span>
              <p className="font-display font-semibold text-ink text-sm sm:text-base leading-snug">
                “{breakdown.one_line_verdict}”
              </p>
              {image.caption && (
                <p className="text-xs text-zinc-500 mt-1 italic">
                  &ldquo;{image.caption}&rdquo;
                </p>
              )}
            </div>

            {/* 5-Dimension Rubric Breakdown */}
            <div className="mb-5 space-y-2 bg-white rounded-xl border border-zinc-100 p-3.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-2">
                Vision Rubric Breakdown (0–10)
              </span>
              {[
                { name: "Absurdity", val: breakdown.absurdity, color: "bg-violet" },
                { name: "Rarity", val: breakdown.rarity, color: "bg-cyan" },
                { name: "Craft", val: breakdown.craft, color: "bg-zinc-700" },
                { name: "Cultural Novelty", val: breakdown.cultural_novelty, color: "bg-magenta" },
                { name: "Wit", val: breakdown.wit, color: "bg-amber-400" },
              ].map((dim) => (
                <div key={dim.name} className="flex items-center text-xs">
                  <span className="w-28 font-medium text-zinc-600 truncate text-[11px]">{dim.name}</span>
                  <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden mx-2.5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${dim.color}`}
                      style={{ width: `${dim.val * 10}%` }}
                    />
                  </div>
                  <span className="w-5 text-right font-mono font-bold text-ink text-[11px]">{dim.val}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCopyVerdict}
                className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 text-ink text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4 text-zinc-500" />}
                <span>{copied ? "Copied Verdict!" : "Share Verdict"}</span>
              </button>

              <button
                type="button"
                onClick={onFinish}
                className="flex-1 py-2.5 px-4 rounded-xl bg-ink hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
              >
                <span>View in Feed</span>
                <ArrowRight className="w-4 h-4 text-cyan" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
