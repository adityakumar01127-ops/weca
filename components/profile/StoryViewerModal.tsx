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
  Check,
  Link2,
  Sparkles,
  Heart,
  Send,
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  Music,
  ShieldCheck,
} from "lucide-react";
import confetti from "canvas-confetti";
import { HighlightItem } from "./HighlightModal";

export interface StoryItem {
  id: string;
  image_url: string;
  created_at: string;
  caption?: string | null;
  wica_score?: number;
  location?: string | null;
  views_count?: number;
  likes_count?: number;
  rarity_tier?: "Common" | "Rare" | "Epic" | "Legendary" | "Mythic";
  media_type?: "image" | "video";
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
  allHighlights?: HighlightItem[];
  onSelectHighlight?: (highlight: HighlightItem) => void;
}

interface FloatingEmoji {
  id: number;
  emoji: string;
  left: number;
  drift: number;
  size: number;
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

const STORY_DURATION = 5000; // 5 seconds per slide



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
  allHighlights = [],
  onSelectHighlight,
}) => {
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [viewerToast, setViewerToast] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [showViewersSheet, setShowViewersSheet] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const elapsedBeforePauseRef = useRef<number>(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Gesture state refs
  const touchStartPosRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldActiveRef = useRef<boolean>(false);

  // Web Audio Synth for ambient anomaly tone
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // Reset state on open
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setCurrentIndex(0);
      setProgress(0);
      setIsPaused(false);
      setIsHolding(false);
      setShowMenu(false);
      setViewerToast(null);
      setIsLiked(false);
      setReplyText("");
      setIsReplying(false);
      setShowViewersSheet(false);
      setDragY(0);
      setIsDragging(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
    }
  }, [isOpen, currentIndex]);

  // Audio synthesis controls
  const startAtmosphericAudio = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      if (!oscRef.current) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = "sine";
        osc.frequency.setValueAtTime(136.1, ctx.currentTime); // 136.1 Hz Cosmic Octave frequency
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(400, ctx.currentTime);

        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        oscRef.current = osc;
        gainRef.current = gain;
      } else if (gainRef.current) {
        gainRef.current.gain.cancelScheduledValues(ctx.currentTime);
        gainRef.current.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.2);
      }
    } catch {}
  }, []);

  const stopAtmosphericAudio = useCallback(() => {
    try {
      if (gainRef.current && audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        gainRef.current.gain.cancelScheduledValues(ctx.currentTime);
        gainRef.current.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      }
    } catch {}
  }, []);

  // Cleanup audio on modal close/unmount
  useEffect(() => {
    if (!isOpen || isMuted || isPaused || isHolding) {
      stopAtmosphericAudio();
    } else if (!isMuted && !isPaused && !isHolding) {
      startAtmosphericAudio();
    }
  }, [isOpen, isMuted, isPaused, isHolding, startAtmosphericAudio, stopAtmosphericAudio]);

  useEffect(() => {
    return () => {
      try {
        if (oscRef.current) {
          oscRef.current.stop();
          oscRef.current.disconnect();
          oscRef.current = null;
        }
        if (audioCtxRef.current) {
          audioCtxRef.current.close();
          audioCtxRef.current = null;
        }
      } catch {}
    };
  }, []);

  // Next story / Next Highlight transition
  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
    } else {
      // If watching highlights and there is a subsequent highlight reel, advance smoothly to it!
      if (isHighlight && allHighlights.length > 1 && onSelectHighlight && highlightTitle) {
        const currentHlIdx = allHighlights.findIndex(
          (h) => h.name.toLowerCase() === highlightTitle.toLowerCase() || h.id === highlightTitle
        );
        if (currentHlIdx !== -1 && currentHlIdx < allHighlights.length - 1) {
          const nextHl = allHighlights[currentHlIdx + 1];
          onSelectHighlight(nextHl);
          setCurrentIndex(0);
          setProgress(0);
          elapsedBeforePauseRef.current = 0;
          showViewerToast(`Next Reel: ${nextHl.name}`);
          return;
        }
      }
      onClose();
    }
  }, [currentIndex, stories.length, isHighlight, allHighlights, onSelectHighlight, highlightTitle, onClose]);

  // Previous story
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

  // Pause / Resume callbacks
  const handlePause = useCallback(() => {
    if (!showMenu && !isReplying && !showViewersSheet) {
      setIsPaused(true);
      elapsedBeforePauseRef.current = Date.now() - startTimeRef.current;
    }
  }, [showMenu, isReplying, showViewersSheet]);

  const handleResume = useCallback(() => {
    if (!showMenu && !isReplying && !showViewersSheet) {
      setIsPaused(false);
      startTimeRef.current = Date.now() - elapsedBeforePauseRef.current;
    }
  }, [showMenu, isReplying, showViewersSheet]);

  // Main Story progress timer loop
  useEffect(() => {
    if (!isOpen || stories.length === 0) return;

    if (isPaused || isHolding || isReplying || showViewersSheet) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    startTimeRef.current = Date.now() - elapsedBeforePauseRef.current;

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentProgress = Math.min(100, (elapsed / STORY_DURATION) * 100);
      setProgress(currentProgress);

      if (elapsed >= STORY_DURATION) {
        handleNext();
        return;
      }
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isOpen, currentIndex, isPaused, isHolding, isReplying, showViewersSheet, stories.length, handleNext]);

  // Keyboard navigation & Shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isReplying) {
        if (e.key === "Escape") {
          setIsReplying(false);
          handleResume();
        }
        return;
      }

      if (e.key === "Escape") {
        if (showViewersSheet) {
          setShowViewersSheet(false);
        } else if (showMenu) {
          setShowMenu(false);
          handleResume();
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
  }, [isOpen, handleNext, handlePrev, onClose, showMenu, showViewersSheet, isReplying, handleResume]);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        handleResume();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu, handleResume]);

  const safeIndex = Math.min(currentIndex, Math.max(0, stories.length - 1));
  const currentStory = stories[safeIndex];

  // Helper toast notification
  const showViewerToast = (message: string) => {
    setViewerToast(message);
    setTimeout(() => setViewerToast(null), 1800);
  };

  const togglePlayPause = () => {
    setIsPaused((prev) => {
      if (!prev) {
        elapsedBeforePauseRef.current = Date.now() - startTimeRef.current;
        showViewerToast("Paused");
      } else {
        startTimeRef.current = Date.now() - elapsedBeforePauseRef.current;
      }
      return !prev;
    });
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      showViewerToast(next ? "Audio Muted" : "Atmospheric Audio On");
      return next;
    });
  };

  const handleShare = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareUrl = `${window.location.origin}/profile/${username}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      showViewerToast("Link copied to clipboard! 🔗");
      try {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.3, x: 0.8 },
          colors: ["#22D3EE", "#7C5CFC", "#F472B6"],
        });
      } catch {}
    } catch {
      showViewerToast("Could not copy link");
    }
  };

  // Floating Emoji Burst generator
  const triggerEmojiBurst = (emoji: string) => {
    const burstCount = 5;
    const newItems: FloatingEmoji[] = [];
    for (let i = 0; i < burstCount; i++) {
      newItems.push({
        id: Date.now() + Math.random(),
        emoji,
        left: 20 + Math.random() * 60,
        drift: (Math.random() - 0.5) * 80,
        size: 26 + Math.random() * 16,
      });
    }

    setFloatingEmojis((prev) => [...prev, ...newItems]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => !newItems.some((n) => n.id === item.id)));
    }, 1800);
  };

  const handleReact = (emoji: string) => {
    triggerEmojiBurst(emoji);
    showViewerToast(`Sent ${emoji} to @${username}!`);
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked((prev) => {
      const next = !prev;
      if (next) {
        triggerEmojiBurst("❤️");
        try {
          confetti({
            particleCount: 25,
            spread: 40,
            origin: { y: 0.85, x: 0.85 },
            colors: ["#F43F5E", "#FB7185", "#FDA4AF"],
          });
        } catch {}
      }
      return next;
    });
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    showViewerToast(`Sent message to @${username}! 💬`);
    try {
      confetti({
        particleCount: 20,
        spread: 45,
        origin: { y: 0.9 },
        colors: ["#06B6D4", "#8B5CF6"],
      });
    } catch {}

    setReplyText("");
    setIsReplying(false);
    handleResume();
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
      showViewerToast("Story deleted");
    }
  };

  // --- Pointer & Touch Gesture Handling ---
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button, input, textarea, a, [role='button']")) {
      return;
    }

    touchStartPosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    isHoldActiveRef.current = false;
    setIsDragging(false);

    // Set hold timer
    holdTimerRef.current = setTimeout(() => {
      isHoldActiveRef.current = true;
      setIsHolding(true);
      handlePause();
    }, 160);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!touchStartPosRef.current) return;

    const deltaX = e.clientX - touchStartPosRef.current.x;
    const deltaY = e.clientY - touchStartPosRef.current.y;

    if (deltaY > 15 && Math.abs(deltaY) > Math.abs(deltaX) && !isHolding) {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      setIsDragging(true);
      setDragY(deltaY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (isHoldActiveRef.current) {
      isHoldActiveRef.current = false;
      setIsHolding(false);
      handleResume();
      touchStartPosRef.current = null;
      return;
    }

    if (isDragging) {
      if (dragY > 90) {
        onClose();
      } else {
        setDragY(0);
      }
      setIsDragging(false);
      touchStartPosRef.current = null;
      return;
    }

    if (touchStartPosRef.current) {
      const duration = Date.now() - touchStartPosRef.current.time;
      const deltaX = Math.abs(e.clientX - touchStartPosRef.current.x);
      const deltaY = Math.abs(e.clientY - touchStartPosRef.current.y);

      if (duration < 200 && deltaX < 15 && deltaY < 15 && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const clickRelX = e.clientX - rect.left;
        const width = rect.width;

        if (clickRelX < width * 0.32) {
          handlePrev();
        } else {
          handleNext();
        }
      }
    }

    touchStartPosRef.current = null;
  };

  const handlePointerCancel = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (isHoldActiveRef.current) {
      isHoldActiveRef.current = false;
      setIsHolding(false);
      handleResume();
    }
    setIsDragging(false);
    setDragY(0);
    touchStartPosRef.current = null;
  };

  if (!isOpen || stories.length === 0 || !currentStory) return null;

  // Anomaly score & tier calculation
  const score = currentStory.wica_score || 0;
  const rarityTier =
    score >= 95 ? "Mythic" : score >= 90 ? "Legendary" : score >= 80 ? "Epic" : "Rare";
  const rarityColors = {
    Mythic: "from-amber-400 via-rose-500 to-purple-600 text-amber-300 border-amber-400/50 shadow-amber-500/20",
    Legendary: "from-cyan-400 via-violet-500 to-fuchsia-500 text-cyan-300 border-cyan-400/50 shadow-cyan-500/20",
    Epic: "from-violet-400 to-purple-600 text-violet-300 border-violet-400/50 shadow-violet-500/20",
    Rare: "from-emerald-400 to-teal-500 text-emerald-300 border-emerald-400/50 shadow-emerald-500/20",
  }[rarityTier];

  const dragTransformStyle = isDragging
    ? {
        transform: `translateY(${Math.max(0, dragY)}px) scale(${Math.max(0.85, 1 - dragY * 0.0006)})`,
        transition: "none",
      }
    : dragY === 0
    ? { transition: "transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)" }
    : undefined;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/95 sm:bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200 select-none overflow-hidden touch-none"
    >
      {/* Dynamic Keyframes for Floating Reaction Particles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes storyFloatUp {
            0% {
              transform: translateY(0) scale(0.6);
              opacity: 1;
            }
            50% {
              opacity: 0.95;
              transform: translateY(-140px) scale(1.2);
            }
            100% {
              transform: translateY(-300px) scale(1.35);
              opacity: 0;
            }
          }
          .story-particle {
            animation: storyFloatUp 1.6s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
          }
        `,
      }} />

      {/* Desktop Atmospheric Backdrop: Dynamic blurred canvas of the active story */}
      <div
        className="hidden sm:block pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-30 blur-3xl scale-125 transition-all duration-700"
        style={{
          backgroundImage: `url(${currentStory.image_url})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      />

      {/* Desktop Left Navigation Chevron */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handlePrev();
        }}
        className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white items-center justify-center backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-xl shadow-black/40"
        aria-label="Previous story (Left Arrow)"
        title="Previous (Left Arrow)"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Desktop Right Navigation Chevron */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white items-center justify-center backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-xl shadow-black/40"
        aria-label="Next story (Right Arrow)"
        title="Next (Right Arrow)"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Central Viewport Wrapper */}
      <div className="flex flex-col items-center justify-center w-full h-full sm:h-auto sm:w-auto gap-3">
        {/* Main Story Container (Simulating Mobile Phone Screen / Viewport) */}
        <div
          ref={containerRef}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          style={dragTransformStyle}
          className="relative w-full h-full sm:h-[90vh] sm:max-h-[780px] sm:max-w-sm bg-zinc-950 sm:rounded-[32px] overflow-hidden sm:border sm:border-zinc-800/90 shadow-2xl shadow-black flex flex-col justify-between select-none"
        >
        {/* Pull-to-dismiss Drag Indicator on Mobile */}
        {isDragging && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 w-10 h-1 rounded-full bg-white/40" />
        )}

        {/* Ambient Top & Bottom Vignettes for Readability */}
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/85 via-black/45 to-transparent z-10 transition-opacity duration-200 ${
            isHolding ? "opacity-0" : "opacity-100"
          }`}
        />
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10 transition-opacity duration-200 ${
            isHolding ? "opacity-0" : "opacity-100"
          }`}
        />

        {/* =========================================================================
            TOP OVERLAY: Progress Segments & Author Header
            ========================================================================= */}
        <div
          className={`relative z-20 p-3.5 pt-4 sm:pt-3.5 space-y-2.5 transition-opacity duration-200 ${
            isHolding ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          {/* Segmented Progress Bars */}
          <div className="flex items-center gap-1.5 w-full">
            {stories.map((story, idx) => {
              let width = "0%";
              if (idx < safeIndex) width = "100%";
              else if (idx === safeIndex) width = `${progress}%`;

              return (
                <div
                  key={story.id}
                  className="h-[3px] flex-1 bg-white/25 rounded-full overflow-hidden backdrop-blur-xs"
                >
                  <div
                    className={`h-full rounded-full transition-all duration-75 ${
                      isHighlight
                        ? "bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-violet-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]"
                        : "bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"
                    }`}
                    style={{ width }}
                  />
                </div>
              );
            })}
          </div>

          {/* User & Reel Info Row */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: Avatar + Author Stack */}
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Avatar with chromatic active ring */}
              <div
                className={`w-9 h-9 rounded-full p-[2px] shrink-0 ${
                  isHighlight
                    ? "bg-gradient-to-tr from-cyan-400 via-fuchsia-400 to-violet-500 shadow-md shadow-cyan-500/20"
                    : "bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-rose-500 shadow-md shadow-violet-500/20"
                }`}
              >
                <img
                  src={avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`}
                  alt={username}
                  className="w-full h-full rounded-full object-cover bg-zinc-900"
                />
              </div>

              {/* Creator details in clean vertical stack */}
              <div className="flex flex-col min-w-0 justify-center">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="font-bold text-white text-[13px] tracking-tight truncate max-w-[150px] sm:max-w-[200px]">
                    @{username}
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  {!isHighlight && (
                    <span className="text-zinc-400 text-[11px] font-mono shrink-0 ml-1">
                      {formatStoryTime(currentStory.created_at)}
                    </span>
                  )}
                </div>

                {/* Highlight Badge or Anomaly Time */}
                {isHighlight && highlightTitle ? (
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-cyan-300">
                    <Sparkles className="w-2.5 h-2.5 text-cyan-400 shrink-0 animate-pulse" />
                    <span className="truncate max-w-[110px]">{highlightTitle}</span>
                    <span className="text-white/60 font-mono text-[9px]">
                      • {safeIndex + 1}/{stories.length}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Right: Clean Controls (Play/Pause, Audio Synth, More, Close) */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Paused status badge */}
              {isPaused && (
                <span className="px-1.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-[8px] font-bold text-white uppercase tracking-widest mr-0.5 animate-pulse">
                  Paused
                </span>
              )}

              {/* Play / Pause Toggle */}
              <button
                type="button"
                id="story-play-pause-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-all cursor-pointer active:scale-90"
                aria-label={isPaused ? "Resume story" : "Pause story"}
                title={isPaused ? "Resume (Space)" : "Pause (Space)"}
              >
                {isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4" />}
              </button>

              {/* Audio Sound Synthesizer */}
              <button
                type="button"
                id="story-sound-toggle-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all cursor-pointer active:scale-90 ${
                  !isMuted
                    ? "text-cyan-300 bg-cyan-500/20 border border-cyan-400/40"
                    : "text-white/80 hover:text-white hover:bg-white/15"
                }`}
                aria-label={isMuted ? "Unmute atmospheric sound" : "Mute atmospheric sound"}
                title={isMuted ? "Unmute Sound (M)" : "Mute Sound (M)"}
              >
                {!isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* More Options Dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  id="story-options-menu-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu((prev) => {
                      if (!prev) handlePause();
                      else handleResume();
                      return !prev;
                    });
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-all cursor-pointer active:scale-90"
                  aria-label="More options"
                  title="More options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <div
                    className="absolute right-0 top-10 w-52 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/80 shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        handleShare(e);
                        setShowMenu(false);
                        handleResume();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-zinc-200 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Link2 className="w-4 h-4 text-cyan-400" />
                      Copy Story Link
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (navigator.share) {
                          navigator
                            .share({
                              title: `${isHighlight ? "Highlight" : "Story"} by @${username}`,
                              url: `${window.location.origin}/profile/${username}`,
                            })
                            .catch(() => {});
                        } else {
                          handleShare(e);
                        }
                        setShowMenu(false);
                        handleResume();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-zinc-200 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-violet-400" />
                      Share via System...
                    </button>

                    {/* Delete Option for Creator */}
                    {isOwnStory && onDeleteStory && (
                      <>
                        <div className="h-px bg-zinc-800 mx-3" />
                        <button
                          type="button"
                          id="story-option-delete-btn"
                          onClick={handleDeleteCurrentStory}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Anomaly Slide
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                id="story-viewer-close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer active:scale-90"
                aria-label="Close story"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Viewer Toast Notification */}
        {viewerToast && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 rounded-full bg-black/85 backdrop-blur-xl border border-white/20 text-white text-[11px] font-semibold shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none">
            {viewerToast}
          </div>
        )}

        {/* =========================================================================
            MIDDLE: High-Resolution Anomaly Photo / Video Display
            ========================================================================= */}
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-black overflow-hidden">
          <img
            src={currentStory.image_url}
            alt={currentStory.caption || "Anomaly Story Media"}
            className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-500"
          />

          {/* Anomaly Score & Metadata Pill Overlay */}
          <div
            className={`absolute top-20 right-3.5 z-10 flex flex-col items-end gap-1.5 transition-opacity duration-200 ${
              isHolding ? "opacity-0" : "opacity-100"
            }`}
          >
            {/* WICA Score Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border ${rarityColors} shadow-lg`}
            >
              <Sparkles className="w-3 h-3" />
              <span className="font-mono font-black text-xs">
                ★ {score}
              </span>
              <span className="text-[9px] uppercase tracking-wider font-bold opacity-80">
                {rarityTier}
              </span>
            </div>

            {/* Anomaly Location tag if available */}
            {currentStory.location && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-zinc-300">
                <MapPin className="w-2.5 h-2.5 text-rose-400" />
                <span>{currentStory.location}</span>
              </div>
            )}
          </div>

          {/* Ambient Sound Equalizer Wave Pill (active when unmuted) */}
          {!isMuted && (
            <div
              className={`absolute top-20 left-3.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/60 backdrop-blur-md border border-cyan-400/40 text-cyan-300 text-[10px] font-mono shadow-lg transition-opacity duration-200 ${
                isHolding ? "opacity-0" : "opacity-100"
              }`}
            >
              <Music className="w-3 h-3 text-cyan-300 animate-spin" />
              <span>Cosmic Resonance 136Hz</span>
              <div className="flex items-end gap-0.5 h-2.5 ml-0.5">
                <span className="w-0.5 h-full bg-cyan-400 animate-pulse" />
                <span className="w-0.5 h-2/3 bg-cyan-300 animate-pulse delay-75" />
                <span className="w-0.5 h-4/5 bg-cyan-400 animate-pulse delay-150" />
              </div>
            </div>
          )}

          {/* Floating Emoji Particles Stream */}
          <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
            {floatingEmojis.map((item) => (
              <div
                key={item.id}
                className="story-particle absolute bottom-24 pointer-events-none select-none"
                style={{
                  left: `${item.left}%`,
                  fontSize: `${item.size}px`,
                }}
              >
                {item.emoji}
              </div>
            ))}
          </div>
        </div>

        {/* =========================================================================
            BOTTOM: Caption, Cross-Highlight Switcher & Interactive Social Rail
            ========================================================================= */}
        <div
          className={`relative z-20 p-3.5 pb-5 sm:pb-3.5 space-y-2.5 transition-opacity duration-200 ${
            isHolding ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          {/* Highlight Reel Switcher Pill Strip (when watching highlights) */}
          {isHighlight && allHighlights.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {allHighlights.map((hl) => {
                const isActive =
                  hl.name.toLowerCase() === highlightTitle?.toLowerCase() || hl.id === highlightTitle;
                return (
                  <button
                    key={hl.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectHighlight) {
                        onSelectHighlight(hl);
                        setCurrentIndex(0);
                        setProgress(0);
                      }
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 transition-all backdrop-blur-md cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-cyan-500/30 to-fuchsia-500/30 border border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20 scale-105"
                        : "bg-black/60 border border-white/15 text-zinc-300 hover:bg-black/80 hover:text-white"
                    }`}
                  >
                    <span>{hl.icon || "🛸"}</span>
                    <span>{hl.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Story Caption Pill */}
          {currentStory.caption && (
            <div className="px-3.5 py-2 rounded-2xl bg-black/75 backdrop-blur-md border border-white/15 text-xs font-mono text-zinc-100 shadow-xl max-w-full text-center">
              {currentStory.caption}
            </div>
          )}

          {/* Quick Reaction Emoji Rail */}
          <div className="flex items-center justify-center gap-2 pt-0.5">
            {["🔮", "⚡", "👁️", "❤️", "🔥"].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReact(emoji);
                }}
                className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 hover:border-violet-400 text-base flex items-center justify-center transition-all hover:scale-115 active:scale-90 cursor-pointer shadow-lg"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Direct Message Input & Quick Social Actions */}
          <div className="flex items-center gap-2 pt-1">
            {/* Direct Message Input Pill */}
            <form onSubmit={handleSendReply} className="flex-1 relative">
              <input
                type="text"
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
                data-form-type="other"
                spellCheck="false"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => {
                  setIsReplying(true);
                  handlePause();
                }}
                onBlur={() => {
                  if (!replyText.trim()) {
                    setIsReplying(false);
                    handleResume();
                  }
                }}
                placeholder={`Reply to @${username}...`}
                className="w-full h-10 px-4 pr-10 rounded-full bg-black/60 backdrop-blur-md border border-white/25 text-xs text-white placeholder:text-zinc-400 focus:outline-none focus:border-cyan-400 focus:bg-black/85 transition-all shadow-lg"
              />
              {replyText.trim() && (
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 flex items-center justify-center text-white cursor-pointer active:scale-95 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Like Heart Button */}
            <button
              type="button"
              id="story-like-btn"
              onClick={handleToggleLike}
              className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all cursor-pointer active:scale-80 shadow-lg ${
                isLiked
                  ? "bg-rose-500/25 border-rose-500 text-rose-500 shadow-rose-500/30"
                  : "bg-black/60 hover:bg-black/80 border-white/20 text-white/90 hover:text-white"
              }`}
              aria-label={isLiked ? "Unlike story" : "Like story"}
              title="Like"
            >
              <Heart className={`w-5 h-5 ${isLiked ? "fill-rose-500 text-rose-500 animate-bounce" : ""}`} />
            </button>

            {/* Quick Share Button */}
            <button
              type="button"
              id="story-share-rail-btn"
              onClick={handleShare}
              className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border bg-black/60 hover:bg-black/80 border-white/20 text-white/90 hover:text-white transition-all cursor-pointer active:scale-90 shadow-lg"
              aria-label="Share story"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Viewers Sheet Trigger (for own story) */}
            {isOwnStory && (
              <button
                type="button"
                id="story-viewers-trigger-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowViewersSheet(true);
                  handlePause();
                }}
                className="h-10 px-3 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white/90 hover:text-white flex items-center gap-1.5 text-xs font-mono transition-all cursor-pointer active:scale-95"
                title="View Insights"
              >
                <Eye className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold">{currentStory.views_count || 0}</span>
              </button>
            )}
          </div>
        </div>

        {/* =========================================================================
            VIEWERS INSIGHTS BOTTOM SHEET (For Own Story)
            ========================================================================= */}
        {showViewersSheet && (
          <div
            className="absolute inset-x-0 bottom-0 top-1/3 z-50 rounded-t-[32px] bg-zinc-900/98 backdrop-blur-2xl border-t border-zinc-700/80 p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div>
              <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-white text-sm">Story Insights</h3>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px]">
                    {currentStory.views_count || 0} views
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowViewersSheet(false);
                    handleResume();
                  }}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Viewers List */}
            <div className="flex-1 overflow-y-auto space-y-2 py-6 text-center">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-2 text-zinc-400">
                <Eye className="w-5 h-5" />
              </div>
              <p className="text-xs text-zinc-300 font-mono">No views recorded yet</p>
              <p className="text-[11px] text-zinc-500 max-w-[240px] mx-auto leading-relaxed">
                When observers view your sighting, their explorer profiles will appear here.
              </p>
            </div>

            {/* Footer */}
            <div className="pt-2 text-center text-[10px] text-zinc-400 border-t border-zinc-800">
              Only you can see who viewed this anomaly story
            </div>
          </div>
        )}
        </div>

        {/* Desktop Keyboard Hints */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-white/50 select-none py-1">
          <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-white/80">Space</kbd> Pause</span>
          <span>•</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-white/80">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-white/80">→</kbd> Navigate</span>
          <span>•</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-white/80">M</kbd> Sound</span>
          <span>•</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-white/80">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
};
