"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { WicaImage, Comment, getTierFromScore, getTierColor } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { X, Heart, MessageSquare, Send, Sparkles, MapPin, Share2, Check } from "lucide-react";
import { getSafeImageUrl } from "@/lib/utils/image";

interface PhotoDetailModalProps {
  image: WicaImage | null;
  onClose: () => void;
  onUpdateLikes?: (imageId: string, liked: boolean, count: number) => void;
}

export const PhotoDetailModal: React.FC<PhotoDetailModalProps> = ({
  image,
  onClose,
  onUpdateLikes,
}) => {
  const { user, openAuthModal } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [loadingComments, setLoadingComments] = useState<boolean>(true);
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);
  const [liked, setLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!image) return;

    let ignore = false;
    const timer = setTimeout(() => {
      setLiked(Boolean(image.user_has_liked));
      setLikeCount(image.likes_count || 0);
    }, 0);

    fetch(`/api/comments?imageId=${image.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore && data.comments) {
          setComments(data.comments);
        }
      })
      .catch((err) => {
        console.error("Failed to load comments:", err);
      })
      .finally(() => {
        if (!ignore) setLoadingComments(false);
      });

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [image]);

  if (!image) return null;

  const tier = getTierFromScore(image.wica_score);
  const tierColors = getTierColor(tier);

  const handleToggleLike = async () => {
    if (!user) {
      openAuthModal();
      return;
    }

    const nextLiked = !liked;
    const nextCount = Math.max(0, likeCount + (nextLiked ? 1 : -1));
    setLiked(nextLiked);
    setLikeCount(nextCount);

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
        onUpdateLikes?.(image.id, data.liked, data.count);
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
      setLiked(liked);
      setLikeCount(likeCount);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!user) {
      openAuthModal();
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId: image.id,
          userId: user.id,
          text: newComment.trim(),
          username: user.username,
          avatarUrl: user.avatar_url,
        }),
      });
      const data = await res.json();
      if (data.comment) {
        setComments((prev) => [...prev, data.comment]);
        setNewComment("");
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `Check out this anomaly on Wica: "${image.ai_verdict}" (Wica Score: ${image.wica_score}/100)`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-zinc-600 hover:text-ink shadow-sm transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Photo Display */}
        <div className="md:w-3/5 bg-zinc-950 flex items-center justify-center relative overflow-hidden min-h-[300px] md:min-h-full">
          <img
            src={getSafeImageUrl(image.storage_path)}
            alt={image.caption || image.ai_verdict}
            className="w-full h-full max-h-[85vh] object-contain"
          />

          {/* Category Tag */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-ink/80 backdrop-blur-md text-xs font-mono font-medium text-white border border-white/10">
              {image.category}
            </span>
            {image.country && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-ink/80 backdrop-blur-md text-xs font-mono text-cyan border border-white/10">
                <MapPin className="w-3 h-3" />
                <span>{image.country}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Score Rubric & Comments */}
        <div className="md:w-2/5 flex flex-col h-full bg-white overflow-y-auto">
          {/* Header & Author */}
          <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
            <Link
              href={`/profile/${image.author?.username || "unknown"}`}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <img
                src={image.author?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${image.user_id}`}
                alt={image.author?.username || "author"}
                className="w-9 h-9 rounded-full object-cover bg-zinc-100 ring-1 ring-zinc-200"
              />
              <div>
                <span className="font-mono font-bold text-xs text-ink block">
                  @{image.author?.username || "explorer"}
                </span>
                <span className="text-[11px] text-zinc-400">
                  {new Date(image.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </Link>

            <button
              onClick={handleCopyLink}
              className="p-2 rounded-lg text-zinc-400 hover:text-ink hover:bg-zinc-100 transition-colors"
              title="Copy share link"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>

          {/* AI Verdict & Score Badge */}
          <div className="p-5 border-b border-zinc-100 bg-zinc-50/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold">
                AI Weirdness Evaluation
              </span>
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border shadow-xs ${tierColors.bg} ${tierColors.text} ${tierColors.border}`}
              >
                <span>{image.wica_score}</span>
                <span className="text-[10px] text-zinc-500 font-normal">/100</span>
                <span>• {tier}</span>
              </div>
            </div>

            <p className="font-display font-semibold text-ink text-base leading-snug">
              “{image.ai_verdict}”
            </p>

            {image.caption && (
              <p className="text-xs text-zinc-600 mt-2 italic">
                &ldquo;{image.caption}&rdquo;
              </p>
            )}

            {/* Rubric Breakdown Accordion */}
            <div className="mt-4 pt-3 border-t border-zinc-200/60 space-y-2 text-xs">
              {[
                { label: "Absurdity", val: image.absurdity, color: "bg-violet" },
                { label: "Rarity", val: image.rarity, color: "bg-cyan" },
                { label: "Craft", val: image.craft, color: "bg-zinc-700" },
                { label: "Cultural Novelty", val: image.cultural_novelty, color: "bg-magenta" },
                { label: "Wit", val: image.wit, color: "bg-amber-400" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-zinc-500 text-[11px] font-medium w-28">{item.label}</span>
                  <div className="flex-1 h-1.5 bg-zinc-200/70 rounded-full mx-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${(item.val || 5) * 10}%` }}
                    />
                  </div>
                  <span className="font-mono text-zinc-700 font-bold text-[11px] w-5 text-right">
                    {item.val || 5}
                  </span>
                </div>
              ))}
            </div>

            {/* Like Action Bar */}
            <div className="mt-4 pt-3 border-t border-zinc-200/60 flex items-center justify-between">
              <button
                type="button"
                onClick={handleToggleLike}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all ${
                  liked
                    ? "bg-pink-50 border-pink-200 text-magenta font-bold"
                    : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                }`}
              >
                <Heart className={`w-4 h-4 ${liked ? "fill-magenta text-magenta" : ""}`} />
                <span>{likeCount} {likeCount === 1 ? "Like" : "Likes"}</span>
              </button>

              <div className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{comments.length} Comments</span>
              </div>
            </div>
          </div>

          {/* Comments Thread */}
          <div className="flex-1 p-5 overflow-y-auto space-y-3.5 min-h-[160px]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
              Discussion
            </span>

            {loadingComments ? (
              <div className="py-6 text-center text-xs text-zinc-400 font-mono">
                Loading comments...
              </div>
            ) : comments.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400 font-mono">
                No observations yet. Be the first to comment!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2.5 text-xs">
                  <img
                    src={comment.author?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${comment.user_id}`}
                    alt={comment.author?.username || "commenter"}
                    className="w-6 h-6 rounded-full object-cover bg-zinc-100 shrink-0 mt-0.5"
                  />
                  <div className="flex-1 bg-zinc-50 rounded-xl p-2.5 border border-zinc-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-semibold text-ink text-[11px]">
                        @{comment.author?.username || "user"}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {new Date(comment.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-zinc-700 leading-relaxed">{comment.body}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Post Comment Input */}
          <form onSubmit={handleAddComment} className="p-3 border-t border-zinc-100 bg-white">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={user ? "Add a reaction or insight..." : "Sign in to join discussion"}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={!user || submittingComment}
                className="flex-1 px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet transition-colors placeholder:text-zinc-400 disabled:bg-zinc-50"
              />
              <button
                type="submit"
                disabled={!user || !newComment.trim() || submittingComment}
                className="p-2 rounded-xl bg-ink hover:bg-zinc-800 text-white disabled:opacity-40 transition-colors"
                title="Post comment"
              >
                <Send className="w-4 h-4 text-cyan" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
