"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Trash2,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Share2,
  MoreVertical,
  Bookmark,
  Check,
  Link2,
  Sparkles,
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
  highlightTitle?: string | null;
  isHighlight?: boolean;
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
  highlightTitle,
  isHighlight = false,
}) => {
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reactionSent, setReactionSent] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [viewerToast, setViewerToast] = useState<string | null>(null);

  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const elapsedBeforePauseRef = useRef<number>(0);
  const menuRef = useRef<HTMLDivElement>(null);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setCurrentIndex(0);
      setProgress(0);
      setIsPaused(false);
      setShowMenu(false);
      setViewerToast(null);
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
    if (!showMenu) {
      setIsPaused(true);
      elapsedBeforePauseRef.current = Date.now() - startTimeRef.current;
    }
  };

  const handleResume = () => {
    if (!showMenu) {
      setIsPaused(false);
    }
  };

  // Keyboard navigation & Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showMenu) {
          setShowMenu(false);
        } else {
          onClose();
        }
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "m" || e.key === "M") {
        toggleMute();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose, showMenu]);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setIsPaused(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  const safeIndex = Math.min(currentIndex, Math.max(0, stories.length - 1));
  const currentStory = stories[safeIndex];

  // --- Action Handlers ---
  const togglePlayPause = useCallback(() => {
    setIsPaused((prev) => {
      if (!prev) {
        // pausing
        elapsedBeforePauseRef.current = Date.now() - startTimeRef.current;
      }
      return !prev;
    });
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      showViewerToast(prev ? "Sound on" : "Muted");
      return !prev;
    });
  }, []);

  const showViewerToast = (message: string) => {
    setViewerToast(message);
    setTimeout(() => setViewerToast(null), 1500);
  };

  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      const url = `${window.location.origin}/profile/${username}`;
      try {
        await navigator.clipboard.writeText(url);
        showViewerToast("Link copied!");
        try {
          confetti({
            particleCount: 30,
            spread: 50,
            origin: { y: 0.3, x: 0.8 },
            colors: ["#22D3EE", "#7C5CFC", "#F472B6"],
          });
        } catch {}
      } catch {
        showViewerToast("Could not copy");
      }
    },
    [username]
  );

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

  const handleDeleteCurrentStory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onDeleteStory && currentStory) {
      if (stories.length <= 1) {
        onClose();
      } else if (currentIndex >= stories.length - 1) {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
        setProgress(0);
      }
      onDeleteStory(currentStory.id);
    }
  };

  if (!isOpen || stories.length === 0 || !currentStory) return null;

  // Determine accent colors based on story vs highlight
  const progressAccent = isHighlight
    ? "bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-violet-400"
    : "bg-white";
  const ringClass = isHighlight
    ? "ring-2 ring-cyan-400/60"
    : "ring-2 ring-violet-500/50";

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
        <div className="relative z-20 p-3 pt-4 sm:pt-3 space-y-2">
          {/* Progress Segments */}
          <div className="flex items-center gap-1.5 w-full">
            {stories.map((story, idx) => {
              let width = "0%";
              if (idx < safeIndex) width = "100%";
              else if (idx === safeIndex) width = isPaused ? `${progress}%` : `${progress}%`;

              return (
                <div
                  key={story.id}
                  className="h-[3px] flex-1 bg-white/20 rounded-full overflow-hidden"
                >
                  <div
                    className={`h-full rounded-full ${
                      isHighlight
                        ? "bg-gradient-to-r from-cyan-400 to-fuchsia-400"
                        : "bg-white"
                    } ${isPaused && idx === safeIndex ? "" : "transition-all duration-75"}`}
                    style={{ width }}
                  />
                </div>
              );
            })}
          </div>

          {/* User Info & Controls Row */}
          <div className="flex items-center justify-between gap-2">
            {/* LEFT: Avatar + Username + Badge */}
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Avatar with ring */}
              <div
                className={`w-9 h-9 rounded-full p-[2px] shrink-0 ${
                  isHighlight
                    ? "bg-gradient-to-tr from-cyan-400 via-fuchsia-400 to-violet-500"
                    : "bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-rose-500"
                }`}
              >
                <img
                  src={avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`}
                  alt={username}
                  className="w-full h-full rounded-full object-cover bg-zinc-900"
                />
              </div>

              {/* Username & Badge */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-semibold text-white text-[13px] truncate max-w-[110px] sm:max-w-[140px]">
                  @{username}
                </span>
                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />

                {/* Time / Highlight Badge */}
                {isHighlight && highlightTitle ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 border border-cyan-400/30 text-[10px] font-bold text-cyan-300 shrink-0 backdrop-blur-sm">
                    <Sparkles className="w-3 h-3" />
                    {highlightTitle}
                    <span className="text-white/50 ml-0.5">
                      {safeIndex + 1}/{stories.length}
                    </span>
                  </span>
                ) : (
                  <>
                    <span className="text-zinc-500 shrink-0 text-xs">•</span>
                    <span className="text-zinc-400 text-[11px] shrink-0">
                      {formatStoryTime(currentStory.created_at)}
                    </span>
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-[9px] font-bold text-rose-400 shrink-0 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      Story
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* RIGHT: Controls */}
            <div className="flex items-center gap-0.5 shrink-0">
              {/* Paused Indicator */}
              {isPaused && (
                <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[9px] font-bold text-white/80 uppercase tracking-widest mr-1 animate-pulse">
                  Paused
                </span>
              )}

              {/* Play/Pause */}
              <button
                type="button"
                id="story-play-pause-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                className="w-9 h-9 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer active:scale-90"
                aria-label={isPaused ? "Resume story" : "Pause story"}
                title={isPaused ? "Resume" : "Pause"}
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>

              {/* Mute/Sound */}
              <button
                type="button"
                id="story-sound-toggle-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                className="w-9 h-9 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer active:scale-90"
                aria-label={isMuted ? "Unmute" : "Mute"}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Share */}
              <button
                type="button"
                id="story-share-top-btn"
                onClick={handleShare}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                className="w-9 h-9 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer active:scale-90"
                aria-label="Share story"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* More Options */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  id="story-options-menu-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu((prev) => {
                      if (!prev) {
                        setIsPaused(true);
                        elapsedBeforePauseRef.current = Date.now() - startTimeRef.current;
                      } else {
                        setIsPaused(false);
                      }
                      return !prev;
                    });
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer active:scale-90"
                  aria-label="More options"
                  title="More options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <div
                    className="absolute right-0 top-11 w-48 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/80 shadow-2xl shadow-black/60 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 z-50"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        handleShare(e);
                        setShowMenu(false);
                        setIsPaused(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-zinc-200 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Link2 className="w-4 h-4 text-cyan-400" />
                      Copy Link
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (navigator.share) {
                          navigator.share({
                            title: `${isHighlight ? "Highlight" : "Story"} by @${username}`,
                            url: `${window.location.origin}/profile/${username}`,
                          }).catch(() => {});
                        } else {
                          handleShare(e);
                        }
                        setShowMenu(false);
                        setIsPaused(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-zinc-200 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-violet-400" />
                      Share via...
                    </button>

                    {isOwnStory && onDeleteStory && (
                      <>
                        <div className="h-px bg-zinc-700/60 mx-3" />
                        <button
                          type="button"
                          id="story-option-delete-btn"
                          onClick={handleDeleteCurrentStory}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Story
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Close */}
              <button
                type="button"
                id="story-viewer-close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                className="w-9 h-9 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-all cursor-pointer active:scale-90"
                aria-label="Close story"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Viewer Toast */}
        {viewerToast && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full bg-black/80 backdrop-blur-xl border border-white/15 text-white text-[11px] font-semibold shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
            {viewerToast}
          </div>
        )}

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
            <div className="absolute top-20 right-3 z-10">
              <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-cyan-400/40 text-[11px] font-mono font-bold text-cyan-400">
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
            <div className="text-center animate-bounce text-xs font-mono text-cyan-400 font-semibold">
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
                className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 hover:border-violet-500 text-lg flex items-center justify-center transition-all hover:scale-110 active:scale-90 cursor-pointer"
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
