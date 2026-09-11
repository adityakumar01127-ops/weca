"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Post } from "@/lib/types";
import { getPosts } from "@/lib/supabase/data";
import { useAuth } from "@/context/AuthContext";
import { PostCard } from "@/components/feed/PostCard";
import { Plus, RefreshCw } from "lucide-react";

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
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Feed
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            Newest photographs from the community
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshFeed}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 transition-colors"
            title="Refresh feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/upload"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-medium transition-all"
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
