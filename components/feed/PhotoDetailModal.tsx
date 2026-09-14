"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { WicaImage, Comment, getTierFromScore, getTierColor } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { X, Heart, MessageSquare, Send, Sparkles, MapPin, Share2, Check, Bookmark, Edit3, Trash2, Loader2 } from "lucide-react";
import { getSafeImageUrl } from "@/lib/utils/image";
import { SuperLikeButton } from "./SuperLikeButton";

interface PhotoDetailModalProps {
  image: WicaImage | null;
  onClose: () => void;
  onUpdateLikes?: (imageId: string, liked: boolean, count: number) => void;
  onDeletePost?: (imageId: string) => Promise<void> | void;
  onEditPost?: (imageId: string, newCaption: string) => Promise<void> | void;
}

export const PhotoDetailModal: React.FC<PhotoDetailModalProps> = ({
  image,
  onClose,
  onUpdateLikes,
  onDeletePost,
  onEditPost,
}) => {
  const { user, openAuthModal } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [loadingComments, setLoadingComments] = useState<boolean>(true);
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);
  const [liked, setLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [isEditingCaption, setIsEditingCaption] = useState<boolean>(false);
  const [editedCaption, setEditedCaption] = useState<string>(image?.caption || "");
  const [savingCaption, setSavingCaption] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (!image) return;

    let ignore = false;
    const timer = setTimeout(() => {
      setLiked(Boolean(image.user_has_liked));
      setLikeCount(image.likes_count || 0);
      setEditedCaption(image.caption || "");
      setIsEditingCaption(false);
      setConfirmDelete(false);
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

    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem("weca_saved_posts") || "[]");
        setIsBookmarked(saved.includes(image.id));
      } catch {}
    }

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

  const handleToggleBookmark = () => {
    if (!image) return;
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem("weca_saved_posts") || "[]");
        let updated: string[];
        if (saved.includes(image.id)) {
          updated = saved.filter((id: string) => id !== image.id);
          setIsBookmarked(false);
        } else {
          updated = [...saved, image.id];
          setIsBookmarked(true);
        }
        localStorage.setItem("weca_saved_posts", JSON.stringify(updated));
      } catch {}
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `Check out this anomaly on Weca: "${image.ai_verdict}" (Weca Score: ${image.wica_score}/100)`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isOwner = Boolean(
    user &&
      (user.id === image.user_id ||
        (user.username && user.username === image.author?.username))
  );

  const handleSaveCaption = async () => {
    if (!image) return;
    setSavingCaption(true);
    try {
      if (onEditPost) {
        await onEditPost(image.id, editedCaption.trim());
      } else {
        await fetch(`/api/posts/${encodeURIComponent(image.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caption: editedCaption.trim(),
            userId: user?.id || "",
          }),
        });
        image.caption = editedCaption.trim();
      }
      setIsEditingCaption(false);
    } catch (err) {
      console.error("Failed to edit post:", err);
    } finally {
      setSavingCaption(false);
    }
  };

  const handleDeletePost = async () => {
    if (!image) return;
    setIsDeleting(true);
    try {
      if (onDeletePost) {
        await onDeletePost(image.id);
      } else {
        await fetch(`/api/posts/${encodeURIComponent(image.id)}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user?.id || "",
          }),
        });
      }
      onClose();
    } catch (err) {
      console.error("Failed to delete post:", err);
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/75 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div 
        className="relative w-full max-w-5xl bg-white dark:bg-zinc-900/95 backdrop-blur-2xl rounded-t-[32px] sm:rounded-3xl border-t sm:border border-zinc-200 dark:border-zinc-800/90 shadow-2xl shadow-black/40 dark:shadow-black/90 overflow-hidden flex flex-col md:flex-row max-h-[94vh] sm:max-h-[88vh] text-zinc-900 dark:text-zinc-100 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto my-2.5 sm:hidden shrink-0" />

        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2.5 sm:p-2 rounded-full bg-zinc-100/90 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white shadow-sm transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Photo Display */}
        <div className="md:w-3/5 bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center relative overflow-hidden min-h-[260px] sm:min-h-[300px] md:min-h-full">
          <img
            src={getSafeImageUrl(image.storage_path)}
            alt={image.caption || image.ai_verdict}
            className="w-full h-full max-h-[45vh] sm:max-h-[85vh] object-contain"
          />

          {/* Category Tag */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-zinc-900/80 backdrop-blur-md text-xs font-mono font-medium text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700/80 shadow-xs">
              {image.category}
            </span>
            {image.country && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 dark:bg-zinc-900/80 backdrop-blur-md text-xs font-mono text-cyan-600 dark:text-cyan border border-zinc-200 dark:border-zinc-700/80 shadow-xs">
                <MapPin className="w-3 h-3" />
                <span>{image.country}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Score Rubric & Comments */}
        <div className="md:w-2/5 flex flex-col flex-1 min-h-0 bg-white dark:bg-zinc-900/90 overflow-y-auto border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800">
          {/* Header & Author */}
          <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <Link
              href={`/profile/${image.author?.username || "unknown"}`}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity min-h-[44px]"
            >
              <img
                src={image.author?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${image.user_id}`}
                alt={image.author?.username || "author"}
                className="w-9 h-9 rounded-full object-cover bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-200 dark:ring-zinc-700"
              />
              <div>
                <span className="font-mono font-bold text-xs text-zinc-900 dark:text-white block">
                  @{image.author?.username || "explorer"}
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  {new Date(image.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-1">
              {isOwner && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditingCaption(!isEditingCaption)}
                    className={`p-2.5 rounded-xl transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${
                      isEditingCaption
                        ? "text-violet-500 bg-violet-500/10"
                        : "text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                    title="Edit caption"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="p-2.5 rounded-xl text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Delete post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleToggleBookmark}
                className={`p-2.5 rounded-xl transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  isBookmarked
                    ? "text-amber-500 dark:text-amber-400 hover:bg-amber-400/10"
                    : "text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
                title={isBookmarked ? "Remove from Saved" : "Save anomaly"}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" : ""}`} />
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="p-2.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Copy share link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Delete Confirmation Alert Banner */}
          {confirmDelete && (
            <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 space-y-2 animate-in fade-in duration-150">
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                Are you sure you want to delete this anomaly post? This cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={isDeleting}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeletePost}
                  disabled={isDeleting}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5 transition-colors"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Confirm Delete
                </button>
              </div>
            </div>
          )}

          {/* AI Verdict & Score Badge */}
          <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-semibold">
                AI Weirdness Evaluation
              </span>
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border shadow-xs ${tierColors.bg} ${tierColors.text} ${tierColors.border}`}
              >
                <span>{image.wica_score}</span>
                <span className="text-[10px] opacity-70 font-normal">/100</span>
                <span>• {tier}</span>
              </div>
            </div>

            <p className="font-display font-semibold text-zinc-900 dark:text-white text-sm sm:text-base leading-snug">
              “{image.ai_verdict}”
            </p>

            {isEditingCaption ? (
              <div className="mt-3 space-y-2 p-3 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                <textarea
                  value={editedCaption}
                  onChange={(e) => setEditedCaption(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                  rows={2}
                  placeholder="Update caption..."
                  maxLength={500}
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditedCaption(image.caption || "");
                      setIsEditingCaption(false);
                    }}
                    disabled={savingCaption}
                    className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCaption}
                    disabled={savingCaption}
                    className="px-3.5 py-1 text-xs font-semibold rounded-lg bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50 inline-flex items-center gap-1.5 transition-colors"
                  >
                    {savingCaption ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    Save
                  </button>
                </div>
              </div>
            ) : (
              image.caption && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 italic">
                  &ldquo;{image.caption}&rdquo;
                </p>
              )
            )}

            {/* Rubric Breakdown Accordion */}
            <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
              {[
                { label: "Absurdity", val: image.absurdity, color: "bg-violet" },
                { label: "Rarity", val: image.rarity, color: "bg-cyan" },
                { label: "Craft", val: image.craft, color: "bg-zinc-400" },
                { label: "Cultural Novelty", val: image.cultural_novelty, color: "bg-magenta" },
                { label: "Wit", val: image.wit, color: "bg-amber-400" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium w-28">{item.label}</span>
                  <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${(item.val || 5) * 10}%` }}
                    />
                  </div>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300 font-bold text-[11px] w-5 text-right">
                    {item.val || 5}
                  </span>
                </div>
              ))}
            </div>

            {/* Like Action Bar */}
            <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleLike}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono font-medium transition-all cursor-pointer min-h-[44px] ${
                    liked
                      ? "bg-rose-500/10 border-rose-400 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold"
                      : "bg-white dark:bg-zinc-950/80 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${liked ? "fill-rose-500 text-rose-500" : ""}`} />
                  <span>{likeCount} {likeCount === 1 ? "Like" : "Likes"}</span>
                </button>

                <SuperLikeButton
                  postId={image.id}
                  creatorUsername={image.author?.username}
                />
              </div>

              <div className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{comments.length} Comments</span>
              </div>
            </div>
          </div>

          {/* Comments Thread */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3 min-h-[140px]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
              Discussion
            </span>

            {loadingComments ? (
              <div className="py-6 text-center text-xs text-zinc-500 font-mono">
                Loading observations...
              </div>
            ) : comments.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 font-mono">
                No observations yet. Be the first to comment!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2.5 text-xs">
                  <img
                    src={comment.author?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${comment.user_id}`}
                    alt={comment.author?.username || "commenter"}
                    className="w-6 h-6 rounded-full object-cover bg-zinc-100 dark:bg-zinc-800 shrink-0 mt-0.5 border border-zinc-200 dark:border-zinc-700"
                  />
                  <div className="flex-1 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl p-2.5 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-semibold text-zinc-900 dark:text-white text-[11px]">
                        @{comment.author?.username || "user"}
                      </span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                        {new Date(comment.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{comment.body}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Post Comment Input with Safe Area */}
          <form onSubmit={handleAddComment} className="p-3 pb-safe border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/95 dark:bg-zinc-950/95">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={user ? "Add an insight or score observation..." : "Sign in to join discussion"}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={!user || submittingComment}
                className="flex-1 px-3.5 py-2.5 text-sm sm:text-xs border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/40 transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-500 disabled:opacity-50 min-h-[44px]"
              />
              <button
                type="submit"
                disabled={!user || !newComment.trim() || submittingComment}
                className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 disabled:opacity-40 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Post comment"
              >
                <Send className="w-4 h-4 text-violet" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

