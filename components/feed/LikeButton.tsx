"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toggleLike } from "@/lib/supabase/data";
import { Heart } from "lucide-react";

interface LikeButtonProps {
  postId: string;
  initialLiked?: boolean;
  initialCount?: number;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  postId,
  initialLiked = false,
  initialCount = 0,
}) => {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [liked, setLiked] = useState<boolean>(initialLiked);
  const [count, setCount] = useState<number>(initialCount);
  const [loading, setLoading] = useState<boolean>(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const currentUserId = user?.id || profile?.id;
    if (!currentUserId) {
      router.push("/login");
      return;
    }

    if (loading) return;

    // Optimistic update
    const nextLiked = !liked;
    const nextCount = nextLiked ? count + 1 : Math.max(0, count - 1);
    setLiked(nextLiked);
    setCount(nextCount);

    setLoading(true);
    try {
      const result = await toggleLike(postId, currentUserId);
      setLiked(result.liked);
      setCount(result.likesCount);
    } catch (err) {
      console.error("Failed to toggle like:", err);
      // Revert on error
      setLiked(liked);
      setCount(count);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
        liked
          ? "text-rose-500 bg-rose-50 dark:bg-rose-950/30"
          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900"
      }`}
      title={liked ? "Unlike" : "Like"}
    >
      <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} />
      <span>{count}</span>
    </button>
  );
};
