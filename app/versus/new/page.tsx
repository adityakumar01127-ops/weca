"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { Post } from "@/lib/types";
import { getPosts, checkBattleCreationRateLimit } from "@/lib/supabase/data";
import { Swords, ArrowLeft, Check, AlertCircle, Sparkles, Shield, Clock } from "lucide-react";

export default function NewBattlePage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const currentUserId = user?.id || profile?.id;

  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPostA, setSelectedPostA] = useState<Post | null>(null);
  const [selectedPostB, setSelectedPostB] = useState<Post | null>(null);
  const [step, setStep] = useState<"pick-a" | "pick-b" | "review">("pick-a");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<{ allowed: boolean; remaining: number; max: number } | null>(null);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(true);

  useEffect(() => {
    async function init() {
      if (currentUserId) {
        const rl = await checkBattleCreationRateLimit(currentUserId);
        setRateLimit(rl);
      }
      try {
        const postList = await getPosts();
        setPosts(postList);
      } catch (err) {
        console.error("Failed to load posts:", err);
      } finally {
        setLoadingPosts(false);
      }
    }
    init();
  }, [currentUserId]);

  const handleSelect = (post: Post) => {
    setError(null);
    if (step === "pick-a") {
      setSelectedPostA(post);
      if (selectedPostB?.id === post.id) {
        setSelectedPostB(null);
      }
      setStep("pick-b");
    } else if (step === "pick-b") {
      if (selectedPostA?.id === post.id) {
        setError("Challenger B must be a different photo from Challenger A.");
        return;
      }
      setSelectedPostB(post);
      setStep("review");
    }
  };

  const handleCreateBattle = async () => {
    if (!selectedPostA || !selectedPostB) {
      setError("Please select two distinct photographs.");
      return;
    }
    if (selectedPostA.id === selectedPostB.id) {
      setError("Challenger A and Challenger B cannot be the same photo.");
      return;
    }
    if (rateLimit && !rateLimit.allowed) {
      setError(`Hourly battle creation limit reached (${rateLimit.max}/${rateLimit.max}). Please wait.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/battles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_a_id: selectedPostA.id,
          post_b_id: selectedPostB.id,
          created_by: currentUserId,
          vote_threshold: 50,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create battle");
      }

      router.push(`/versus/${data.battle.id}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong while launching the battle.");
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">

        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Back button & Title */}
          <div className="mb-6">
            <Link
              href="/versus"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Arena</span>
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  Start a VS Battle
                </h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Pit any two photos head-to-head. The community votes blindly until 50 votes are cast.
                </p>
              </div>

              {rateLimit && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300 self-start sm:self-auto">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>
                    {rateLimit.remaining}/{rateLimit.max} battles left this hour
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stepper & Selected Pair Preview */}
          <div className="mb-8 p-4 rounded-xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Challenger A Preview Card */}
              <div
                onClick={() => setStep("pick-a")}
                className={`relative p-3 rounded-lg border cursor-pointer transition-all ${
                  step === "pick-a"
                    ? "border-zinc-900 dark:border-zinc-300 bg-zinc-100 dark:bg-zinc-800/60"
                    : selectedPostA
                    ? "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/60"
                    : "border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Challenger A
                  </span>
                  {selectedPostA && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 dark:text-emerald-400">
                      <Check className="w-3 h-3" /> Selected
                    </span>
                  )}
                </div>

                {selectedPostA ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedPostA.image_url}
                      alt={selectedPostA.caption || "Challenger A"}
                      className="w-16 h-16 rounded object-cover border border-zinc-200 dark:border-zinc-700/60"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-800 dark:text-zinc-200 font-medium truncate">
                        {selectedPostA.caption || "Untitled"}
                      </p>
                      <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                        by @{selectedPostA.profiles?.username || "creator"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-zinc-400">
                    Click to select Challenger A below
                  </div>
                )}
              </div>

              {/* Challenger B Preview Card */}
              <div
                onClick={() => selectedPostA && setStep("pick-b")}
                className={`relative p-3 rounded-lg border cursor-pointer transition-all ${
                  step === "pick-b"
                    ? "border-zinc-900 dark:border-zinc-300 bg-zinc-100 dark:bg-zinc-800/60"
                    : selectedPostB
                    ? "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/60"
                    : "border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40"
                } ${!selectedPostA ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Challenger B
                  </span>
                  {selectedPostB && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 dark:text-emerald-400">
                      <Check className="w-3 h-3" /> Selected
                    </span>
                  )}
                </div>

                {selectedPostB ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedPostB.image_url}
                      alt={selectedPostB.caption || "Challenger B"}
                      className="w-16 h-16 rounded object-cover border border-zinc-200 dark:border-zinc-700/60"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-800 dark:text-zinc-200 font-medium truncate">
                        {selectedPostB.caption || "Untitled"}
                      </p>
                      <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                        by @{selectedPostB.profiles?.username || "creator"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-zinc-400">
                    {selectedPostA ? "Now click to select Challenger B" : "Select Challenger A first"}
                  </div>
                )}
              </div>
            </div>

            {/* Launch CTA bar */}
            {selectedPostA && selectedPostB && (
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-zinc-600 dark:text-zinc-400">
                  Ready to launch battle. Blind voting will be enabled automatically.
                </div>
                <button
                  onClick={handleCreateBattle}
                  disabled={submitting}
                  className="px-6 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Swords className="w-4 h-4" />
                  <span>{submitting ? "Launching..." : "Launch Battle"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-red-950/40 border border-red-800/60 flex items-center gap-3 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Selection Gallery */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
                {step === "pick-a"
                  ? "Step 1: Choose Challenger A"
                  : step === "pick-b"
                  ? "Step 2: Choose Challenger B"
                  : "Pick a photo to replace"}
              </h2>
              <span className="text-xs text-zinc-500 font-mono">
                {posts.length} photos available
              </span>
            </div>

            {loadingPosts ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="h-44 rounded-lg bg-zinc-200 dark:bg-zinc-900 animate-pulse" />
                ))}
              </div>
            ) : posts.length < 2 ? (
              <div className="py-12 text-center text-zinc-500 text-sm border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/20">
                You need at least 2 uploaded photos to start a battle.{" "}
                <Link href="/upload" className="text-zinc-900 dark:text-white underline underline-offset-4">
                  Upload a photo first
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {posts.map((post) => {
                  const isA = selectedPostA?.id === post.id;
                  const isB = selectedPostB?.id === post.id;
                  const isSelected = isA || isB;

                  return (
                    <div
                      key={post.id}
                      onClick={() => handleSelect(post)}
                      className={`group relative rounded-lg border overflow-hidden cursor-pointer transition-all aspect-square bg-zinc-950 ${
                        isSelected
                          ? "ring-2 ring-zinc-900 border-zinc-900 dark:ring-white dark:border-white"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
                      }`}
                    >
                      <img
                        src={post.image_url}
                        alt={post.caption || "Photo"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                      {isSelected && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-[10px] font-bold font-mono">
                          {isA ? "CHALLENGER A" : "CHALLENGER B"}
                        </div>
                      )}

                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-xs text-white font-medium truncate">
                          {post.caption || "Untitled"}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          @{post.profiles?.username || "creator"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
