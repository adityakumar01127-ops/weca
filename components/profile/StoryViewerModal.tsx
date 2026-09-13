"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Trash2,
} from "lucide-react";
import confetti from "canvas-confetti";

export interface StoryItem {
  id: string;
  image_url: string;
  created_at: string;
  caption?: string | null;
  wica_score?: number;
}

interface StoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: StoryItem[];
  username: string;
  avatarUrl?: string | null;
  isOwnStory?: boolean;
  onDeleteStory?: (storyId: string) => void;
}

function formatStoryTime(timeStr?: string | null): string {
  if (!timeStr) return "Just now";
  if (timeStr.includes("ago") || timeStr === "Just now") return timeStr;
  try {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - d.getTime()) / 1000));
      if (diffSec < 60) return "Just now";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}d ago`;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  } catch {}
  return timeStr;
}

const STORY_DURATION = 5000; // 5 seconds per story

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  isOpen,
  onClose,
  stories,
  username,
  avatarUrl,
  isOwnStory = false,
  onDeleteStory,
}) => {
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reactionSent, setReactionSent] = useState<string | null>(null);

  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const elapsedBeforePauseRef = useRef<number>(0);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setCurrentIndex(0);
      setProgress(0);
    }
  }

  useEffect(() => {
    if (isOpen) {
      elapsedBeforePauseRef.current = 0;
    }
  }, [isOpen]);

  // Story progress timer loop
  useEffect(() => {
    if (!isOpen || stories.length === 0) return;

    if (isPaused) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    startTimeRef.current = Date.now() - elapsedBeforePauseRef.current;

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentProgress = Math.min(100, (elapsed / STORY_DURATION) * 100);
      setProgress(currentProgress);

      if (elapsed >= STORY_DURATION) {
        // Advance to next story
        if (currentIndex < stories.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setProgress(0);
          elapsedBeforePauseRef.current = 0;
          startTimeRef.current = Date.now();
        } else {
          // Finished all stories
          onClose();
          return;
        }
      }
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isOpen, currentIndex, isPaused, stories.length, onClose]);

  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
    } else {
      // Re-start first story
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
    }
  }, [currentIndex]);

  const handlePause = () => {
    setIsPaused(true);
    elapsedBeforePauseRef.current = Date.now() - startTimeRef.current;
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  // Keyboard navigation & Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  const currentStory = stories[currentIndex];

  const handleReact = (emoji: string) => {
    setReactionSent(emoji);
    try {
      confetti({
        particleCount: 20,
        spread: 35,
        origin: { y: 0.8 },
      });
    } catch {}
    setTimeout(() => setReactionSent(null), 1800);
  };

  if (!isOpen || stories.length === 0) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center p-0 sm:p-4 bg-black/95 sm:bg-black/90 backdrop-blur-xl animate-in fade-in duration-200 select-none"
    >
      {/* Container simulating a mobile phone viewport */}
      <div
        className="relative w-full h-full sm:h-[90vh] sm:max-h-[750px] sm:max-w-sm bg-zinc-950 sm:rounded-3xl overflow-hidden border-0 sm:border sm:border-zinc-800 shadow-2xl shadow-black flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handlePause}
        onMouseUp={handleResume}
        onTouchStart={handlePause}
        onTouchEnd={handleResume}
      >
        {/* Background Ambient Glow */}
        <div className="pointer-events-none absolute -top-20 inset-x-0 h-40 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-10" />
        <div className="pointer-events-none absolute -bottom-20 inset-x-0 h-40 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />

        {/* TOP: Segmented Progress Bars & Header Bar */}
        <div className="relative z-20 p-3 pt-4 sm:pt-3 space-y-2.5">
          {/* Progress Segments */}
          <div className="flex items-center gap-1.5 w-full">
            {stories.map((story, idx) => {
              let width = "0%";
              if (idx < currentIndex) width = "100%";
              else if (idx === currentIndex) width = `${progress}%`;

              return (
                <div key={story.id} className="h-1 flex-1 bg-white/25 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-75"
                    style={{ width }}
                  />
                </div>
              );
            })}
          </div>

          {/* User Info Bar */}
          <div className="flex items-center justify-between pt-1 gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`}
                alt={username}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-violet/50 bg-zinc-900 shrink-0"
              />
              <div className="flex items-center gap-1.5 text-xs font-mono min-w-0">
                <span className="font-bold text-white truncate max-w-[150px] sm:max-w-[200px]">@{username}</span>
                <span className="text-zinc-400 shrink-0">•</span>
                <span className="text-zinc-400 text-[11px] shrink-0">{formatStoryTime(currentStory.created_at)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {isOwnStory && onDeleteStory && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteStory(currentStory.id);
                  }}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Delete this story"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Close story"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* MIDDLE: Story Image with Left/Right Tap Navigation */}
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-zinc-950">
          <img
            src={currentStory.image_url}
            alt={currentStory.caption || "Anomaly Story"}
            className="w-full h-full object-cover"
          />

          {/* Left Click Target (Prev) */}
          <div
            onClick={handlePrev}
            className="absolute left-0 top-16 bottom-20 w-1/3 z-10 cursor-pointer"
            aria-label="Previous story"
          />

          {/* Right Click Target (Next) */}
          <div
            onClick={handleNext}
            className="absolute right-0 top-16 bottom-20 w-2/3 z-10 cursor-pointer"
            aria-label="Next story"
          />

          {/* Score Badge */}
          {currentStory.wica_score && (
            <div className="absolute top-16 right-3 z-10">
              <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-cyan/40 text-[11px] font-mono font-bold text-cyan">
                ★ {currentStory.wica_score}
              </span>
            </div>
          )}
        </div>

        {/* BOTTOM: Story Caption & Anomaly Reaction Bar */}
        <div className="relative z-20 p-4 pb-6 sm:pb-4 space-y-3">
          {/* Caption */}
          {currentStory.caption && (
            <div className="px-3.5 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono text-zinc-100 max-w-[90%] mx-auto text-center shadow-lg">
              {currentStory.caption}
            </div>
          )}

          {/* Reaction Notification */}
          {reactionSent && (
            <div className="text-center animate-bounce text-xs font-mono text-cyan font-semibold">
              Sent {reactionSent} to @{username}!
            </div>
          )}

          {/* Quick Reaction Buttons (Instagram-style) */}
          <div className="flex items-center justify-center gap-3 pt-1">
            {["🔮", "⚡", "👁️", "❤️", "🔥"].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReact(emoji);
                }}
                className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 hover:border-violet text-lg flex items-center justify-center transition-all hover:scale-110 active:scale-90 cursor-pointer"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
