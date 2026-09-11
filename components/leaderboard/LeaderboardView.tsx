"use client";

import React, { useState, useMemo } from "react";
import { MOCK_LEADERBOARD } from "@/lib/mockData";
import { LeaderboardHunter, getTierColor } from "@/lib/types";
import { 
  Trophy, 
  Flame, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Award, 
  Crown, 
  Swords, 
  Target, 
  Clock, 
  Search,
  CheckCircle2,
  Globe
} from "lucide-react";

export const LeaderboardView: React.FC = () => {
  const [timeframe, setTimeframe] = useState<"all" | "month" | "week">("all");
  const [metric, setMetric] = useState<"score" | "wc" | "accuracy" | "streak">("wc");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Sort and filter leaderboard based on active metric
  const sortedHunters = useMemo(() => {
    const list = [...MOCK_LEADERBOARD];
    if (metric === "wc") {
      list.sort((a, b) => b.user.total_wc - a.user.total_wc);
    } else if (metric === "score") {
      list.sort((a, b) => (b.top_anomaly?.wica_score || 0) - (a.top_anomaly?.wica_score || 0));
    } else if (metric === "accuracy") {
      list.sort((a, b) => b.accuracy_percent - a.accuracy_percent);
    } else if (metric === "streak") {
      list.sort((a, b) => b.streak_days - a.streak_days);
    }

    return list
      .map((h, idx) => ({ ...h, rank: idx + 1 }))
      .filter((h) =>
        searchQuery.trim() === "" ||
        h.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.user.country && h.user.country.toLowerCase().includes(searchQuery.toLowerCase()))
      );
  }, [metric, searchQuery]);

  const top3 = sortedHunters.slice(0, 3);
  const remaining = sortedHunters.slice(3);

  // Helper for metric value display
  const getMetricDisplay = (h: LeaderboardHunter) => {
    switch (metric) {
      case "wc":
        return `${h.user.total_wc.toLocaleString()} WC`;
      case "score":
        return `${h.top_anomaly?.wica_score || 85}/100`;
      case "accuracy":
        return `${h.accuracy_percent}%`;
      case "streak":
        return `${h.streak_days} days`;
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Timeframe & Metric Toggle Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
        {/* Metric Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setMetric("wc")}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              metric === "wc"
                ? "bg-ink text-white font-semibold shadow-sm"
                : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan" />
            <span>Weird Credits (WC)</span>
          </button>

          <button
            onClick={() => setMetric("score")}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              metric === "score"
                ? "bg-ink text-white font-semibold shadow-sm"
                : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Highest Wica Score</span>
          </button>

          <button
            onClick={() => setMetric("streak")}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              metric === "streak"
                ? "bg-ink text-white font-semibold shadow-sm"
                : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Hunting Streak</span>
          </button>

          <button
            onClick={() => setMetric("accuracy")}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              metric === "accuracy"
                ? "bg-ink text-white font-semibold shadow-sm"
                : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
            }`}
          >
            <Target className="w-3.5 h-3.5 text-violet" />
            <span>Versus Accuracy</span>
          </button>
        </div>

        {/* Timeframe Pill Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl bg-white border border-zinc-200 p-1 text-xs font-mono">
            <button
              onClick={() => setTimeframe("all")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                timeframe === "all" ? "bg-zinc-100 text-ink font-bold" : "text-zinc-500 hover:text-ink"
              }`}
            >
              All-Time
            </button>
            <button
              onClick={() => setTimeframe("month")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                timeframe === "month" ? "bg-zinc-100 text-ink font-bold" : "text-zinc-500 hover:text-ink"
              }`}
            >
              Season
            </button>
            <button
              onClick={() => setTimeframe("week")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                timeframe === "week" ? "bg-zinc-100 text-ink font-bold" : "text-zinc-500 hover:text-ink"
              }`}
            >
              This Week
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search hunter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-violet w-36 sm:w-44"
            />
          </div>
        </div>
      </div>

      {/* TOP 3 PODIUM DISPLAY */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 pb-2 items-end max-w-4xl mx-auto">
          {/* Rank 2 (Silver) */}
          <div className="order-2 md:order-1 flex flex-col items-center p-6 rounded-3xl bg-zinc-50 border border-zinc-200 text-center relative group hover:border-zinc-400 transition-all">
            <div className="w-8 h-8 rounded-full bg-zinc-200 text-zinc-700 font-bold font-mono text-sm flex items-center justify-center mb-3">
              #2
            </div>
            <div className="relative mb-3">
              <img
                src={top3[1].user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[1].user.id}`}
                alt={top3[1].user.username}
                className="w-16 h-16 rounded-full bg-white p-1 ring-2 ring-zinc-300 object-cover"
              />
              <span className="absolute -bottom-1 -right-1 text-xs">🥈</span>
            </div>
            <h3 className="font-display font-bold text-base text-ink">@{top3[1].user.username}</h3>
            <span className="text-xs text-zinc-500 font-mono mb-3">{top3[1].user.country || "Global"}</span>
            <div className="w-full py-2 px-3 rounded-xl bg-white border border-zinc-200 font-mono text-sm font-bold text-ink">
              {getMetricDisplay(top3[1])}
            </div>
            <span className="text-[11px] font-mono text-violet mt-2">{top3[1].user.tier}</span>
          </div>

          {/* Rank 1 (Gold) — Elevated Hero */}
          <div className="order-1 md:order-2 flex flex-col items-center p-8 rounded-3xl bg-zinc-900 border-2 border-amber-400/80 text-white text-center relative shadow-2xl scale-105 z-10 group">
            <div className="absolute -top-4 px-3 py-1 rounded-full bg-amber-400 text-zinc-950 font-bold font-mono text-xs flex items-center gap-1 shadow-md">
              <Crown className="w-3.5 h-3.5 fill-current" />
              <span>CURRENT CHAMPION</span>
            </div>
            <div className="relative mb-4 mt-2">
              <img
                src={top3[0].user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[0].user.id}`}
                alt={top3[0].user.username}
                className="w-20 h-20 rounded-full bg-zinc-800 p-1 ring-4 ring-amber-400 object-cover"
              />
              <span className="absolute -bottom-1 -right-1 text-base">👑</span>
            </div>
            <h3 className="font-display font-black text-xl text-white">@{top3[0].user.username}</h3>
            <span className="text-xs text-zinc-400 font-mono mb-4">{top3[0].user.country || "Global"}</span>
            <div className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 border border-amber-400/40 font-mono text-lg font-black text-amber-400 shadow-inner">
              {getMetricDisplay(top3[0])}
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs font-mono text-zinc-300">
              <Flame className="w-3.5 h-3.5 text-orange-400 fill-current" />
              <span>{top3[0].streak_days} Day Streak</span>
              <span>•</span>
              <span>{top3[0].anomalies_count} Findings</span>
            </div>
          </div>

          {/* Rank 3 (Bronze) */}
          <div className="order-3 md:order-3 flex flex-col items-center p-6 rounded-3xl bg-zinc-50 border border-zinc-200 text-center relative group hover:border-zinc-400 transition-all">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold font-mono text-sm flex items-center justify-center mb-3">
              #3
            </div>
            <div className="relative mb-3">
              <img
                src={top3[2].user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[2].user.id}`}
                alt={top3[2].user.username}
                className="w-16 h-16 rounded-full bg-white p-1 ring-2 ring-amber-600/40 object-cover"
              />
              <span className="absolute -bottom-1 -right-1 text-xs">🥉</span>
            </div>
            <h3 className="font-display font-bold text-base text-ink">@{top3[2].user.username}</h3>
            <span className="text-xs text-zinc-500 font-mono mb-3">{top3[2].user.country || "Global"}</span>
            <div className="w-full py-2 px-3 rounded-xl bg-white border border-zinc-200 font-mono text-sm font-bold text-ink">
              {getMetricDisplay(top3[2])}
            </div>
            <span className="text-[11px] font-mono text-violet mt-2">{top3[2].user.tier}</span>
          </div>
        </div>
      )}

      {/* FULL RANKINGS TABLE (Ranks 4-50) */}
      <div className="rounded-3xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
        <div className="p-4 bg-zinc-50/75 border-b border-zinc-200 flex items-center justify-between text-xs font-mono text-zinc-500 uppercase tracking-wider">
          <div className="flex items-center gap-6">
            <span className="w-12 text-center">Rank</span>
            <span>Hunter Identity</span>
          </div>
          <div className="flex items-center gap-8 pr-4">
            <span className="hidden sm:inline">Tier</span>
            <span className="hidden md:inline">Streak</span>
            <span className="w-24 text-right">Score / Value</span>
          </div>
        </div>

        <div className="divide-y divide-zinc-100">
          {sortedHunters.map((hunter) => {
            const tierColor = getTierColor(hunter.user.tier);
            const isTop3 = hunter.rank <= 3;

            return (
              <div
                key={hunter.user.id}
                className={`flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors ${
                  isTop3 ? "bg-amber-50/20" : ""
                }`}
              >
                {/* Left: Rank & Hunter info */}
                <div className="flex items-center gap-6">
                  <div className="w-12 flex items-center justify-center font-mono font-bold text-sm">
                    {hunter.rank === 1 && <span className="text-amber-500">#1</span>}
                    {hunter.rank === 2 && <span className="text-zinc-500">#2</span>}
                    {hunter.rank === 3 && <span className="text-amber-700">#3</span>}
                    {hunter.rank > 3 && <span className="text-zinc-400">#{hunter.rank}</span>}
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      src={hunter.user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${hunter.user.id}`}
                      alt={hunter.user.username}
                      className="w-10 h-10 rounded-full bg-zinc-100 object-cover ring-1 ring-zinc-200"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm text-ink">
                          @{hunter.user.username}
                        </span>
                        {hunter.trend === "up" && (
                          <span title="Climbing">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                          </span>
                        )}
                        {hunter.trend === "down" && (
                          <span title="Falling">
                            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                          </span>
                        )}
                        {hunter.trend === "same" && (
                          <span title="Steady">
                            <Minus className="w-3.5 h-3.5 text-zinc-300" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {hunter.user.country} • {hunter.anomalies_count} findings
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Stats */}
                <div className="flex items-center gap-8 pr-4 font-mono text-xs">
                  <span className={`hidden sm:inline px-2.5 py-0.5 rounded-full text-[10px] border ${tierColor.bg} ${tierColor.text} ${tierColor.border}`}>
                    {hunter.user.tier}
                  </span>

                  <span className="hidden md:flex items-center gap-1 text-zinc-500">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    <span>{hunter.streak_days}d</span>
                  </span>

                  <div className="w-24 text-right">
                    <span className="font-bold text-sm text-ink">
                      {getMetricDisplay(hunter)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky User Position Bar */}
      <div className="sticky bottom-6 p-4 rounded-2xl bg-zinc-900 text-white shadow-xl border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-violet/30 border border-violet/50 flex items-center justify-center font-mono font-bold text-xs text-violet">
            #14
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Your Current Rank</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-cyan">
                Certified Weird Tier
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Amassed 680 WC • 120 WC needed to claim Rank #13
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="px-4 py-2 rounded-xl bg-violet hover:bg-violet/90 text-white text-xs font-semibold font-mono transition-all active:scale-95"
          >
            Explore Top Finders ↑
          </button>
        </div>
      </div>
    </div>
  );
};
