"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Battle } from "@/lib/types";
import { getBattles } from "@/lib/supabase/data";
import { Swords, Plus, Trophy, CheckCircle2, ArrowRight, Shield } from "lucide-react";

export function VersusClient() {
  const { user, profile } = useAuth();
  const currentUserId = user?.id || profile?.id;

  const [activeTab, setActiveTab] = useState<"active" | "ended">("active");
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await getBattles(activeTab, currentUserId);
        if (mounted) {
          setBattles(data);
        }
      } catch (err) {
        console.error("Failed to load battles:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [activeTab, currentUserId]);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors duration-200">
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-zinc-200 dark:border-zinc-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 text-xs font-mono mb-3">
              <Swords className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>Head-to-Head Anomaly Battles</span>
            </div>

            <h1 className="font-display font-black text-3xl sm:text-4xl text-zinc-900 dark:text-white tracking-tight leading-[1.1] mb-2">
              Versus Arena
            </h1>

            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base max-w-xl">
              Two candidate photographs enter. The community decides which breaks reality more. Votes are cast blindly to prevent bandwagon bias.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/versus/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-medium text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Start a VS</span>
            </Link>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center justify-between mt-8 mb-6">
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900/90 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800/80">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeTab === "active"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Active Showdowns
            </button>
            <button
              onClick={() => setActiveTab("ended")}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeTab === "ended"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Concluded Battles
            </button>
          </div>

          <div className="text-xs text-zinc-500 font-mono">
            {battles.length} {activeTab === "active" ? "active" : "ended"}
          </div>
        </div>

        {/* Battles Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-12">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-80 rounded-xl bg-zinc-100 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 animate-pulse"
              />
            ))}
          </div>
        ) : battles.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/20">
            <Swords className="w-10 h-10 text-zinc-400 dark:text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-300 mb-1">
              No {activeTab} battles right now
            </h3>
            <p className="text-sm text-zinc-500 max-w-md mx-auto mb-6">
              {activeTab === "active"
                ? "Be the first to pit two candid anomalies against each other in the arena."
                : "No battles have completed yet. Active battles end once they reach 50 votes or 48 hours."}
            </p>
            {activeTab === "active" && (
              <Link
                href="/versus/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100 text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Battle</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {battles.map((battle) => {
              const hasVoted = battle.user_has_voted;
              const isCreator = battle.is_creator;
              const isEnded = battle.status === "ended";
              const showTally = hasVoted || isCreator || isEnded;

              const totalVotes = battle.total_votes || 0;
              const votesA = battle.votes_a_count || 0;
              const percentA =
                totalVotes > 0
                  ? Math.round((votesA / totalVotes) * 100)
                  : 50;
              const percentB = 100 - percentA;

              return (
                <Link
                  key={battle.id}
                  href={`/versus/${battle.id}`}
                  className="group relative flex flex-col rounded-xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700/90 shadow-sm transition-all overflow-hidden"
                >
                  {/* Status Banner */}
                  <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {isEnded ? (
                        <span className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400 font-medium">
                          <Trophy className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Ended</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Active Clash</span>
                        </span>
                      )}
                      <span className="text-zinc-300 dark:text-zinc-600">•</span>
                      <span className="text-zinc-500 font-mono">
                        {battle.total_votes} / {battle.vote_threshold} votes
                      </span>
                    </div>

                    {isCreator && (
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/50">
                        Your Battle
                      </span>
                    )}
                    {!isCreator && hasVoted && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                        <span>Voted</span>
                      </span>
                    )}
                  </div>

                  {/* Side-by-Side Thumbnails */}
                  <div className="relative grid grid-cols-2 h-52 bg-zinc-950">
                    {/* Post A Thumbnail */}
                    <div className="relative h-full border-r border-zinc-800/60 overflow-hidden">
                      {battle.post_a?.image_url ? (
                        <img
                          src={battle.post_a.image_url}
                          alt={battle.post_a.caption || "Challenger A"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-700 text-xs">
                          Challenger A
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 text-left">
                        <div className="text-[10px] text-zinc-400 font-mono">Challenger A</div>
                        <div className="text-xs text-zinc-200 font-medium line-clamp-1">
                          {battle.post_a?.caption || "Untitled"}
                        </div>
                      </div>
                    </div>

                    {/* Post B Thumbnail */}
                    <div className="relative h-full overflow-hidden">
                      {battle.post_b?.image_url ? (
                        <img
                          src={battle.post_b.image_url}
                          alt={battle.post_b.caption || "Challenger B"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-700 text-xs">
                          Challenger B
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 text-left">
                        <div className="text-[10px] text-zinc-400 font-mono">Challenger B</div>
                        <div className="text-xs text-zinc-200 font-medium line-clamp-1">
                          {battle.post_b?.caption || "Untitled"}
                        </div>
                      </div>
                    </div>

                    {/* VS Badge */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-lg">
                      <span className="text-[10px] font-black tracking-widest text-zinc-900 dark:text-zinc-200">VS</span>
                    </div>
                  </div>

                  {/* Footer / Tally or Blind Teaser */}
                  <div className="p-4 bg-zinc-50/90 dark:bg-zinc-900/90 flex flex-col justify-between border-t border-zinc-100 dark:border-zinc-800/60">
                    {showTally ? (
                      <div>
                        <div className="flex items-center justify-between text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1.5">
                          <span>A: {percentA}% ({battle.votes_a_count})</span>
                          <span>B: {percentB}% ({battle.votes_b_count})</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex">
                          <div
                            style={{ width: `${percentA}%` }}
                            className="h-full bg-zinc-900 dark:bg-zinc-300 transition-all"
                          />
                          <div
                            style={{ width: `${percentB}%` }}
                            className="h-full bg-zinc-400 dark:bg-zinc-600 transition-all"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="inline-flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                          <Shield className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                          <span>Blind voting: vote to reveal tally</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-zinc-900 dark:text-white font-medium group-hover:translate-x-0.5 transition-transform">
                          <span>Vote</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
