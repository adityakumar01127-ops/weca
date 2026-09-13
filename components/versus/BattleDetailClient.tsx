"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useAuth } from "@/context/AuthContext";
import { Battle } from "@/lib/types";
import { getBattleById } from "@/lib/supabase/data";
import { createClient } from "@/lib/supabase/client";
import { 
  Swords, 
  ArrowLeft, 
  CheckCircle2, 
  Trophy, 
  Lock, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles,
  Check
} from "lucide-react";

interface BattleDetailClientProps {
  battleId: string;
  initialBattle?: Battle | null;
}

export function BattleDetailClient({ battleId, initialBattle }: BattleDetailClientProps) {
  const router = useRouter();

  const { user, profile, loading: authLoading } = useAuth();
  const currentUserId = user?.id || profile?.id;

  const [battle, setBattle] = useState<Battle | null>(initialBattle || null);
  const [loading, setLoading] = useState<boolean>(!initialBattle);
  const [voting, setVoting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [justVoted, setJustVoted] = useState<boolean>(false);

  // Load battle
  const loadBattle = useCallback(async () => {
    if (!battleId) return;
    try {
      const data = await getBattleById(battleId, currentUserId);
      setBattle(data);
    } catch (err) {
      console.error("Failed to load battle:", err);
    } finally {
      setLoading(false);
    }
  }, [battleId, currentUserId]);

  useEffect(() => {
    if (authLoading) return;
    loadBattle();
  }, [loadBattle, authLoading]);

  // Realtime subscription for live vote tallies
  useEffect(() => {
    if (!battleId) return;
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`battle-${battleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "battle_votes",
          filter: `battle_id=eq.${battleId}`,
        },
        () => {
          loadBattle();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "battles",
          filter: `id=eq.${battleId}`,
        },
        () => {
          loadBattle();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [battleId, loadBattle]);

  const handleVote = async (targetPostId: string) => {
    if (!currentUserId) {
      router.push(`/login?next=/versus/${battleId}`);
      return;
    }
    if (!battle || battle.status === "ended") return;
    if (battle.is_creator) {
      setError("As the creator of this battle, you cannot vote in it.");
      return;
    }
    if (battle.user_has_voted) {
      setError("You have already voted in this battle.");
      return;
    }

    setVoting(true);
    setError(null);

    try {
      const res = await fetch("/api/battles/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          battle_id: battleId,
          voted_for_post_id: targetPostId,
          voter_id: currentUserId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit vote");
      }

      // Confetti burst on successful vote
      try {
        confetti({
          particleCount: 65,
          spread: 60,
          origin: { y: 0.65 },
          colors: ["#ffffff", "#a1a1aa", "#71717a", "#e4e4e7"],
        });
      } catch {}

      setJustVoted(true);
      setBattle(data.battle);
    } catch (err: any) {
      setError(err.message || "Failed to cast vote.");
    } finally {
      setVoting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100">
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
          <Swords className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mb-3" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Battle Not Found</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">This showdown might have been removed or does not exist.</p>
          <Link
            href="/versus"
            className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 text-sm font-medium transition-colors"
          >
            Return to Arena
          </Link>
        </div>
      </div>
    );
  }

  const isEnded = battle.status === "ended";
  const isCreator = battle.is_creator;
  const hasVoted = battle.user_has_voted;
  const showTally = hasVoted || isCreator || isEnded;

  const totalVotes = battle.total_votes || 0;
  const votesA = battle.votes_a_count || 0;
  const votesB = battle.votes_b_count || 0;
  const percentA = totalVotes > 0 ? Math.round((votesA / totalVotes) * 100) : 50;
  const percentB = 100 - percentA;

  const isWinnerA = isEnded && battle.winner_post_id === battle.post_a_id;
  const isWinnerB = isEnded && battle.winner_post_id === battle.post_b_id;
  const isTie = isEnded && !battle.winner_post_id && totalVotes > 0;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors duration-200">

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/versus"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Battles</span>
          </Link>

          <div className="flex items-center gap-2">
            {isEnded ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-mono border border-zinc-300 dark:border-zinc-700">
                <Lock className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                <span>Battle Ended</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-mono border border-zinc-200 dark:border-zinc-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active Showdown</span>
              </span>
            )}
            <span className="text-xs font-mono text-zinc-500">
              {totalVotes} / {battle.vote_threshold} votes
            </span>
          </div>
        </div>

        {/* Informative Creator / Blind Status Banner */}
        {isCreator && (
          <div className="mb-6 p-3.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-3 text-zinc-700 dark:text-zinc-300 text-xs">
            <ShieldCheck className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
            <span>
              You created this battle. Creator votes are disabled to prevent bias. You can monitor the live tally below.
            </span>
          </div>
        )}

        {!isCreator && !hasVoted && !isEnded && (
          <div className="mb-6 p-3.5 rounded-lg bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 flex items-center gap-3 text-zinc-600 dark:text-zinc-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
            <span>
              Blind voting active: The current vote tally is concealed until you cast your vote.
            </span>
          </div>
        )}

        {isEnded && (
          <div className="mb-6 p-4 rounded-xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-zinc-900 dark:text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Battle Concluded</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {isWinnerA
                    ? `Winner: Challenger A (${percentA}% of ${totalVotes} votes)`
                    : isWinnerB
                    ? `Winner: Challenger B (${percentB}% of ${totalVotes} votes)`
                    : isTie
                    ? "Result: Exact Tie"
                    : `Threshold reached with ${totalVotes} votes`}
                </p>
              </div>
            </div>
            <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Voting Locked
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-600 dark:text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Side-by-Side Match Arena */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Post A Card */}
          <div
            className={`flex flex-col rounded-2xl bg-white dark:bg-zinc-900/70 border overflow-hidden transition-all shadow-sm ${
              isWinnerA
                ? "border-zinc-900 dark:border-white ring-2 ring-zinc-900/20 dark:ring-white/20 shadow-xl"
                : battle.user_voted_for_post_id === battle.post_a_id
                ? "border-zinc-400 dark:border-zinc-500 ring-1 ring-zinc-400/50 dark:ring-zinc-500/50"
                : "border-zinc-200 dark:border-zinc-800"
            }`}
          >
            {/* Header / Badges */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Challenger A</span>
                {isWinnerA && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-[10px] font-bold font-mono">
                    <Trophy className="w-3 h-3" /> WINNER
                  </span>
                )}
                {battle.user_voted_for_post_id === battle.post_a_id && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-mono border border-zinc-200 dark:border-zinc-700">
                    <Check className="w-3 h-3 text-emerald-500" /> YOUR PICK
                  </span>
                )}
              </div>

              {battle.post_a?.profiles && (
                <span className="text-zinc-500 text-xs font-mono">
                  @{battle.post_a.profiles.username}
                </span>
              )}
            </div>

            {/* Photo Container */}
            <div className="relative aspect-[4/3] sm:aspect-square bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
              {battle.post_a?.image_url ? (
                <img
                  src={battle.post_a.image_url}
                  alt={battle.post_a.caption || "Challenger A"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-sm">
                  Photo unavailable
                </div>
              )}
            </div>

            {/* Caption & Score Details */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div className="mb-4">
                <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium line-clamp-2">
                  {battle.post_a?.caption || "Untitled photograph"}
                </p>

                {/* Weirdness & Uniqueness Scores */}
                {(battle.post_a?.weirdness_score != null || battle.post_a?.uniqueness_score != null) && (
                  <div className="flex items-center gap-2 mt-3 text-xs font-mono">
                    {battle.post_a.weirdness_score != null && (
                      <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60">
                        weird: {battle.post_a.weirdness_score}
                      </span>
                    )}
                    {battle.post_a.uniqueness_score != null && (
                      <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60">
                        unique: {battle.post_a.uniqueness_score}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action: Vote Button or Revealed Tally */}
              <div>
                {showTally ? (
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1.5">
                      <span className="font-semibold">{percentA}% of votes</span>
                      <span className="text-zinc-500">{battle.votes_a_count} votes</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                      <div
                        style={{ width: `${percentA}%` }}
                        className="h-full bg-zinc-900 dark:bg-white transition-all duration-700"
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => battle.post_a_id && handleVote(battle.post_a_id)}
                    disabled={voting || isEnded || isCreator}
                    className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-medium text-sm transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Vote for Challenger A</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Center VS Divider (desktop floating badge) */}
          <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white dark:bg-[#09090b] border-2 border-zinc-300 dark:border-zinc-700 items-center justify-center shadow-2xl">
            <span className="font-black text-sm tracking-widest text-zinc-900 dark:text-zinc-300">VS</span>
          </div>

          {/* Post B Card */}
          <div
            className={`flex flex-col rounded-2xl bg-white dark:bg-zinc-900/70 border overflow-hidden transition-all shadow-sm ${
              isWinnerB
                ? "border-zinc-900 dark:border-white ring-2 ring-zinc-900/20 dark:ring-white/20 shadow-xl"
                : battle.user_voted_for_post_id === battle.post_b_id
                ? "border-zinc-400 dark:border-zinc-500 ring-1 ring-zinc-400/50 dark:ring-zinc-500/50"
                : "border-zinc-200 dark:border-zinc-800"
            }`}
          >
            {/* Header / Badges */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Challenger B</span>
                {isWinnerB && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-[10px] font-bold font-mono">
                    <Trophy className="w-3 h-3" /> WINNER
                  </span>
                )}
                {battle.user_voted_for_post_id === battle.post_b_id && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-mono border border-zinc-200 dark:border-zinc-700">
                    <Check className="w-3 h-3 text-emerald-500" /> YOUR PICK
                  </span>
                )}
              </div>

              {battle.post_b?.profiles && (
                <span className="text-zinc-500 text-xs font-mono">
                  @{battle.post_b.profiles.username}
                </span>
              )}
            </div>

            {/* Photo Container */}
            <div className="relative aspect-[4/3] sm:aspect-square bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
              {battle.post_b?.image_url ? (
                <img
                  src={battle.post_b.image_url}
                  alt={battle.post_b.caption || "Challenger B"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-sm">
                  Photo unavailable
                </div>
              )}
            </div>

            {/* Caption & Score Details */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div className="mb-4">
                <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium line-clamp-2">
                  {battle.post_b?.caption || "Untitled photograph"}
                </p>

                {/* Weirdness & Uniqueness Scores */}
                {(battle.post_b?.weirdness_score != null || battle.post_b?.uniqueness_score != null) && (
                  <div className="flex items-center gap-2 mt-3 text-xs font-mono">
                    {battle.post_b.weirdness_score != null && (
                      <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60">
                        weird: {battle.post_b.weirdness_score}
                      </span>
                    )}
                    {battle.post_b.uniqueness_score != null && (
                      <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60">
                        unique: {battle.post_b.uniqueness_score}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action: Vote Button or Revealed Tally */}
              <div>
                {showTally ? (
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1.5">
                      <span className="font-semibold">{percentB}% of votes</span>
                      <span className="text-zinc-500">{battle.votes_b_count} votes</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                      <div
                        style={{ width: `${percentB}%` }}
                        className="h-full bg-zinc-900 dark:bg-white transition-all duration-700"
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => battle.post_b_id && handleVote(battle.post_b_id)}
                    disabled={voting || isEnded || isCreator}
                    className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-medium text-sm transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Vote for Challenger B</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Post-Vote Celebratory Note */}
        {justVoted && (
          <div className="mt-8 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">Your vote has been recorded!</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  The running community tally is now revealed. Battles lock automatically at 50 votes.
                </p>
              </div>
            </div>
            <Link
              href="/versus"
              className="text-xs text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white underline underline-offset-4"
            >
              Explore more battles
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
