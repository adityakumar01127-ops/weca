"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MOCK_ACHIEVEMENTS, MOCK_TRANSACTIONS } from "@/lib/mockData";
import { Achievement, WalletTransaction, getTierColor } from "@/lib/types";
import { 
  Sparkles, 
  Wallet, 
  ArrowUpRight, 
  Trophy, 
  Award, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Flame, 
  Eye, 
  Globe, 
  Swords, 
  DollarSign, 
  ArrowDownRight,
  ChevronRight,
  Layers,
  Lock
} from "lucide-react";
import confetti from "canvas-confetti";

export const WalletView: React.FC = () => {
  const [currentBalance, setCurrentBalance] = useState<number>(680);
  const [cashoutAmount, setCashoutAmount] = useState<number>(500);
  const [isCashoutSimulated, setIsCashoutSimulated] = useState<boolean>(false);

  // Icon mapper helper
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Eye":
        return <Eye className="w-4 h-4 text-cyan" />;
      case "Sparkles":
        return <Sparkles className="w-4 h-4 text-violet" />;
      case "Swords":
        return <Swords className="w-4 h-4 text-magenta" />;
      case "Flame":
        return <Flame className="w-4 h-4 text-orange-500" />;
      case "Globe":
        return <Globe className="w-4 h-4 text-emerald-500" />;
      case "Award":
      default:
        return <Award className="w-4 h-4 text-amber-500" />;
    }
  };

  const handleSimulateCashout = () => {
    if (currentBalance < 1000) return;
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#10B981", "#22D3EE", "#7C5CFC"],
      });
    } catch {}
    setIsCashoutSimulated(true);
    setTimeout(() => setIsCashoutSimulated(false), 4000);
  };

  // Tier thresholds
  // Certified Weird: 400 WC, Reality-Breaking: 1000 WC, Legendary: 2500 WC
  const nextTierThreshold = 1000;
  const currentProgressPercent = Math.min(100, Math.round((currentBalance / nextTierThreshold) * 100));

  return (
    <div className="w-full space-y-10">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Balance Card */}
        <div className="md:col-span-2 p-8 rounded-3xl bg-zinc-950 text-white border border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-cyan/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 left-1/4 w-60 h-60 rounded-full bg-violet/20 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan animate-pulse" />
                <span className="font-mono text-xs uppercase tracking-wider text-zinc-400">
                  Weird Credits Ledger
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-violet/20 text-violet border border-violet/30 text-xs font-mono font-bold">
                Tier: Certified Weird
              </span>
            </div>

            <div className="flex items-baseline gap-3 mb-2">
              <h2 className="font-display font-black text-4xl sm:text-6xl text-white tracking-tight">
                {currentBalance.toLocaleString()}
              </h2>
              <span className="font-mono text-cyan text-xl sm:text-2xl font-bold">WC</span>
            </div>

            <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-6">
              Est. Cash-Out Value: <strong className="text-white">${((currentBalance / 1000) * 10).toFixed(2)} USD</strong> (1,000 WC = $10.00 conversion rate)
            </p>
          </div>

          {/* Tier Progression Meter */}
          <div className="relative z-10 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-zinc-400">Progress to Reality-Breaking Tier</span>
              <span className="text-cyan font-bold">{currentBalance} / 1,000 WC ({currentProgressPercent}%)</span>
            </div>
            <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-cyan to-violet rounded-full transition-all duration-1000"
                style={{ width: `${currentProgressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mt-1.5">
              <span>Current: Certified Weird</span>
              <span>Next: Reality-Breaking (Unlocks 2x battle voting weight)</span>
            </div>
          </div>
        </div>

        {/* Lifetime Earnings Quick Stat */}
        <div className="p-6 rounded-3xl bg-zinc-50 border border-zinc-200 flex flex-col justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-2">
              Lifetime Yield
            </span>
            <h3 className="font-display font-black text-3xl text-ink mb-1">
              965 WC
            </h3>
            <span className="text-xs text-emerald-600 font-mono flex items-center gap-1 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+215 WC this week</span>
            </span>

            <div className="mt-6 space-y-3 font-mono text-xs text-zinc-600">
              <div className="flex justify-between border-b border-zinc-200 pb-2">
                <span>Scored Uploads:</span>
                <strong className="text-ink">640 WC</strong>
              </div>
              <div className="flex justify-between border-b border-zinc-200 pb-2">
                <span>Versus Voting:</span>
                <strong className="text-ink">75 WC</strong>
              </div>
              <div className="flex justify-between">
                <span>Achievements:</span>
                <strong className="text-ink">250 WC</strong>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-200">
            <Link
              href="/#world-feed-heading"
              className="w-full py-2.5 px-4 rounded-xl bg-ink hover:bg-zinc-800 text-white font-mono text-xs font-bold transition-all text-center block"
            >
              Upload Photo to Earn +WC
            </Link>
          </div>
        </div>
      </div>

      {/* ACHIEVEMENTS TRACK */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-xl text-ink tracking-tight">
              Hunter Achievements & Milestones
            </h3>
            <p className="text-xs text-zinc-500 font-mono">
              Complete observational challenges to unlock prestigious badges and credit bounties.
            </p>
          </div>
          <span className="text-xs font-mono text-violet font-semibold">
            2 of 6 Unlocked (33%)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_ACHIEVEMENTS.map((ach) => (
            <div
              key={ach.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                ach.unlocked
                  ? "bg-white border-violet/30 shadow-sm"
                  : "bg-zinc-50/70 border-zinc-200 opacity-80"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center">
                    {getIcon(ach.iconName)}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan/10 text-cyan text-xs font-mono font-bold">
                    +{ach.reward_wc} WC
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-display font-bold text-sm text-ink">{ach.title}</h4>
                  {ach.unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                </div>

                <p className="text-xs text-zinc-600 leading-relaxed mb-4">
                  {ach.description}
                </p>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1">
                  <span>{ach.unlocked ? "Completed" : "In Progress"}</span>
                  <span>{ach.progress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      ach.unlocked ? "bg-emerald-500" : "bg-violet"
                    }`}
                    style={{ width: `${ach.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STRIPE CONNECT PAYOUT SIMULATOR */}
      <div className="p-8 rounded-3xl bg-zinc-900 text-white border border-zinc-800 relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-wider mb-2">
            <DollarSign className="w-4 h-4" />
            <span>Monetization & Stripe Connect Cash Conversion</span>
          </div>

          <h3 className="font-display font-bold text-2xl text-white mb-2">
            Creator Cash-Out Gate
          </h3>

          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6">
            Under Section 3.6 of Wica&apos;s platform architecture, observers who discover genuine anomalies can convert Weird Credits to real currency via Stripe Connect once anti-fraud validation gates are satisfied.
          </p>

          {/* Anti-fraud requirement checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 mb-6 text-xs font-mono">
            <div className="flex items-center gap-2 text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Account Age &gt; 14 Days</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>5+ Verified Real Finds</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <Lock className="w-4 h-4 text-zinc-500 shrink-0" />
              <span>Min. 1,000 WC Balance ({currentBalance}/1,000)</span>
            </div>
          </div>

          {/* Conversion Slider */}
          <div className="p-5 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-300">Conversion Calculator:</span>
              <span className="text-cyan font-bold">{cashoutAmount} WC = ${(cashoutAmount / 100).toFixed(2)} USD</span>
            </div>

            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={cashoutAmount}
              onChange={(e) => setCashoutAmount(Number(e.target.value))}
              className="w-full accent-cyan cursor-pointer"
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-[11px] font-mono text-zinc-400">
                Pmt processor: Stripe Connect (direct deposit to bank in 89 supported countries).
              </span>

              <button
                disabled={currentBalance < 1000}
                onClick={handleSimulateCashout}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-mono font-bold text-xs transition-all active:scale-95"
              >
                {currentBalance >= 1000 ? "Request Payout via Stripe" : "Requires 1,000 WC to Cash Out"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TRANSACTION LEDGER TABLE */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-xl text-ink tracking-tight">
            Recent Credit Ledger Transactions
          </h3>
          <span className="text-xs font-mono text-zinc-500">
            Immutable Audit Trail
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm divide-y divide-zinc-100 font-mono text-xs">
          {MOCK_TRANSACTIONS.map((tx) => (
            <div
              key={tx.id}
              className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    tx.type === "earn"
                      ? "bg-emerald-50 text-emerald-600"
                      : tx.type === "bonus"
                      ? "bg-violet/10 text-violet"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-ink text-xs">{tx.reason}</div>
                  <div className="text-[10px] text-zinc-400">{tx.created_at.slice(0, 10)} • Tx #{tx.id}</div>
                </div>
              </div>

              <div className="text-right">
                <span className="font-bold text-emerald-600 text-sm">+{tx.amount} WC</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
