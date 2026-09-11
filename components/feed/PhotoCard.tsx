"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { WicaImage, getTierFromScore, getTierColor } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { Heart, MessageSquare, MapPin, Image as ImageIcon } from "lucide-react";
import { getSafeImageUrl } from "@/lib/utils/image";

interface PhotoCardProps {
  image: WicaImage;
  onOpenDetail: (image: WicaImage) => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ image, onOpenDetail }) => {
  const { user, openAuthModal } = useAuth();
  const [liked, setLiked] = useState<boolean>(Boolean(image.user_has_liked));
  const [likeCount, setLikeCount] = useState<number>(image.likes_count || 0);
  const [animatingLike, setAnimatingLike] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  const tier = getTierFromScore(image.wica_score);
  const tierColors = getTierColor(tier);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      openAuthModal();
      return;
    }

    const nextLiked = !liked;
    const nextCount = Math.max(0, likeCount + (nextLiked ? 1 : -1));

    // Optimistic UI update
    setLiked(nextLiked);
    setLikeCount(nextCount);
    if (nextLiked) {
      setAnimatingLike(true);
      setTimeout(() => setAnimatingLike(false), 500);
    }

    try {
      const res = await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId: image.id,
          userId: user.id,
        }),
      });
      const data = await res.json();
      if (typeof data.count === "number") {
        setLikeCount(data.count);
        setLiked(data.liked);
      }
    } catch (err) {
      console.error("Failed to like:", err);
      // Rollback
      setLiked(liked);
      setLikeCount(likeCount);
    }
  };

  return (
    <article
      onClick={() => onOpenDetail(image)}
      className="masonry-item group relative bg-white rounded-2xl border border-zinc-200 hover:border-zinc-300 transition-all duration-200 overflow-hidden cursor-pointer hover:shadow-md"
    >
      {/* Photo Container with natural varied aspect ratio */}
      <div className="relative w-full min-h-[180px] bg-zinc-100 flex items-center justify-center overflow-hidden">
        {/* Error Fallback */}
        {imageError ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400">
            <ImageIcon className="w-8 h-8 mb-1.5 opacity-40" />
            <span className="text-[11px] font-mono">Image unavailable</span>
          </div>
        ) : (
          <img
            src={getSafeImageUrl(image.storage_path)}
            alt={image.caption || image.ai_verdict || "Wica strange photo"}
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          {/* Category Pill */}
          <span className="px-2.5 py-1 rounded-full bg-ink/75 backdrop-blur-md text-[11px] font-mono font-medium text-white/90 border border-white/10 shadow-sm">
            {image.category}
          </span>

          {/* Wica Score Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-white/95 backdrop-blur-md border shadow-sm ${tierColors.text} ${tierColors.border}`}
          >
            <span className="text-[10px] uppercase font-sans text-zinc-400 font-semibold">WICA</span>
            <span>{image.wica_score}</span>
          </div>
        </div>

        {/* Location tag if present */}
        {image.country && (
          <div className="absolute bottom-2.5 left-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-md bg-ink/60 backdrop-blur-sm text-[10px] text-white/90 font-mono">
            <MapPin className="w-3 h-3 text-cyan" />
            <span>{image.country}</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4">
        {/* AI Verdict Quote */}
        <p className="font-display font-semibold text-ink text-sm sm:text-base leading-snug tracking-tight mb-2.5">
          “{image.ai_verdict}”
        </p>

        {/* Optional User Caption */}
        {image.caption && (
          <p className="text-xs text-zinc-500 line-clamp-2 mb-3">
            {image.caption}
          </p>
        )}

        {/* Footer info: Author & Like/Comment Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs text-zinc-500">
          {/* Author */}
          <Link
            href={`/profile/${image.author?.username || "unknown"}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 hover:text-ink transition-colors group/author"
          >
            <img
              src={image.author?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${image.user_id}`}
              alt={image.author?.username || "author"}
              className="w-5 h-5 rounded-full object-cover bg-zinc-100 ring-1 ring-zinc-200"
            />
            <span className="font-mono text-[11px] text-zinc-600 group-hover/author:text-ink">
              @{image.author?.username || "explorer"}
            </span>
          </Link>

          {/* Social Stats: Likes and Comments */}
          <div className="flex items-center gap-3 font-mono text-[11px]">
            {/* Likes */}
            <button
              type="button"
              onClick={handleToggleLike}
              className={`flex items-center gap-1 transition-colors ${
                liked ? "text-magenta font-semibold" : "text-zinc-500 hover:text-ink"
              }`}
              title={liked ? "Unlike" : "Like"}
            >
              <Heart
                className={`w-3.5 h-3.5 transition-transform ${
                  liked ? "fill-magenta text-magenta" : ""
                } ${animatingLike ? "scale-125" : "scale-100"}`}
              />
              <span>{likeCount}</span>
            </button>

            {/* Comments */}
            <div className="flex items-center gap-1 text-zinc-500 hover:text-ink transition-colors">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{image.comments_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
