"use client";

import React, { useState, useEffect } from "react";
import { 
  Camera, 
  MessageSquareHeart, 
  Swords, 
  Trophy, 
  Flame, 
  RefreshCw, 
  Coins, 
  IndianRupee, 
  ShieldAlert, 
  TrendingUp,
  Clock,
  Sparkles,
  Info
} from "lucide-react";
import { formatINR, wcToINR, DAILY_INTERACTION_CAP_WC, MONTHLY_CASHOUT_CAP_WC } from "@/lib/credits";

interface EarningStats {
  dailyCap: {
    used: number;
    remaining: number;
    cap: number;
  };
  monthlyCashout: {
    used: number;
    remaining: number;
    cap: number;
  };
  breakdown: {
    posts: number;
    interactions: number;
    vsBattles: number;
    achievements: number;
    loginStreaks: number;
    other: number;
    totalEarned: number;
  };
  inrEquivalent: number;
}

export const EarningsBreakdown: React.FC = () => {
  const [stats, setStats] = useState<EarningStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/earnings/stats");
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch earnings stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const data: EarningStats = stats || {
    dailyCap: { used: 0, remaining: DAILY_INTERACTION_CAP_WC, cap: DAILY_INTERACTION_CAP_WC },
    monthlyCashout: { used: 0, remaining: MONTHLY_CASHOUT_CAP_WC, cap: MONTHLY_CASHOUT_CAP_WC },
    breakdown: {
      posts: 0,
      interactions: 0,
      vsBattles: 0,
      achievements: 0,
      loginStreaks: 0,
      other: 0,
      totalEarned: 0,
    },
    inrEquivalent: 0,
  };

  const dailyUsedPercent = Math.min(100, Math.round((data.dailyCap.used / data.dailyCap.cap) * 100));
  const monthlyUsedPercent = Math.min(100, Math.round((data.monthlyCashout.used / data.monthlyCashout.cap) * 100));

  const channels = [
    {
      title: "Scored Posts",
      wc: data.breakdown.posts,
      inr: wcToINR(data.breakdown.posts),
      icon: Camera,
      color: "from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/30",
      description: "AI weirdness rating rewards on candid uploads",
    },
    {
      title: "Viewer Interactions",
      wc: data.breakdown.interactions,
      inr: wcToINR(data.breakdown.interactions),
      icon: MessageSquareHeart,
      color: "from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30",
      description: "Views (0.01 WC), Likes, Comments, Super-Likes (5 WC)",
    },
    {
      title: "Versus Battles",
      wc: data.breakdown.vsBattles,
      inr: wcToINR(data.breakdown.vsBattles),
      icon: Swords,
      color: "from-purple-500/20 to-violet-500/20 text-violet-400 border-violet-500/30",
      description: "Staked battle bounties and 1-on-1 photo victor prizes",
    },
    {
      title: "Achievements",
      wc: data.breakdown.achievements,
      inr: wcToINR(data.breakdown.achievements),
      icon: Trophy,
      color: "from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30",
      description: "Milestones and community prestige unlocks",
    },
    {
      title: "Daily Login Streak",
      wc: data.breakdown.loginStreaks,
      inr: wcToINR(data.breakdown.loginStreaks),
      icon: Flame,
      color: "from-orange-500/20 to-red-500/20 text-orange-400 border-orange-500/30",
      description: "Consecutive daily login streak bonus rewards",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Lifetime Yield & Guard Caps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Total Earned Card */}
        <div className="p-6 rounded-3xl bg-linear-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-zinc-800 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                Lifetime Accumulated Yield
              </span>
              <button 
                onClick={fetchStats}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                title="Refresh Stats"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <h3 className="text-3xl sm:text-4xl font-display font-black text-white">
                {data.breakdown.totalEarned.toLocaleString()}
              </h3>
              <span className="text-cyan-400 font-mono text-lg font-bold">WC</span>
            </div>

            <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-sm font-semibold">
              <IndianRupee className="w-4 h-4" />
              <span>{formatINR(data.inrEquivalent)} Real Value</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-500 flex justify-between items-center">
            <span>Rate: 1 WC = ₹0.10</span>
            <span>1,000 WC = ₹100 INR</span>
          </div>
        </div>

        {/* Daily Interaction Earning Cap Meter */}
        <div className="p-6 rounded-3xl bg-zinc-900/70 border border-zinc-800 text-white shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Daily Interaction Cap
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                Resets Midnight IST
              </span>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-display font-black text-white">{data.dailyCap.used}</span>
                <span className="text-xs font-mono text-zinc-400">/ {data.dailyCap.cap} WC</span>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {data.dailyCap.remaining} WC left
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden mb-2">
              <div 
                className="h-full bg-linear-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${dailyUsedPercent}%` }}
              />
            </div>
          </div>

          <div className="text-[11px] font-mono text-zinc-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
            <span>Prevents bot inflation on view & like interactions.</span>
          </div>
        </div>

        {/* Monthly Cashout Safety Limit Meter */}
        <div className="p-6 rounded-3xl bg-zinc-900/70 border border-zinc-800 text-white shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                Monthly Cashout Limit
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                Max ₹5,000 / mo
              </span>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-display font-black text-white">{data.monthlyCashout.used.toLocaleString()}</span>
                <span className="text-xs font-mono text-zinc-400">/ {data.monthlyCashout.cap.toLocaleString()} WC</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {data.monthlyCashout.remaining.toLocaleString()} WC left
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden mb-2">
              <div 
                className="h-full bg-linear-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${monthlyUsedPercent}%` }}
              />
            </div>
          </div>

          <div className="text-[11px] font-mono text-zinc-500 flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            <span>Remaining cash-out allowance: {formatINR(wcToINR(data.monthlyCashout.remaining))}</span>
          </div>
        </div>
      </div>

      {/* 5 Earning Channels Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-display font-bold text-lg text-white">Earning Streams</h4>
          <span className="text-xs font-mono text-zinc-400">5 Active Monetization Channels</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((ch, idx) => {
            const Icon = ch.icon;
            return (
              <div 
                key={idx}
                className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-linear-to-br border ${ch.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-mono font-bold text-zinc-400">
                      ~{formatINR(ch.inr)}
                    </span>
                  </div>

                  <h5 className="font-display font-bold text-sm text-white mb-1">{ch.title}</h5>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">{ch.description}</p>
                </div>

                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between font-mono text-xs">
                  <span className="text-zinc-500">Yield:</span>
                  <span className="font-bold text-white">+{ch.wc.toLocaleString()} WC</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
