"use client";

import React, { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { MOCK_BATTLES } from "@/lib/mockData";
import { Battle, getTierColor } from "@/lib/types";
import { getSafeImageUrl } from "@/lib/utils/image";
import { 
  Swords, 
  Sparkles, 
  Flame, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Trophy,
  Share2,
  Info,
  Layers,
  ShieldCheck,
  Zap
} from "lucide-react";

export const VersusBattleArena: React.FC = () => {
  const [battles, setBattles] = useState<Battle[]>(MOCK_BATTLES);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [votedBattles, setVotedBattles] = useState<Record<string, "a" | "b">>({});
  const [earnedWC, setEarnedWC] = useState<number>(0);
  const [showRewardToast, setShowRewardToast] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 14,
    minutes: 32,
    seconds: 45,
  });

  const activeBattle = battles[currentIndex] || battles[0];
  const userVote = votedBattles[activeBattle.id];

  // 24-hour countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVote = useCallback((choice: "a" | "b") => {
    if (userVote) return;

    // Trigger confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#7C5CFC", "#FF4D8D", "#22D3EE", "#F59E0B"],
      });
    } catch {
      // ignore
    }

    setVotedBattles((prev) => ({ ...prev, [activeBattle.id]: choice }));
    setEarnedWC((prev) => prev + 5);
    setShowRewardToast(true);
    setTimeout(() => setShowRewardToast(false), 3500);

    // Update vote counts
    setBattles((prev) =>
      prev.map((b) => {
        if (b.id === activeBattle.id) {
          return {
            ...b,
            votes_a: choice === "a" ? (b.votes_a || 0) + 1 : (b.votes_a || 0),
            votes_b: choice === "b" ? (b.votes_b || 0) + 1 : (b.votes_b || 0),
          };
        }
        return b;
      })
    );
  }, [userVote, activeBattle.id]);

  // Keyboard controls: A / B or ArrowLeft / ArrowRight
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (userVote) return;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
        handleVote("a");
      } else if (e.key === "b" || e.key === "B" || e.key === "ArrowRight") {
        handleVote("b");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [userVote, handleVote]);

  const totalVotes = (activeBattle.votes_a || 0) + (activeBattle.votes_b || 0);
  const pctA = totalVotes > 0 ? Math.round(((activeBattle.votes_a || 0) / totalVotes) * 100) : 50;
  const pctB = 100 - pctA;

  const tierAColor = getTierColor(activeBattle.image_a.author?.tier || "Certified Weird");
  const tierBColor = getTierColor(activeBattle.image_b.author?.tier || "Certified Weird");

  return (
    <div className="w-full">
      {/* Reward Toast Notification */}
      {showRewardToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-ink text-white shadow-xl border border-violet/40">
          <Sparkles className="w-4 h-4 text-cyan" />
          <span className="text-xs font-mono">
            +5 Weird Credits awarded! (Total session: <strong className="text-cyan">+{earnedWC} WC</strong>)
          </span>
        </div>
      )}

      {/* Battle Header & Live Countdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900 text-white mb-8 border border-zinc-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet/20 border border-violet/40 flex items-center justify-center text-violet">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-violet/20 text-violet border border-violet/30">
                {activeBattle.category} Clash
              </span>
              <span className="text-xs text-zinc-400 font-mono">Battle #{currentIndex + 1} of {battles.length}</span>
            </div>
            <h2 className="font-display font-bold text-lg text-white mt-0.5">
              {activeBattle.title || "The Weirdness Face-Off"}
            </h2>
          </div>
        </div>

        {/* 24-Hour Timer */}
        <div className="flex items-center gap-3 font-mono">
          <div className="flex items-center gap-1 text-zinc-400 text-xs">
            <Clock className="w-3.5 h-3.5 text-cyan animate-spin" style={{ animationDuration: "8s" }} />
            <span>Showdown ends:</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
            <span className="px-2 py-1 rounded bg-zinc-800 text-cyan border border-zinc-700">
              {String(timeLeft.hours).padStart(2, "0")}h
            </span>
            <span className="text-zinc-500">:</span>
            <span className="px-2 py-1 rounded bg-zinc-800 text-cyan border border-zinc-700">
              {String(timeLeft.minutes).padStart(2, "0")}m
            </span>
            <span className="text-zinc-500">:</span>
            <span className="px-2 py-1 rounded bg-zinc-800 text-cyan border border-zinc-700">
              {String(timeLeft.seconds).padStart(2, "0")}s
            </span>
          </div>
        </div>
      </div>

      {/* Main Face-Off Arena (Split Cards) */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch mb-8">
        {/* Center VS Indicator Badge */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-zinc-900 dark:bg-zinc-950 border-4 border-white dark:border-zinc-800 text-white items-center justify-center font-black font-display text-sm tracking-wider shadow-xl ring-2 ring-violet/30">
          VS
        </div>

        {/* CONTENDER A */}
        <div
          className={`group flex flex-col justify-between rounded-3xl border transition-all overflow-hidden bg-white dark:bg-zinc-900/80 ${
            userVote === "a"
              ? "border-violet ring-4 ring-violet/20 shadow-xl"
              : userVote === "b"
              ? "border-zinc-200 dark:border-zinc-800 opacity-80"
              : "border-zinc-200 dark:border-zinc-800 hover:border-violet/60 hover:shadow-lg"
          }`}
        >
          {/* Card Top / Photo */}
          <div className="relative aspect-4/3 w-full bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
            <img
              src={getSafeImageUrl(activeBattle.image_a.storage_path)}
              alt={activeBattle.image_a.caption || "Contender A"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Country and author overlay */}
            <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
              <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[11px] font-mono border border-white/10">
                {activeBattle.image_a.country}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono border bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md ${tierAColor.text} ${tierAColor.border}`}>
                {activeBattle.image_a.author?.tier || "Verified Anomaly"}
              </span>
            </div>

            {/* Score reveal on vote */}
            {userVote && (
              <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-black/90 backdrop-blur-md text-white font-mono text-xs border border-violet/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan" />
                <span>Score: <strong>{activeBattle.image_a.wica_score}</strong>/100</span>
              </div>
            )}
          </div>

          {/* Card Content */}
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                <span>By @{activeBattle.image_a.author?.username}</span>
                <span>•</span>
                <span>Category: {activeBattle.image_a.category}</span>
              </div>
              <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-white line-clamp-2 mb-2">
                {activeBattle.image_a.caption}
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 italic bg-zinc-50 dark:bg-zinc-950/60 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 mb-4">
                &ldquo;{activeBattle.image_a.ai_verdict}&rdquo;
              </p>
            </div>

            {/* Voting Bar or Action */}
            <div className="pt-2">
              {!userVote ? (
                <button
                  onClick={() => handleVote("a")}
                  className="w-full py-3 px-4 rounded-xl bg-violet hover:bg-violet/90 active:scale-[0.98] text-white font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Swords className="w-4 h-4" />
                  <span>Vote Option A (Press A)</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1">
                      {userVote === "a" && <CheckCircle2 className="w-3.5 h-3.5 text-violet" />}
                      <span>{activeBattle.votes_a} votes</span>
                    </span>
                    <span className="font-bold text-violet text-sm">{pctA}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-violet rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${pctA}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CONTENDER B */}
        <div
          className={`group flex flex-col justify-between rounded-3xl border transition-all overflow-hidden bg-white dark:bg-zinc-900/80 ${
            userVote === "b"
              ? "border-magenta ring-4 ring-magenta/20 shadow-xl"
              : userVote === "a"
              ? "border-zinc-200 dark:border-zinc-800 opacity-80"
              : "border-zinc-200 dark:border-zinc-800 hover:border-magenta/60 hover:shadow-lg"
          }`}
        >
          {/* Card Top / Photo */}
          <div className="relative aspect-4/3 w-full bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
            <img
              src={getSafeImageUrl(activeBattle.image_b.storage_path)}
              alt={activeBattle.image_b.caption || "Contender B"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Country and author overlay */}
            <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
              <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[11px] font-mono border border-white/10">
                {activeBattle.image_b.country}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono border bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md ${tierBColor.text} ${tierBColor.border}`}>
                {activeBattle.image_b.author?.tier || "Verified Anomaly"}
              </span>
            </div>

            {/* Score reveal on vote */}
            {userVote && (
              <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-black/90 backdrop-blur-md text-white font-mono text-xs border border-magenta/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-magenta" />
                <span>Score: <strong>{activeBattle.image_b.wica_score}</strong>/100</span>
              </div>
            )}
          </div>

          {/* Card Content */}
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                <span>By @{activeBattle.image_b.author?.username}</span>
                <span>•</span>
                <span>Category: {activeBattle.image_b.category}</span>
              </div>
              <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-white line-clamp-2 mb-2">
                {activeBattle.image_b.caption}
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 italic bg-zinc-50 dark:bg-zinc-950/60 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 mb-4">
                &ldquo;{activeBattle.image_b.ai_verdict}&rdquo;
              </p>
            </div>

            {/* Voting Bar or Action */}
            <div className="pt-2">
              {!userVote ? (
                <button
                  onClick={() => handleVote("b")}
                  className="w-full py-3 px-4 rounded-xl bg-magenta hover:bg-magenta/90 active:scale-[0.98] text-white font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Swords className="w-4 h-4" />
                  <span>Vote Option B (Press B)</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1">
                      {userVote === "b" && <CheckCircle2 className="w-3.5 h-3.5 text-magenta" />}
                      <span>{activeBattle.votes_b} votes</span>
                    </span>
                    <span className="font-bold text-magenta text-sm">{pctB}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-magenta rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${pctB}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Battle Switcher / Pagination Carousel */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 mb-12">
        <div className="flex items-center gap-2">
          <button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => prev - 1)}
            className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-zinc-800 dark:text-zinc-200"
            aria-label="Previous battle"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5">
            {battles.map((b, idx) => (
              <button
                key={b.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-3 h-3 rounded-full transition-all ${
                  idx === currentIndex
                    ? "bg-zinc-900 dark:bg-white scale-125"
                    : votedBattles[b.id]
                    ? "bg-violet"
                    : "bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400"
                }`}
                title={`Jump to battle #${idx + 1}`}
              />
            ))}
          </div>
          <button
            disabled={currentIndex === battles.length - 1}
            onClick={() => setCurrentIndex((prev) => prev + 1)}
            className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-zinc-800 dark:text-zinc-200"
            aria-label="Next battle"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 dark:text-zinc-400">
          <span className="hidden sm:inline">Earn +5 Weird Credits for each vote</span>
          <span className="flex items-center gap-1 text-zinc-900 dark:text-white font-semibold">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Versus Oracle Streak: 4 wins</span>
          </span>
        </div>
      </div>

      {/* How Versus Works Strip */}
      <div className="grid sm:grid-cols-3 gap-6 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
        <div className="space-y-1.5">
          <div className="w-8 h-8 rounded-lg bg-violet/10 text-violet flex items-center justify-center font-bold text-xs font-mono">
            01
          </div>
          <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white">Strict Category Matchmaking</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Only candid anomalies from the exact same category (e.g. Objects vs Objects) clash in 24-hour head-to-head bouts.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="w-8 h-8 rounded-lg bg-cyan/10 text-cyan flex items-center justify-center font-bold text-xs font-mono">
            02
          </div>
          <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white">Anti-Brigading Weighting</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Votes are capped and weighted by account age. Community sentiment nudges the final score via a capped Bayesian formula.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="w-8 h-8 rounded-lg bg-magenta/10 text-magenta flex items-center justify-center font-bold text-xs font-mono">
            03
          </div>
          <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white">Battle Champion Badges</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Winning photos earn bonus Weird Credits for their authors and unlock the rare Battle Champion profile badge.
          </p>
        </div>
      </div>

      {/* Mobile Floating Thumb Voting Dock (Pinned above the bottom navigation bar) */}
      <div className="fixed bottom-18 left-3 right-3 z-40 md:hidden p-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-2xl shadow-black/25 select-none transition-all">
        {!userVote ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleVote("a")}
              className="py-3 px-3 rounded-xl bg-violet hover:bg-violet/90 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-violet/20 cursor-pointer min-h-[46px]"
            >
              <Swords className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Vote A (@{activeBattle.image_a.author?.username})</span>
            </button>
            <button
              type="button"
              onClick={() => handleVote("b")}
              className="py-3 px-3 rounded-xl bg-magenta hover:bg-magenta/90 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-magenta/20 cursor-pointer min-h-[46px]"
            >
              <Swords className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Vote B (@{activeBattle.image_b.author?.username})</span>
            </button>
          </div>
        ) : (
          <div className="px-3 py-1 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-violet flex items-center gap-1">
                {userVote === "a" && <CheckCircle2 className="w-3.5 h-3.5" />}
                Option A ({pctA}%)
              </span>
              <span className="text-zinc-400 text-[10px]">Showdown Live Split</span>
              <span className="text-magenta flex items-center gap-1">
                {userVote === "b" && <CheckCircle2 className="w-3.5 h-3.5" />}
                Option B ({pctB}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex">
              <div className="h-full bg-violet transition-all duration-500" style={{ width: `${pctA}%` }} />
              <div className="h-full bg-magenta transition-all duration-500" style={{ width: `${pctB}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

