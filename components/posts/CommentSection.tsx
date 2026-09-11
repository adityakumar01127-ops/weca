"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Comment } from "@/lib/types";
import { getComments, addComment } from "@/lib/supabase/data";
import { useAuth } from "@/context/AuthContext";
import { Send, User as UserIcon } from "lucide-react";

interface CommentSectionProps {
  postId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newBody, setNewBody] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    let ignore = false;
    getComments(postId).then((data) => {
      if (!ignore) {
        setComments(data);
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newBody.trim();
    if (!trimmed) return;

    const currentUserId = user?.id || profile?.id;
    if (!currentUserId) return;

    setSubmitting(true);
    try {
      const added = await addComment({
        postId,
        userId: currentUserId,
        body: trimmed,
        authorProfile: profile,
      });

      setComments((prev) => [...prev, added]);
      setNewBody("");
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comment List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-400 font-mono">
          No comments yet. Be the first to share an observation.
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const author = comment.profiles;
            const username = author?.username || "user";
            return (
              <div key={comment.id} className="flex items-start gap-3 text-xs">
                <Link href={`/profile/${username}`} className="shrink-0 mt-0.5">
                  {author?.avatar_url ? (
                    <img
                      src={author.avatar_url}
                      alt={username}
                      className="w-6 h-6 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 text-xs">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                  )}
                </Link>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${username}`}
                      className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
                    >
                      {author?.display_name || username}
                    </Link>
                    <span className="text-[10px] font-mono text-zinc-400">
                      @{username}
                    </span>
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed break-words">
                    {comment.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Comment Input */}
      {user || profile ? (
        <form onSubmit={handleSubmit} className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="Add a comment..."
              disabled={submitting}
              className="flex-1 px-3.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
            <button
              type="submit"
              disabled={!newBody.trim() || submitting}
              className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-medium disabled:opacity-40 transition-all flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Post</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <Link
            href="/login"
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white underline"
          >
            Log in to leave a comment
          </Link>
        </div>
      )}
    </div>
  );
};
