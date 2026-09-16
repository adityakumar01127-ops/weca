"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { CreditTransaction, PayoutRequest, PayoutDetails, PayoutMethod } from "@/lib/types";
import { 
  MIN_CASHOUT_THRESHOLD_WC, 
  WC_TO_USD_RATE, 
  WC_TO_INR_RATE, 
  MONTHLY_CASHOUT_CAP_WC, 
  formatINR, 
  wcToINR 
} from "@/lib/credits";
import { 
  Sparkles, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
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
  Lock,
  X,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  Landmark,
  Send,
  Building2,
  ExternalLink,
  Loader2,
  Zap,
  TrendingUp,
  IndianRupee
} from "lucide-react";
import confetti from "canvas-confetti";
import { initiateRazorpayCheckout } from "@/lib/razorpay/checkout";
import { CreatorProgramCard } from "@/components/earnings/CreatorProgramCard";
import { EarningsBreakdown } from "@/components/earnings/EarningsBreakdown";
import { DailyBonusWidget } from "@/components/earnings/DailyBonusWidget";
import { AchievementsGrid } from "@/components/earnings/AchievementsGrid";

export const WalletView: React.FC = () => {
  const { user, profile } = useAuth();

  // Balance state
  const currentBalance = profile?.credits_balance ?? 0;
  
  // Tab and Eligibility state
  const [activeTab, setActiveTab] = useState<"wallet" | "creator" | "earnings" | "rewards">("wallet");
  const [isCreatorEligible, setIsCreatorEligible] = useState<boolean>(profile?.creator_status === "eligible");

  useEffect(() => {
    if (profile?.creator_status === "eligible") {
      setIsCreatorEligible(true);
    }
  }, [profile?.creator_status]);
  
  // Transactions and Payouts state
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Top Up Credit Packs State
  const [purchasingPlan, setPurchasingPlan] = useState<string | null>(null);
  const [purchaseNotification, setPurchaseNotification] = useState<string | null>(null);

  const handleBuyCredits = async (planKey: string) => {
    if (!user) {
      alert("Please sign in to top up Weird Credits.");
      return;
    }

    setPurchasingPlan(planKey);
    setPurchaseNotification(null);

    try {
      await initiateRazorpayCheckout({
        plan: planKey,
        onSuccess: () => {
          confetti({
            particleCount: 100,
            spread: 60,
            origin: { y: 0.6 },
          });
          setPurchaseNotification("🎉 Payment successful! Your Weird Credits balance has been updated.");
          setPurchasingPlan(null);
          fetchData();
        },
        onError: (err) => {
          alert(`Checkout error: ${err.message}`);
          setPurchasingPlan(null);
        },
        onClose: () => {
          setPurchasingPlan(null);
        },
      });
    } catch (err: any) {
      alert(err.message || "Failed to initialize Razorpay checkout");
      setPurchasingPlan(null);
    }
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>("upi");
  const [payoutName, setPayoutName] = useState<string>(profile?.display_name || profile?.username || "");
  const [upiId, setUpiId] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [ifsc, setIfsc] = useState<string>("");
  const [payoutAmount, setPayoutAmount] = useState<number>(Math.max(MIN_CASHOUT_THRESHOLD_WC, Math.min(500, currentBalance)));
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Fetch real ledger and payout requests
  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const res = await fetch(`/api/wallet/payout-request${profile?.id ? `?userId=${profile.id}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        if (data.transactions && data.transactions.length > 0) {
          setTransactions(data.transactions);
        } else {
          setTransactions([]);
        }
        if (data.payouts) {
          setPayouts(data.payouts);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch wallet data:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile?.id]);



  const handleOpenModal = () => {
    if (!isCreatorEligible) {
      alert("Cash-out is locked. Complete the Creator Eligibility Program first.");
      setActiveTab("creator");
      return;
    }
    setPayoutName(profile?.display_name || profile?.username || "");
    setPayoutAmount(Math.max(MIN_CASHOUT_THRESHOLD_WC, Math.min(1000, currentBalance)));
    setSubmitError(null);
    setSubmitSuccess(null);
    setIsModalOpen(true);
  };

  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCreatorEligible) {
      setSubmitError("Cash-out is locked. You must complete the Creator Eligibility Program first.");
      return;
    }
    if (currentBalance < MIN_CASHOUT_THRESHOLD_WC) {
      setSubmitError(`Minimum cash-out requires ${MIN_CASHOUT_THRESHOLD_WC} WC (${formatINR(wcToINR(MIN_CASHOUT_THRESHOLD_WC))}).`);
      return;
    }
    if (payoutAmount > currentBalance) {
      setSubmitError(`Requested amount (${payoutAmount} WC) exceeds your balance (${currentBalance} WC).`);
      return;
    }
    if (payoutAmount > MONTHLY_CASHOUT_CAP_WC) {
      setSubmitError(`Requested amount exceeds the monthly cashout cap of ${MONTHLY_CASHOUT_CAP_WC} WC (${formatINR(wcToINR(MONTHLY_CASHOUT_CAP_WC))}).`);
      return;
    }

    if (!payoutName.trim()) {
      setSubmitError("Please enter the recipient full name.");
      return;
    }

    if (payoutMethod === "upi" && !upiId.trim()) {
      setSubmitError("Please provide a valid UPI ID (e.g. name@bank).");
      return;
    }

    if (payoutMethod === "bank_account" && (!accountNumber.trim() || !ifsc.trim())) {
      setSubmitError("Please provide both Account Number and IFSC Code.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const details: PayoutDetails = {
      method: payoutMethod,
      name: payoutName.trim(),
      ...(payoutMethod === "upi" ? { upi_id: upiId.trim() } : { account_number: accountNumber.trim(), ifsc: ifsc.trim().toUpperCase() }),
    };

    try {
      const res = await fetch("/api/wallet/payout-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile?.id,
          amount: payoutAmount,
          details,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit payout request");
      }

      // Success
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10B981", "#22D3EE", "#7C5CFC"],
        });
      } catch {}

      setSubmitSuccess(`Payout request for ${payoutAmount} WC queued for admin review!`);
      await fetchData();

      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(null);
      }, 2500);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit payout request");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tier thresholds
  const nextTierThreshold = 1000;
  const currentProgressPercent = Math.min(100, Math.round((currentBalance / nextTierThreshold) * 100));

  return (
    <div className="w-full space-y-8">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 font-mono text-xs overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("wallet")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "wallet"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Wallet className="w-4 h-4 text-cyan-400" />
          <span>Ledger & Top-Up</span>
        </button>

        <button
          onClick={() => setActiveTab("creator")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "creator"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Creator Program</span>
          {isCreatorEligible ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Eligible 🇮🇳
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              90d Clock
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("earnings")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "earnings"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Earnings Streams & Caps</span>
        </button>

        <button
          onClick={() => setActiveTab("rewards")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "rewards"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Flame className="w-4 h-4 text-orange-400" />
          <span>Daily Streak & Milestones</span>
        </button>
      </div>

      {activeTab === "creator" && (
        <CreatorProgramCard onStatusChange={setIsCreatorEligible} />
      )}

      {activeTab === "earnings" && (
        <EarningsBreakdown />
      )}

      {activeTab === "rewards" && (
        <div className="space-y-8">
          <DailyBonusWidget />
          <AchievementsGrid />
        </div>
      )}

      {activeTab === "wallet" && (
        <div className="space-y-10">
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Balance Card */}
            <div className="md:col-span-2 p-8 rounded-3xl bg-linear-to-br from-zinc-900 via-zinc-950 to-zinc-900 text-white border border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col justify-between">
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
                    Tier: {currentBalance >= 1000 ? "Reality-Breaking" : "Certified Weird"}
                  </span>
                </div>

                <div className="flex items-baseline gap-3 mb-2">
                  <h2 className="font-display font-black text-4xl sm:text-6xl text-white tracking-tight">
                    {currentBalance.toLocaleString()}
                  </h2>
                  <span className="font-mono text-cyan text-xl sm:text-2xl font-bold">WC</span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-zinc-400 text-xs sm:text-sm font-mono mb-6">
                  <span>
                    Est. Cash-Out: <strong className="text-emerald-400 font-bold">₹{(currentBalance * WC_TO_INR_RATE).toFixed(0)} INR</strong> (~${(currentBalance * WC_TO_USD_RATE).toFixed(2)} USD)
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span>Rate: 1,000 WC = ₹100 INR</span>
                </div>
              </div>

          {/* Tier Progression Meter */}
          <div className="relative z-10 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-zinc-400">Progress to Next Tier</span>
              <span className="text-cyan font-bold">{currentBalance} / {nextTierThreshold} WC ({currentProgressPercent}%)</span>
            </div>
            <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-cyan to-violet rounded-full transition-all duration-1000"
                style={{ width: `${currentProgressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mt-1.5">
              <span>Current: Certified Weird</span>
              <span>Next: Reality-Breaking (2x battle vote weight)</span>
            </div>
          </div>
        </div>

        {/* Lifetime Earnings Quick Stat & Quick Action */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-2">
              Lifetime Yield
            </span>
            <h3 className="font-display font-black text-3xl text-zinc-900 dark:text-white mb-1">
              {currentBalance.toLocaleString()} WC
            </h3>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+{(currentBalance).toLocaleString()} WC accumulated</span>
            </span>

            <div className="mt-6 space-y-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <span>Scored Uploads:</span>
                <strong className="text-zinc-900 dark:text-white">Active</strong>
              </div>
              <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <span>Versus Victor Bonus:</span>
                <strong className="text-zinc-900 dark:text-white">+50 WC / win</strong>
              </div>
              <div className="flex justify-between">
                <span>Cash-out Threshold:</span>
                <strong className="text-cyan-700 dark:text-cyan font-bold">{MIN_CASHOUT_THRESHOLD_WC} WC</strong>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
            <button
              onClick={handleOpenModal}
              disabled={currentBalance < MIN_CASHOUT_THRESHOLD_WC}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-mono text-xs font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <DollarSign className="w-4 h-4" />
              <span>Request Payout ({currentBalance >= MIN_CASHOUT_THRESHOLD_WC ? "Eligible" : `Need ${MIN_CASHOUT_THRESHOLD_WC - currentBalance} WC`})</span>
            </button>
            <Link
              href="/upload"
              className="w-full py-2 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-xs font-semibold transition-all text-center block"
            >
              Upload Photo to Earn +WC
            </Link>
          </div>
        </div>
      </div>

      {/* RAZORPAY INSTANT CREDIT TOP-UP */}
      <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900/80 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 shadow-xs relative overflow-hidden">
        <div className="max-w-3xl mb-6">
          <div className="flex items-center gap-2 text-violet font-mono text-xs uppercase tracking-wider mb-2">
            <Zap className="w-4 h-4" />
            <span>Instant Balance Recharge • Razorpay Secure</span>
          </div>

          <h3 className="font-display font-bold text-2xl text-zinc-900 dark:text-white mb-2">
            Top Up Weird Credits (WC)
          </h3>

          <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed">
            Need credits to score anomalies with Gemini Vision or supercharge your votes in Versus battles? Purchase credit bundles instantly via UPI, RuPay, Visa, Mastercard, or Netbanking.
          </p>

          {purchaseNotification && (
            <div className="mt-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{purchaseNotification}</span>
            </div>
          )}
        </div>

        {/* 3 Bundles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pack 1: Starter */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
                Starter Pack
              </span>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-black font-display text-zinc-900 dark:text-white">500</span>
                <span className="text-xs font-mono text-cyan font-bold">WC</span>
              </div>
              <p className="text-xs text-zinc-500 mb-4">
                Ideal for scoring submissions and casting daily Versus battle votes.
              </p>
            </div>
            <div>
              <div className="text-lg font-black font-mono text-zinc-900 dark:text-white mb-3">
                ₹99 <span className="text-[11px] font-normal text-zinc-400 font-mono">(~$1.20)</span>
              </div>
              <button
                onClick={() => handleBuyCredits("credits_pack_small")}
                disabled={purchasingPlan === "credits_pack_small"}
                className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-mono text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {purchasingPlan === "credits_pack_small" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Buy 500 WC</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Pack 2: Hunter (Popular) */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/90 border-2 border-violet relative flex flex-col justify-between shadow-md">
            <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-violet text-white text-[10px] font-mono font-bold tracking-wider">
              POPULAR (SAVE 16%)
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-violet font-semibold block mb-1">
                Hunter Pack
              </span>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-black font-display text-zinc-900 dark:text-white">1,500</span>
                <span className="text-xs font-mono text-cyan font-bold">WC</span>
              </div>
              <p className="text-xs text-zinc-500 mb-4">
                High-frequency hunter tier for full 5-D telemetry deep dives and battle multipliers.
              </p>
            </div>
            <div>
              <div className="text-lg font-black font-mono text-zinc-900 dark:text-white mb-3">
                ₹249 <span className="text-[11px] font-normal text-zinc-400 font-mono">(~$3.00)</span>
              </div>
              <button
                onClick={() => handleBuyCredits("credits_pack_medium")}
                disabled={purchasingPlan === "credits_pack_medium"}
                className="w-full py-2.5 px-3 rounded-xl bg-violet hover:bg-violet/90 text-white font-mono text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {purchasingPlan === "credits_pack_medium" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Buy 1,500 WC</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Pack 3: Vault (Best Value) */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold block mb-1">
                Vault Pack (SAVE 30%)
              </span>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-black font-display text-zinc-900 dark:text-white">5,000</span>
                <span className="text-xs font-mono text-cyan font-bold">WC</span>
              </div>
              <p className="text-xs text-zinc-500 mb-4">
                Maximum yield archive pack for power observers and research curators.
              </p>
            </div>
            <div>
              <div className="text-lg font-black font-mono text-zinc-900 dark:text-white mb-3">
                ₹699 <span className="text-[11px] font-normal text-zinc-400 font-mono">(~$8.40)</span>
              </div>
              <button
                onClick={() => handleBuyCredits("credits_pack_large")}
                disabled={purchasingPlan === "credits_pack_large"}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {purchasingPlan === "credits_pack_large" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Buy 5,000 WC</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RAZORPAYX PAYOUTS CASH-OUT GATEWAY */}
      <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900/80 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 shadow-xs relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono text-xs uppercase tracking-wider mb-2">
            <DollarSign className="w-4 h-4" />
            <span>Monetization & RazorpayX Payouts Direct Deposit</span>
          </div>

          <h3 className="font-display font-bold text-2xl text-zinc-900 dark:text-white mb-2">
            Creator Cash-Out Gate
          </h3>

          <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6">
            Observers who uncover rare phenomena can convert Weird Credits to real currency via RazorpayX Payouts (UPI ID or Direct Bank Transfer) once multi-vector abuse guards and threshold validation are satisfied.
          </p>

          {/* Anti-fraud requirement checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 mb-6 text-xs font-mono">
            <div className={`flex items-center gap-2 ${isCreatorEligible ? "text-zinc-700 dark:text-zinc-300" : "text-amber-600 dark:text-amber-400 font-semibold"}`}>
              {isCreatorEligible ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <span>{isCreatorEligible ? "Creator Program Eligible" : "CEP In Progress"}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span>Account Age &gt; 30 Days</span>
            </div>
            <div className={`flex items-center gap-2 ${currentBalance >= MIN_CASHOUT_THRESHOLD_WC ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-500"}`}>
              {currentBalance >= MIN_CASHOUT_THRESHOLD_WC ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              ) : (
                <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
              )}
              <span>Min. {MIN_CASHOUT_THRESHOLD_WC} WC (₹100)</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span>Cap: 50,000 WC/mo</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <div>
              <div className="text-xs font-mono text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                Payout Channels: RazorpayX UPI & Direct Bank Transfer
              </div>
              <div className="text-[11px] font-mono text-zinc-500">
                Direct to Indian bank accounts or UPI. Rate: 1 WC = ₹0.10. Protected by automated cluster sybil guards.
              </div>
            </div>

            <button
              onClick={handleOpenModal}
              disabled={!isCreatorEligible || currentBalance < MIN_CASHOUT_THRESHOLD_WC}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-mono font-bold text-xs transition-all active:scale-95 cursor-pointer shrink-0 shadow-xs"
            >
              {!isCreatorEligible
                ? "Locked: Complete Creator Program"
                : currentBalance >= MIN_CASHOUT_THRESHOLD_WC
                ? "Initiate Payout Request"
                : `Requires ${MIN_CASHOUT_THRESHOLD_WC} WC to Cash Out`}
            </button>
          </div>
        </div>
      </div>

      {/* PAYOUT REQUESTS STATUS TRACKER (IF ANY) */}
      {payouts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-xl text-zinc-900 dark:text-white tracking-tight">
                Cash-Out Requests
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                Real-time review status of your submitted payout requests.
              </p>
            </div>
            <button
              onClick={fetchData}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              title="Refresh status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/80 font-mono text-xs shadow-xs">
            {payouts.map((p) => {
              const statusConfig = {
                pending: { label: "Under Human Review", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30", icon: Clock },
                approved: { label: "Approved", color: "bg-violet/10 text-violet border-violet/30", icon: ShieldCheck },
                paid: { label: "Paid via RazorpayX", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
                rejected: { label: "Rejected (Refunded)", color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30", icon: AlertTriangle },
              }[p.status] || { label: p.status, color: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700", icon: Clock };

              const StatusIcon = statusConfig.icon;

              return (
                <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-zinc-900 dark:text-white text-sm">{p.amount} WC</span>
                      <span className="text-zinc-400">→</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">₹{(p.amount * WC_TO_INR_RATE).toFixed(0)} INR</span>
                      <span className="text-zinc-500 text-[10px]">(${(p.amount * WC_TO_USD_RATE).toFixed(2)} USD)</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Destination: <strong className="text-zinc-800 dark:text-zinc-300">{p.payout_details.method.toUpperCase()}</strong> ({p.payout_details.upi_id || `Acc ...${p.payout_details.account_number?.slice(-4)}`}) • Requested: {new Date(p.requested_at).toLocaleDateString()}
                    </div>
                    {p.admin_notes && (
                      <div className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/80 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 inline-block">
                        Note: {p.admin_notes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${statusConfig.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{statusConfig.label}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* IMMUTABLE CREDIT TRANSACTIONS LEDGER */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-xl text-zinc-900 dark:text-white tracking-tight">
              Credit Ledger Audit Trail
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              Immutable log of every credit earned, battle victory, and cash-out.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            {transactions.length} Transactions Logged
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/80 font-mono text-xs shadow-xs">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 dark:text-zinc-500 font-mono">
              No credit transactions recorded yet. Upload a photo or participate in a VS Battle!
            </div>
          ) : (
            transactions.map((tx) => {
              const isPositive = tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isPositive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                      }`}
                    >
                      {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-white text-xs">{tx.reason}</div>
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • Tx #{tx.id.slice(0, 8)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`font-bold text-sm ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {isPositive ? `+${tx.amount}` : tx.amount} WC
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  )}

      {/* REQUEST PAYOUT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-white">Request Cash-Out Payout</h3>
                  <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">RazorpayX Direct Deposit</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-mono flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitPayout} className="space-y-4 font-mono text-xs">
              {/* Payment Method Selector */}
              <div>
                <label className="text-zinc-600 dark:text-zinc-400 block mb-1.5">Payout Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod("upi")}
                    className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      payoutMethod === "upi"
                        ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 font-bold"
                        : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>UPI ID (VPA)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod("bank_account")}
                    className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      payoutMethod === "bank_account"
                        ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 font-bold"
                        : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Bank Transfer (IMPS)</span>
                  </button>
                </div>
              </div>

              {/* Recipient Full Name */}
              <div>
                <label className="text-zinc-600 dark:text-zinc-400 block mb-1">Account Holder / Recipient Name</label>
                <input
                  type="text"
                  value={payoutName}
                  onChange={(e) => setPayoutName(e.target.value)}
                  placeholder="e.g. Alex Hunter"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-hidden focus:border-emerald-500/60"
                  required
                />
              </div>

              {/* Method-specific inputs */}
              {payoutMethod === "upi" ? (
                <div>
                  <label className="text-zinc-600 dark:text-zinc-400 block mb-1">UPI ID (Virtual Payment Address)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. alex@okhdfcbank"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-hidden focus:border-emerald-500/60"
                    required
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">Supports Google Pay, PhonePe, Paytm, BHIM.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-zinc-600 dark:text-zinc-400 block mb-1">Bank Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 50100234567890"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-hidden focus:border-emerald-500/60"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-zinc-600 dark:text-zinc-400 block mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0001234"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 uppercase focus:outline-hidden focus:border-emerald-500/60"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Amount Slider / Selector */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-zinc-600 dark:text-zinc-400">Withdraw Amount (WC)</label>
                  <span className="font-bold text-zinc-900 dark:text-white text-sm">{payoutAmount} WC</span>
                </div>

                <input
                  type="range"
                  min={MIN_CASHOUT_THRESHOLD_WC}
                  max={Math.min(MONTHLY_CASHOUT_CAP_WC, Math.max(MIN_CASHOUT_THRESHOLD_WC, currentBalance))}
                  step="50"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />

                <div className="flex justify-between text-[11px] text-zinc-500 mt-1">
                  <span>Min: {MIN_CASHOUT_THRESHOLD_WC} WC (₹100)</span>
                  <span>Monthly Cap: {MONTHLY_CASHOUT_CAP_WC.toLocaleString()} WC (₹5,000)</span>
                </div>

                {/* Conversion Summary Banner */}
                <div className="mt-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Estimated Cashout:</span>
                  <div className="text-right">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">₹{(payoutAmount * WC_TO_INR_RATE).toFixed(0)} INR</span>
                    <span className="text-zinc-500 text-[10px] ml-1.5">(${(payoutAmount * WC_TO_USD_RATE).toFixed(2)} USD)</span>
                  </div>
                </div>
              </div>

              {/* Abuse Guards Confirmation Note */}
              <div className="text-[10px] text-zinc-500 leading-relaxed bg-zinc-50 dark:bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800/80">
                Notice: All payout requests require Creator Program eligibility, minimum 30-day account age, and are subject to anti-sybil cluster verification before disbursement.
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !isCreatorEligible || currentBalance < MIN_CASHOUT_THRESHOLD_WC}
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Request</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
