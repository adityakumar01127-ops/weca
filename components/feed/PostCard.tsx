"use client";

import React from "react";
import Link from "next/link";
import { Post } from "@/lib/types";
import { LikeButton } from "./LikeButton";
import { MessageSquare, User as UserIcon } from "lucide-react";

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
      <Link href={`/posts/${post.id}`} className="block relative bg-zinc-100 dark:bg-zinc-950">
        <img
          src={post.image_url}
          alt={post.caption || "Post photo"}
          className="w-full max-h-[550px] object-cover"
          loading="lazy"
        />
      </Link>

      {/* Caption & Actions */}
      <div className="p-4 space-y-3">
        {post.caption && (
          <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
            {post.caption}
          </p>
        )}

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
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 font-mono transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{post.comments_count || 0}</span>
            </Link>
          </div>

          <Link
            href={`/posts/${post.id}`}
            className="text-[11px] font-mono text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            View detail
          </Link>
        </div>
      </div>
    </article>
  );
};
