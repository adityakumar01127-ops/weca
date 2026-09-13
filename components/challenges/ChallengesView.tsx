"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MOCK_CHALLENGES } from "@/lib/mockData";
import { Challenge, WicaImage } from "@/lib/types";
import { 
  Sparkles, 
  Clock, 
  Trophy, 
  Upload, 
  ThumbsUp, 
  CheckCircle2, 
  Calendar, 
  Tag, 
  ShieldCheck, 
  ArrowRight,
  Flame,
  Award
} from "lucide-react";
import confetti from "canvas-confetti";
import { getSafeImageUrl } from "@/lib/utils/image";

export const ChallengesView: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>(MOCK_CHALLENGES);
  const [activeTab, setActiveTab] = useState<"active" | "archive">("active");
  const [votedEntries, setVotedEntries] = useState<Record<string, boolean>>({});
  const [entryLikes, setEntryLikes] = useState<Record<string, number>>({
    "ch-img-1": 128,
    "ch-img-2": 94,
  });

  const activeChallenge = challenges.find((c) => c.status === "active") || challenges[0];
  const pastChallenges = challenges.filter((c) => c.status === "completed");

  const handleVoteEntry = (id: string) => {
    if (votedEntries[id]) return;
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#22D3EE", "#7C5CFC", "#FF4D8D"],
      });
    } catch {
      // ignore
    }
    setVotedEntries((prev) => ({ ...prev, [id]: true }));
    setEntryLikes((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  return (
    <div className="w-full space-y-8">
      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "active"
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-xs"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Active Sprint (#14)</span>
          </button>

          <button
            onClick={() => setActiveTab("archive")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "archive"
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-xs"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Hall of Past Winners</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
          <Clock className="w-3.5 h-3.5 text-violet" />
          <span>New challenge every Monday 00:00 UTC</span>
        </div>
      </div>

      {/* ACTIVE SPRINT TAB */}
      {activeTab === "active" && (
        <div className="space-y-8">
          {/* Hero Challenge Banner */}
          <div className="relative rounded-3xl bg-zinc-950 border border-zinc-800 text-white p-6 sm:p-8 overflow-hidden shadow-2xl">
            {/* Ambient Background Gradient */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-cyan/20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-violet/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <span className="px-3 py-1 rounded-full bg-cyan/20 text-cyan border border-cyan/40 text-xs font-mono font-bold">
                  ACTIVE CHALLENGE • #{activeChallenge.id.toUpperCase()}
                </span>
                <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-mono">
                  {activeChallenge.hashtag}
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-mono font-bold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  <span>+{activeChallenge.reward_wc} WC Bounty Pool</span>
                </span>
              </div>

              <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight leading-tight mb-3">
                {activeChallenge.title}: {activeChallenge.theme}
              </h2>

              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-6">
                {activeChallenge.description}
              </p>

              {/* Challenge Rules Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 mb-6 text-xs font-mono text-zinc-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan shrink-0" />
                  <span>Candid Optical Finds Only</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-violet shrink-0" />
                  <span>Zero AI or Filter Manipulation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-magenta shrink-0" />
                  <span>Vision Scored & Community Voted</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/#world-feed-heading"
                  className="px-6 py-3 rounded-xl bg-cyan hover:bg-cyan/90 text-zinc-950 font-display font-bold text-sm tracking-wide transition-all shadow-lg active:scale-95 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Submit Candidate Photo</span>
                </Link>

                <span className="text-xs font-mono text-zinc-400">
                  {activeChallenge.submissions_count} community observations logged so far
                </span>
              </div>
            </div>
          </div>

          {/* Submissions Section */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-xl text-zinc-900 dark:text-white tracking-tight">
                  Contending Submissions for {activeChallenge.hashtag}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  Upvote candidates to decide who splits the 500 WC prize bounty.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeChallenge.featured_images.map((img) => {
                const isVoted = votedEntries[img.id];
                const likes = entryLikes[img.id] || 0;

                return (
                  <div
                    key={img.id}
                    className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-16/10 bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
                        <img
                          src={getSafeImageUrl(img.storage_path)}
                          alt={img.caption || "Challenge Entry"}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-zinc-900/80 backdrop-blur-md text-white text-[11px] font-mono">
                            {img.country}
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-cyan/20 border border-cyan/40 text-cyan text-[11px] font-mono backdrop-blur-md">
                            Score: {img.wica_score}
                          </span>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono mb-2">
                          <span>By @{img.author?.username}</span>
                          <span>{img.created_at}</span>
                        </div>
                        <h4 className="font-display font-bold text-base text-zinc-900 dark:text-white mb-2">
                          {img.caption}
                        </h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 italic bg-zinc-50 dark:bg-zinc-950/60 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                          &ldquo;{img.ai_verdict}&rdquo;
                        </p>
                      </div>
                    </div>

                    <div className="p-5 pt-0 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 mt-2">
                      <div className="flex items-center gap-2 text-xs font-mono text-zinc-600 dark:text-zinc-300">
                        <Sparkles className="w-3.5 h-3.5 text-cyan" />
                        <span>{likes} Community Endorsements</span>
                      </div>

                      <button
                        onClick={() => handleVoteEntry(img.id)}
                        disabled={isVoted}
                        className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                          isVoted
                            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 cursor-default"
                            : "bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 cursor-pointer active:scale-95"
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{isVoted ? "Endorsed ✓" : "Endorse Find"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ARCHIVED WINNERS TAB */}
      {activeTab === "archive" && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800">
            <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-white">
              Archived Bounty Hall of Fame
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              Past challenge prompts and their winning anomaly submissions as crowned by community vote.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pastChallenges.map((ch) => (
              <div
                key={ch.id}
                className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-mono">
                      #{ch.id.toUpperCase()} • {ch.category}
                    </span>
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Concluded</span>
                    </span>
                  </div>

                  <h4 className="font-display font-bold text-lg text-zinc-900 dark:text-white mb-1">{ch.title}</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mb-4">{ch.theme}</p>

                  {ch.winner && (
                    <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/30 mb-4">
                      <div className="flex items-center gap-2 text-xs font-mono text-amber-700 dark:text-amber-400 font-bold mb-2">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        <span>Crowned Winner: @{ch.winner.hunter_name}</span>
                      </div>
                      <div className="flex gap-3">
                        <img
                          src={ch.winner.image_url}
                          alt={ch.winner.anomaly_title}
                          className="w-16 h-16 rounded-xl object-cover bg-zinc-100 dark:bg-zinc-800 shrink-0"
                        />
                        <div>
                          <h5 className="font-display font-bold text-xs text-zinc-900 dark:text-zinc-100 line-clamp-1">
                            {ch.winner.anomaly_title}
                          </h5>
                          <span className="text-[11px] font-mono text-cyan font-bold block mt-1">
                            Weca Score: {ch.winner.wica_score}/100
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                            Awarded +{ch.reward_wc} Weird Credits
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400 dark:text-zinc-500">
                  <span>{ch.submissions_count} total entries</span>
                  <span>Ended on {ch.ends_at.slice(0, 10)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
