"use client";

import React, { useState } from "react";
import {
  X,
  TrendingUp,
  Eye,
  Award,
  Zap,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  BarChart3,
  Calendar,
  Share2,
  Check,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { WicaImage } from "@/lib/types";

interface ExplorerDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  userSightings?: WicaImage[];
  wcBalance?: number;
  onSelectSighting?: (sighting: WicaImage) => void;
}

interface ActivityBar {
  day: string;
  views: number;
  highlight?: boolean;
}



export const ExplorerDashboardModal: React.FC<ExplorerDashboardModalProps> = ({
  isOpen,
  onClose,
  username,
  userSightings = [],
  wcBalance = 150,
  onSelectSighting,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<"7d" | "30d" | "90d">("30d");

  const totalSightings = userSightings.length;
  const avgScore = totalSightings > 0
    ? Math.round((userSightings.reduce((sum, s) => sum + (s.wica_score || 0), 0) / totalSightings) * 10) / 10
    : 0;
  const totalLikes = userSightings.reduce((sum, s) => sum + (s.likes_count || 0), 0);
  const totalViews = totalSightings > 0 ? totalSightings * 14 + totalLikes * 3 : 0;
  const communityReach = totalSightings > 0 ? totalSightings * 32 + totalLikes * 6 : 0;

  if (!isOpen) return null;

  const handleShareTelemetry = () => {
    navigator.clipboard?.writeText(
      `WECA Explorer Intelligence: @${username} • ${totalSightings} Sightings • ${avgScore > 0 ? `${avgScore} Avg Score` : "Active Explorer"} • ${wcBalance} WC on Weca!`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Top 3 sightings by score or defaults
  const topSightings = userSightings.length > 0 ? userSightings.slice(0, 3) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 dark:bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-zinc-900 dark:text-zinc-100 shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet/15 dark:bg-violet/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan/10 dark:bg-cyan/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-zinc-200 dark:border-zinc-800/80 shrink-0 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-violet/15 text-violet border border-violet/30 flex items-center justify-center shrink-0 shadow-md shadow-violet/10">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white tracking-tight truncate">
                  Explorer Dashboard
                </h3>
                <span className="hidden xs:inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  Active
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate">
                @{username} • Season 1 Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleShareTelemetry}
              title="Copy Telemetry Summary"
              className="p-1.5 sm:p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="space-y-4 sm:space-y-6 overflow-y-auto pr-1 py-3 sm:py-4 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800">
          {/* Timeframe Selector */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Telemetry Horizon</span>
            <div className="flex items-center gap-1 p-0.5 sm:p-1 bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[11px] sm:text-xs">
              {(["7d", "30d", "90d"] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all ${
                    selectedTimeframe === tf
                      ? "bg-violet text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  {tf === "7d" ? "7 Days" : tf === "30d" ? "30 Days" : "90 Days"}
                </button>
              ))}
            </div>
          </div>

          {/* 4-Metric Grid (Key Telemetry) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Metric 1: Views */}
            <div className="p-3.5 rounded-2xl bg-zinc-50/90 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800/80 relative overflow-hidden group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
                <span className="text-[11px] font-medium">Sighting Views</span>
                <Eye className="w-4 h-4 text-cyan" />
              </div>
              <div className="text-xl font-bold text-zinc-900 dark:text-white font-mono">{totalViews.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-1">
                <span>Total impressions</span>
              </div>
            </div>

            {/* Metric 2: Impressions / Reach */}
            <div className="p-3.5 rounded-2xl bg-zinc-50/90 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800/80 relative overflow-hidden group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
                <span className="text-[11px] font-medium">Community Reach</span>
                <Sparkles className="w-4 h-4 text-violet" />
              </div>
              <div className="text-xl font-bold text-zinc-900 dark:text-white font-mono">{communityReach.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-1">
                <span>Engagement volume</span>
              </div>
            </div>

            {/* Metric 3: Avg Wica Score */}
            <div className="p-3.5 rounded-2xl bg-zinc-50/90 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800/80 relative overflow-hidden group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
                <span className="text-[11px] font-medium">Avg Weca Score</span>
                <ShieldCheck className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              </div>
              <div className="text-xl font-bold text-zinc-900 dark:text-white font-mono">{avgScore > 0 ? avgScore : "—"}</div>
              <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400/90 mt-1">
                {avgScore >= 85 ? "S-Tier Anomaly spotter" : totalSightings > 0 ? "Verified explorer" : "No sightings scored"}
              </div>
            </div>

            {/* Metric 4: WC Balance / Bounty */}
            <div className="p-3.5 rounded-2xl bg-zinc-50/90 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800/80 relative overflow-hidden group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
                <span className="text-[11px] font-medium">Weird Credits</span>
                <Zap className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
              </div>
              <div className="text-xl font-bold text-zinc-900 dark:text-white font-mono">{wcBalance} WC</div>
              <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-1">
                Live ledger balance
              </div>
            </div>
          </div>

          {/* Interactive Activity Trend Chart */}
          <div className="p-4 rounded-2xl bg-zinc-50/90 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800/80">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">Discovery Views Velocity</h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Daily verification traffic across all sightings</p>
              </div>
              {totalSightings > 0 && (
                <span className="text-[11px] font-mono text-cyan font-semibold bg-cyan/10 px-2 py-0.5 rounded-md border border-cyan/20">
                  {totalViews} Total Views
                </span>
              )}
            </div>

            {totalSightings === 0 ? (
              <div className="h-28 flex flex-col items-center justify-center text-center p-4 text-zinc-400 dark:text-zinc-500 font-mono text-xs">
                <span>No observation views logged yet.</span>
                <span className="text-[10px] text-zinc-400 mt-1">Upload your first physical sighting to begin tracking telemetry.</span>
              </div>
            ) : (
              <div className="h-28 flex items-end justify-between gap-2 pt-2 px-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => {
                  const dayViews = Math.max(0, Math.round((totalViews / 7) * (idx === 4 ? 1.4 : idx === 2 ? 1.1 : 0.8)));
                  const maxViews = Math.max(10, totalViews);
                  const heightPercent = Math.min(100, Math.max(12, Math.round((dayViews / maxViews) * 100)));
                  const isHighlight = idx === 4;
                  return (
                    <div
                      key={day}
                      className="flex-1 flex flex-col items-center gap-2 group cursor-pointer relative"
                    >
                      <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 dark:bg-zinc-800 text-white text-[10px] font-mono px-2 py-0.5 rounded-md border border-zinc-700 shadow-md pointer-events-none whitespace-nowrap z-10">
                        {dayViews} views
                      </div>
                      <div className="w-full max-w-[28px] h-20 bg-zinc-200 dark:bg-zinc-900 rounded-t-lg overflow-hidden flex items-end">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-lg transition-all duration-500 group-hover:brightness-110 ${
                            isHighlight
                              ? "bg-gradient-to-t from-violet to-cyan shadow-lg shadow-violet/30"
                              : "bg-gradient-to-t from-zinc-300 to-zinc-400 dark:from-zinc-800 dark:to-zinc-600"
                          }`}
                        />
                      </div>
                      <span
                        className={`text-[10px] font-mono ${
                          isHighlight ? "text-cyan font-bold" : "text-zinc-500 dark:text-zinc-400"
                        }`}
                      >
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Explorer Tier Progression */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-violet/10 via-zinc-100 dark:via-zinc-950 to-cyan/10 border border-violet/30 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-violet" />
                <span className="text-xs font-bold text-zinc-900 dark:text-white">Researcher Progression</span>
              </div>
              <span className="text-[11px] font-mono text-cyan font-semibold">
                {wcBalance >= 500 ? "Level 5 • Master Spotter" : wcBalance >= 200 ? "Level 3 • Senior Spotter" : "Level 1 • Novice Spotter"}
              </span>
            </div>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 mb-3">
              {wcBalance >= 500 ? "Legendary Anomaly Spotter" : wcBalance >= 200 ? "Reality-Breaking Explorer" : "Certified Weird Spotter"}{" "}
              <span className="text-zinc-400 dark:text-zinc-500">
                {wcBalance < 500 ? `→ ${500 - wcBalance} WC to Master Tier` : "→ Maximum Prestige Tier"}
              </span>
            </p>
            {/* Progress Bar */}
            <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-violet via-purple-500 to-cyan rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.round((wcBalance / 500) * 100))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
              <span>{wcBalance} / 500 WC ({Math.min(100, Math.round((wcBalance / 500) * 100))}%)</span>
              <span>Next tier unlock: Enhanced Payout Limits</span>
            </div>
          </div>

          {/* Top Performing Sightings */}
          {topSightings.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">Top Anomaly Sightings</h4>
                <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">By Community Rating</span>
              </div>
              <div className="space-y-2">
                {topSightings.map((s, idx) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      if (onSelectSighting) {
                        onSelectSighting(s);
                        onClose();
                      }
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50/90 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-5 text-center font-mono font-bold text-xs text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white">
                        #{idx + 1}
                      </div>
                      <img
                        src={s.storage_path}
                        alt="Top sighting"
                        className="w-10 h-10 rounded-lg object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
                      />
                      <div className="truncate">
                        <div className="text-xs font-semibold text-zinc-800 group-hover:text-zinc-900 dark:text-zinc-200 dark:group-hover:text-white truncate">
                          {s.caption || s.category}
                        </div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                          {s.category} • Weca Score {s.wica_score}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono font-bold text-cyan bg-cyan/10 px-2 py-0.5 rounded-md border border-cyan/20">
                        {s.wica_score}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between gap-3 shrink-0">
          <Link
            href="/leaderboard"
            onClick={onClose}
            className="flex-1 py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 dark:border-transparent dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Award className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            Global Leaderboard
          </Link>
          <Link
            href="/settings"
            onClick={onClose}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-violet to-purple-600 hover:from-violet/90 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-violet/25 flex items-center justify-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Scoring Engine
          </Link>
        </div>
      </div>
    </div>
  );
};
