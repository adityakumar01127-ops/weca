"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Post } from "@/lib/types";
import { getPostById } from "@/lib/supabase/data";
import { useAuth } from "@/context/AuthContext";
import { LikeButton } from "@/components/feed/LikeButton";
import { CommentSection } from "@/components/posts/CommentSection";
import { ArrowLeft, User as UserIcon } from "lucide-react";

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.id as string;

  const { user, profile } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let ignore = false;
    const currentUserId = user?.id || profile?.id;

    getPostById(postId, currentUserId).then((data) => {
      if (!ignore) {
        setPost(data);
        setLoading(false);
      }
    });

    return () => {
      ignore = true;
    };
  }, [postId, user?.id, profile?.id]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Post not found
        </h2>
        <p className="text-xs text-zinc-500">
          The requested photograph may have been removed or does not exist.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-medium"
        >
          Return to Feed
        </Link>
      </div>
    );
  }

  const author = post.profiles;
  const username = author?.username || "anonymous";

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Feed</span>
        </Link>
      </div>

      {/* Main Post Container */}
      <article className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden">
        {/* Author Header */}
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
          <Link
            href={`/profile/${username}`}
            className="flex items-center gap-2.5 group"
          >
            {author?.avatar_url ? (
              <img
                src={author.avatar_url}
                alt={username}
                className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 text-xs">
                <UserIcon className="w-4 h-4" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-xs font-medium text-zinc-900 dark:text-white group-hover:underline">
                {author?.display_name || username}
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                @{username}
              </span>
            </div>
          </Link>

          <span className="text-xs font-mono text-zinc-400">
            {new Date(post.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Image */}
        <div className="bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center">
          <img
            src={post.image_url}
            alt={post.caption || "Post photo"}
            className="w-full max-h-[640px] object-contain"
          />
        </div>

        {/* Caption & Like */}
        <div className="p-5 space-y-4">
          {post.caption && (
            <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
              {post.caption}
            </p>
          )}

          <div className="flex items-center gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <LikeButton
              postId={post.id}
              initialLiked={post.user_has_liked}
              initialCount={post.likes_count}
            />
          </div>
        </div>

        {/* Comments Section */}
        <div className="px-5 pb-6 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <CommentSection postId={post.id} />
        </div>
      </article>
    </div>
  );
}
