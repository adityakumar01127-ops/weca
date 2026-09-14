"use client";

import React, { useState, useEffect } from "react";
import { 
  Flame, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  RefreshCw, 
  Award, 
  Clock,
  Zap
} from "lucide-react";
import confetti from "canvas-confetti";
import { getStreakBonus } from "@/lib/credits";

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string | null;
  lastBonusClaimedDate: string | null;
  totalBonusEarned: number;
  canClaimToday: boolean;
  todayBonus: number;
}

export const DailyBonusWidget: React.FC = () => {
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [claiming, setClaiming] = useState<boolean>(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);

  const fetchStreak = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/earnings/daily-bonus");
      const data = await res.json();
      if (res.ok && data.success) {
        setStreak(data.streak);
      }
    } catch (err) {
      console.error("Failed to load streak:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreak();
  }, []);

  const handleClaim = async () => {
    setClaiming(true);
    setClaimMessage(null);
    try {
      const res = await fetch("/api/earnings/daily-bonus", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setStreak(data.streak);
        confetti({
          particleCount: 90,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#F97316", "#EAB308", "#22D3EE"],
        });
        setClaimMessage(`🎉 Claimed +${data.bonusWC} WC! Streak is now ${data.streak.currentStreak} days!`);
      } else {
        setClaimMessage(data.error || "Already claimed today's bonus.");
      }
    } catch (err: any) {
      setClaimMessage(err.message || "Failed to claim bonus.");
    } finally {
      setClaiming(false);
    }
  };

  const info: StreakInfo = streak || {
    currentStreak: 0,
    longestStreak: 0,
    lastLoginDate: null,
    lastBonusClaimedDate: null,
    totalBonusEarned: 0,
    canClaimToday: true,
    todayBonus: 5,
  };

  // 7-day visualization
  const cycleDay = ((info.currentStreak - (info.canClaimToday ? 0 : 1)) % 7) + 1;
  const days = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-zinc-800 text-white shadow-xl p-6 sm:p-8">
      <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-orange-500/15 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 font-mono text-xs font-bold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 fill-current" />
              DAILY OBSERVER STREAK
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-display font-black text-white">
            Daily Login Bonus
          </h3>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Open WECA consecutively every 24 hours to scale your passive credit yield up to 50 WC/day.
          </p>
        </div>

        {/* Streak Stats */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 text-center">
            <div className="text-[10px] font-mono text-zinc-400 uppercase">Current</div>
            <div className="text-xl font-display font-black text-orange-400 flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 fill-orange-400" />
              <span>{info.currentStreak}d</span>
            </div>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 text-center">
            <div className="text-[10px] font-mono text-zinc-400 uppercase">Best</div>
            <div className="text-xl font-display font-black text-amber-400">
              {info.longestStreak}d
            </div>
          </div>
        </div>
      </div>

      {claimMessage && (
        <div className="relative z-10 mb-6 p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-mono flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{claimMessage}</span>
        </div>
      )}

      {/* 7-Day Stepper Chain */}
      <div className="relative z-10 grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-3 mb-6">
        {days.map((d) => {
          const reward = getStreakBonus(d);
          const isPassed = !info.canClaimToday ? d <= cycleDay : d < cycleDay;
          const isToday = info.canClaimToday ? d === cycleDay : false;
          const isFuture = !isPassed && !isToday;

          return (
            <div
              key={d}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col justify-between ${
                isToday
                  ? "bg-linear-to-b from-orange-500/20 to-amber-500/10 border-orange-500/50 shadow-lg shadow-orange-950/40 ring-1 ring-orange-500/30 scale-105"
                  : isPassed
                  ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"
                  : "bg-zinc-900/40 border-zinc-800 text-zinc-500 opacity-70"
              }`}
            >
              <div className="text-[10px] font-mono uppercase mb-1">Day {d}</div>
              
              <div className="my-1.5 flex justify-center">
                {isPassed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : isToday ? (
                  <Flame className="w-5 h-5 text-orange-400 animate-pulse fill-orange-400" />
                ) : (
                  <Lock className="w-4 h-4 text-zinc-600" />
                )}
              </div>

              <div className={`font-mono font-bold text-xs ${isToday ? "text-orange-300" : isPassed ? "text-emerald-400" : "text-zinc-400"}`}>
                +{reward} WC
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800/80">
        <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <span>
            {info.canClaimToday
              ? `Bonus ready! Claim +${info.todayBonus} WC right now.`
              : "Claimed today! Check back tomorrow to keep the flame burning."}
          </span>
        </div>

        <button
          onClick={handleClaim}
          disabled={!info.canClaimToday || claiming || loading}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-mono font-black text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-orange-950/50"
        >
          {claiming ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Claiming...</span>
            </>
          ) : info.canClaimToday ? (
            <>
              <Zap className="w-4 h-4 fill-current" />
              <span>Claim +{info.todayBonus} WC Bonus</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Claimed Today</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
