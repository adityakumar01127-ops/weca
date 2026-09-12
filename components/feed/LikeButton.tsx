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
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer min-h-[44px] min-w-[44px] justify-center active:scale-90 select-none ${
        liked
          ? "text-rose-500 bg-rose-50 dark:bg-rose-950/40 font-semibold"
          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      }`}
      title={liked ? "Unlike" : "Like"}
    >
      <Heart className={`w-4 h-4 transition-transform ${liked ? "fill-current scale-110" : ""}`} />
      <span>{count}</span>
    </button>
  );
};

