"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Post } from "@/lib/types";
import { LikeButton } from "./LikeButton";
import { MessageSquare, User as UserIcon, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface PostCardProps {
  post: Post;
}

function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${Math.max(1, diffMins)}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const author = post.profiles;
  const username = author?.username || "anonymous";
  const avatarUrl = author?.avatar_url;

  const [weirdnessScore, setWeirdnessScore] = useState<number | null | undefined>(post.weirdness_score);
  const [uniquenessScore, setUniquenessScore] = useState<number | null | undefined>(post.uniqueness_score);
  const [scoringStatus, setScoringStatus] = useState<string>(
    post.scoring_status || (post.weirdness_score != null ? "completed" : "scoring")
  );

  // Subscribe to live post updates via Supabase Realtime
  useEffect(() => {
    // If scores already exist and completed, no need to subscribe
    if (weirdnessScore != null && uniquenessScore != null && scoringStatus === "completed") {
      return;
    }

    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`post-realtime-${post.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "posts",
          filter: `id=eq.${post.id}`,
        },
        (payload) => {
          const updated = payload.new as Partial<Post>;
          if (updated.weirdness_score != null) {
            setWeirdnessScore(updated.weirdness_score);
          }
          if (updated.uniqueness_score != null) {
            setUniquenessScore(updated.uniqueness_score);
          }
          if (updated.scoring_status) {
            setScoringStatus(updated.scoring_status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [post.id, weirdnessScore, uniquenessScore, scoringStatus]);

  const hasScores = weirdnessScore != null && uniquenessScore != null;

  return (
    <article className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 overflow-hidden transition-all">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <Link
          href={`/profile/${username}`}
          className="flex items-center gap-2.5 group"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={username}
              className="w-7 h-7 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 text-xs">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:underline">
              {author?.display_name || username}
            </span>
            <span className="text-zinc-400 font-mono">@{username}</span>
          </div>
        </Link>

        <span className="text-[11px] font-mono text-zinc-400">
          {formatDate(post.created_at)}
        </span>
      </div>

      {/* Image */}
      <Link href={`/posts/${post.id}`} className="block relative bg-zinc-100 dark:bg-zinc-950 min-h-[300px] sm:min-h-[360px] overflow-hidden">
        <img
          src={post.image_url}
          alt={post.caption || "Post photo"}
          className="w-full h-auto min-h-[300px] sm:min-h-[360px] max-h-[550px] object-cover transition-transform duration-300 hover:scale-[1.01]"
        />
      </Link>

      {/* Caption, AI Scores & Actions */}
      <div className="p-4 space-y-3">
        {post.caption && (
          <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
            {post.caption}
          </p>
        )}

        {/* Phase 2: Live AI Vision Scores Badge */}
        <div className="flex items-center gap-2 pt-0.5">
          {hasScores ? (
            <div className="flex items-center gap-2 text-[11px] font-mono transition-opacity duration-300">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/80">
                <span className="text-zinc-400">weird:</span>
                <span className="font-semibold">{weirdnessScore}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/80">
                <span className="text-zinc-400">unique:</span>
                <span className="font-semibold">{uniquenessScore}</span>
              </span>
            </div>
          ) : scoringStatus === "failed" ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-400 text-[11px] font-mono border border-zinc-200 dark:border-zinc-800">
              unscored
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 text-[11px] font-mono animate-pulse border border-zinc-200 dark:border-zinc-800">
              <Sparkles className="w-3 h-3 text-amber-500 animate-spin" />
              <span>scoring…</span>
            </span>
          )}
        </div>

        {/* Action Bar */}
        <div className="pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
          <div className="flex items-center gap-2">
            <LikeButton
              postId={post.id}
              initialLiked={post.user_has_liked}
              initialCount={post.likes_count}
            />

            <Link
              href={`/posts/${post.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-mono transition-colors min-h-[44px] justify-center"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{post.comments_count || 0}</span>
            </Link>
          </div>

          <Link
            href={`/posts/${post.id}`}
            className="text-[11px] font-mono text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors px-2 py-2 min-h-[44px] inline-flex items-center"
          >
            View detail
          </Link>
        </div>
      </div>
    </article>
  );
};
