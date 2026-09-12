"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Post } from "@/lib/types";
import { getPosts } from "@/lib/supabase/data";
import { useAuth } from "@/context/AuthContext";
import { PostCard } from "@/components/feed/PostCard";
import { Plus, RefreshCw, Sparkles } from "lucide-react";

export default function FeedPage() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshFeed = async () => {
    setLoading(true);
    try {
      const currentUserId = user?.id || profile?.id;
      const data = await getPosts(currentUserId);
      setPosts(data);
    } catch (err) {
      console.error("Failed to refresh feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const currentUserId = user?.id || profile?.id;

    getPosts(currentUserId)
      .then((data) => {
        if (!ignore) {
          setPosts(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load feed:", err);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [user?.id, profile?.id]);

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-8">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-5 border-b border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 text-xs font-mono mb-2">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Community Stream</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight leading-[1.1]">
            Feed
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-mono mt-1">
            Newest photographs scored for weirdness & uniqueness
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshFeed}
            className="p-2 rounded-lg border border-zinc-800 hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/upload"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-medium transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload</span>
          </Link>
        </div>
      </div>

      {/* Posts Stream */}
      {loading && posts.length === 0 ? (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 h-96 animate-pulse"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 space-y-3">
          <p className="text-sm text-zinc-500">
            No photographs have been shared yet.
          </p>
          <Link
            href="/upload"
            className="inline-block px-4 py-2 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-medium"
          >
            Upload the first photograph
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
