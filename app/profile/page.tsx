"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { Post } from "@/lib/types";
import { getProfileWithPosts } from "@/lib/supabase/data";
import { User as UserIcon, Coins, Image as ImageIcon, Calendar } from "lucide-react";

export default function MyProfilePage() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let ignore = false;
    const currentId = profile?.username || user?.id || profile?.id;
    if (!currentId) return;

    getProfileWithPosts(currentId).then((res) => {
      if (!ignore) {
        setPosts(res.posts);
        setLoading(false);
      }
    });

    return () => {
      ignore = true;
    };
  }, [user?.id, profile?.id, profile?.username]);

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Profile Card */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-16 h-16 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                  <UserIcon className="w-8 h-8" />
                </div>
              )}

              <div className="space-y-1">
                <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {profile?.display_name || profile?.username || "Explorer"}
                </h1>
                <p className="text-xs font-mono text-zinc-400">
                  @{profile?.username || "user"}
                </p>
                {profile?.bio && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 pt-1 leading-relaxed">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Credits Balance (Schema reserved for Phase 2) */}
            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-right shrink-0">
              <div className="flex items-center gap-1.5 justify-end text-xs font-mono text-zinc-500">
                <Coins className="w-3.5 h-3.5" />
                <span>Credits</span>
              </div>
              <div className="font-mono font-bold text-lg text-zinc-900 dark:text-white mt-0.5">
                {profile?.credits_balance || 0}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs font-mono text-zinc-500">
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{posts.length} {posts.length === 1 ? "Post" : "Posts"}</span>
            </div>
            {profile?.created_at && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* User's Post Grid */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Your Photographs
          </h2>

          {loading ? (
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-square rounded-lg bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 space-y-3">
              <p className="text-xs text-zinc-500">
                You haven&apos;t uploaded any photographs yet.
              </p>
              <Link
                href="/upload"
                className="inline-block px-3.5 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-medium"
              >
                Upload Photo
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {posts.map((p) => (
                <Link
                  key={p.id}
                  href={`/posts/${p.id}`}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900"
                >
                  <img
                    src={p.image_url}
                    alt={p.caption || "Photo"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-mono font-medium gap-3">
                    <span>♥ {p.likes_count || 0}</span>
                    <span>💬 {p.comments_count || 0}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
