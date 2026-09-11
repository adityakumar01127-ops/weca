"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Post, Profile } from "@/lib/types";
import { getProfileWithPosts } from "@/lib/supabase/data";
import { User as UserIcon, Coins, Image as ImageIcon, Calendar, ArrowLeft } from "lucide-react";

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let ignore = false;
    getProfileWithPosts(username).then((res) => {
      if (!ignore) {
        setProfile(res.profile);
        setPosts(res.posts);
        setLoading(false);
      }
    });

    return () => {
      ignore = true;
    };
  }, [username]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Profile not found
        </h2>
        <p className="text-xs text-zinc-500">
          The user @{username} doesn&apos;t seem to exist.
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

  return (
    <div className="max-w-2xl mx-auto space-y-8">
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

      {/* Profile Header */}
      <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
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
                {profile.display_name || profile.username}
              </h1>
              <p className="text-xs font-mono text-zinc-400">
                @{profile.username}
              </p>
              {profile.bio && (
                <p className="text-xs text-zinc-600 dark:text-zinc-300 pt-1 leading-relaxed">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-right shrink-0">
            <div className="flex items-center gap-1.5 justify-end text-xs font-mono text-zinc-500">
              <Coins className="w-3.5 h-3.5" />
              <span>Credits</span>
            </div>
            <div className="font-mono font-bold text-lg text-zinc-900 dark:text-white mt-0.5">
              {profile.credits_balance || 0}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs font-mono text-zinc-500">
          <div className="flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{posts.length} {posts.length === 1 ? "Post" : "Posts"}</span>
          </div>
          {profile.created_at && (
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
          Photographs
        </h2>

        {posts.length === 0 ? (
          <div className="py-12 text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6">
            <p className="text-xs text-zinc-500">
              No photographs shared yet.
            </p>
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
  );
}
