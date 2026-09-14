"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  Users, 
  Eye, 
  Camera, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trophy, 
  ArrowRight, 
  RefreshCw, 
  ShieldCheck, 
  Zap, 
  Lock,
  IndianRupee
} from "lucide-react";
import confetti from "canvas-confetti";
import { formatINR, CEP_THRESHOLDS } from "@/lib/credits";

interface ProgressItem {
  current: number;
  required: number;
  complete: boolean;
}

interface EligibilityData {
  isEnrolled: boolean;
  isEligible: boolean;
  isSuspended: boolean;
  posts: ProgressItem;
  followers: ProgressItem;
  impressions: ProgressItem;
  daysRemaining: number | null;
  deadlineDate: string | null;
  enrollmentDate: string | null;
  qualificationDate: string | null;
  overallProgress: number;
}

interface CreatorProgramCardProps {
  onStatusChange?: (isEligible: boolean) => void;
}

export const CreatorProgramCard: React.FC<CreatorProgramCardProps> = ({ onStatusChange }) => {
  const [data, setData] = useState<EligibilityData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [enrolling, setEnrolling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/earnings/eligibility");
      const result = await res.json();
      if (res.ok && result.success) {
        setData(result.progress);
        if (onStatusChange) {
          onStatusChange(result.progress.isEligible);
        }
      } else {
        setError(result.error || "Failed to load creator eligibility data.");
      }
    } catch (err: any) {
      setError(err.message || "Network error loading creator program.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const handleEnroll = async () => {
    setEnrolling(true);
    setError(null);
    try {
      const res = await fetch("/api/earnings/eligibility", { method: "POST" });
      const result = await res.json();
      if (res.ok && result.success) {
        setData(result.progress);
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#FF9933", "#FFFFFF", "#138808", "#000080"], // Indian tricolor celebration
        });
        if (onStatusChange) {
          onStatusChange(result.progress.isEligible);
        }
      } else {
        setError(result.error || "Enrollment failed. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Enrollment failed.");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800 text-center animate-pulse">
        <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-zinc-800 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-zinc-500 animate-spin" />
        </div>
        <div className="h-4 w-48 bg-zinc-800 rounded mx-auto mb-2" />
        <div className="h-3 w-64 bg-zinc-800/60 rounded mx-auto" />
      </div>
    );
  }

  // Fallback defaults if not logged in or null
  const progress: EligibilityData = data || {
    isEnrolled: false,
    isEligible: false,
    isSuspended: false,
    posts: { current: 0, required: CEP_THRESHOLDS.min_posts, complete: false },
    followers: { current: 0, required: CEP_THRESHOLDS.min_followers, complete: false },
    impressions: { current: 0, required: CEP_THRESHOLDS.min_impressions, complete: false },
    daysRemaining: 90,
    deadlineDate: null,
    enrollmentDate: null,
    qualificationDate: null,
    overallProgress: 0,
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-b from-zinc-900/90 via-zinc-950 to-zinc-900 border border-zinc-800 text-white shadow-2xl p-6 sm:p-8">
      {/* Glow Effects */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              WECA CREATOR ELIGIBILITY PROGRAM (CEP)
            </span>
            <span className="text-zinc-500 text-xs font-mono">• Made in India 🇮🇳</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white">
            Monetize Weirdness to Real Rupees
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-mono mt-1">
            Post candid anomalies, build a curious following, and unlock passive WC earnings convertible to INR.
          </p>
        </div>

        {/* Status Badge */}
        <div className="shrink-0">
          {progress.isEligible ? (
            <div className="px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/40">
              <ShieldCheck className="w-5 h-5" />
              <span>MONETIZATION ACTIVE</span>
            </div>
          ) : progress.isEnrolled ? (
            <div className="px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono text-xs font-bold flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>90-DAY AUDITION ({progress.daysRemaining ?? 90}d left)</span>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-2xl bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono text-xs font-bold flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>NOT ENROLLED</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="relative z-10 mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Program Summary Cards / Milestones */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
        {/* Milestone 1: Weird Posts */}
        <div className={`p-5 rounded-2xl border transition-all ${
          progress.posts.complete 
            ? "bg-emerald-950/20 border-emerald-500/30" 
            : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              progress.posts.complete ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400"
            }`}>
              <Camera className="w-4 h-4" />
            </div>
            {progress.posts.complete ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <span className="text-[11px] font-mono text-zinc-500">Milestone 1</span>
            )}
          </div>
          <div className="text-xs font-mono text-zinc-400 mb-1">5+ Weird Uploads</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-display font-black text-white">{progress.posts.current}</span>
            <span className="text-xs font-mono text-zinc-500">/ {progress.posts.required} Scored Posts</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-2">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                progress.posts.complete ? "bg-emerald-400" : "bg-amber-400"
              }`}
              style={{ width: `${Math.min(100, (progress.posts.current / progress.posts.required) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] font-mono text-zinc-500">
            Real daily-life funny or weird images with AI score ≥ 30.
          </p>
        </div>

        {/* Milestone 2: 1,000 Followers */}
        <div className={`p-5 rounded-2xl border transition-all ${
          progress.followers.complete 
            ? "bg-emerald-950/20 border-emerald-500/30" 
            : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              progress.followers.complete ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400"
            }`}>
              <Users className="w-4 h-4" />
            </div>
            {progress.followers.complete ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <span className="text-[11px] font-mono text-zinc-500">Milestone 2</span>
            )}
          </div>
          <div className="text-xs font-mono text-zinc-400 mb-1">1,000 Followers</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-display font-black text-white">{progress.followers.current.toLocaleString()}</span>
            <span className="text-xs font-mono text-zinc-500">/ {progress.followers.required.toLocaleString()} Followers</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-2">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                progress.followers.complete ? "bg-emerald-400" : "bg-cyan-400"
              }`}
              style={{ width: `${Math.min(100, (progress.followers.current / progress.followers.required) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] font-mono text-zinc-500">
            Attract curious observers who follow your unique anomalies.
          </p>
        </div>

        {/* Milestone 3: 1 Lakh Impressions */}
        <div className={`p-5 rounded-2xl border transition-all ${
          progress.impressions.complete 
            ? "bg-emerald-950/20 border-emerald-500/30" 
            : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              progress.impressions.complete ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400"
            }`}>
              <Eye className="w-4 h-4" />
            </div>
            {progress.impressions.complete ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <span className="text-[11px] font-mono text-zinc-500">Milestone 3</span>
            )}
          </div>
          <div className="text-xs font-mono text-zinc-400 mb-1">1,00,000 (1 Lakh) Views</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-display font-black text-white">{progress.impressions.current.toLocaleString()}</span>
            <span className="text-xs font-mono text-zinc-500">/ 1,00,000 Impressions</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-2">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                progress.impressions.complete ? "bg-emerald-400" : "bg-violet-400"
              }`}
              style={{ width: `${Math.min(100, (progress.impressions.current / progress.impressions.required) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] font-mono text-zinc-500">
            Algorithmic reel scroll distribution pushes your posts to feed.
          </p>
        </div>
      </div>

      {/* Overall Progress Meter & Call to Action */}
      <div className="relative z-10 p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="w-full sm:w-2/3">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-zinc-400 flex items-center gap-2">
              <span>Overall Program Progress</span>
              {progress.isEnrolled && progress.daysRemaining !== null && (
                <span className="text-amber-400 font-bold">({progress.daysRemaining} days remaining)</span>
              )}
            </span>
            <span className="font-bold text-emerald-400">{progress.overallProgress}% Complete</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div 
              className="h-full bg-linear-to-r from-amber-400 via-cyan-400 to-emerald-400 rounded-full transition-all duration-1000"
              style={{ width: `${progress.overallProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 mt-2">
            <span>₹0.10 / WC rate</span>
            <span>Min Cash-out: 1,000 WC ({formatINR(100)})</span>
            <span>Daily Cap: 500 WC ({formatINR(50)})</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3 shrink-0">
          {!progress.isEnrolled ? (
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-mono text-xs font-black transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-950/50"
            >
              {enrolling ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enrolling 90-Day Clock...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Start 90-Day Creator Journey</span>
                </>
              )}
            </button>
          ) : progress.isEligible ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Earning Unlocked</span>
              </span>
              <button
                onClick={fetchProgress}
                className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                title="Refresh Status"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link
                href="/upload"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Upload Weird Image</span>
              </Link>
              <button
                onClick={fetchProgress}
                className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                title="Refresh Status"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
