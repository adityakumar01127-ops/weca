"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Check, Trash2 } from "lucide-react";
import confetti from "canvas-confetti";
import { useAuth } from "@/context/AuthContext";

interface StatusNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNote?: string | null;
  username: string;
  avatarUrl?: string | null;
}

const MOOD_VIBES = [
  { emoji: "🔮", label: "Mystic" },
  { emoji: "⚡", label: "Electric" },
  { emoji: "👁️", label: "Observer" },
  { emoji: "🛸", label: "Cosmic" },
  { emoji: "🌌", label: "Spatial" },
  { emoji: "🔬", label: "Forensic" },
  { emoji: "☕", label: "Chilling" },
  { emoji: "✨", label: "Wonder" },
];

export const StatusNoteModal: React.FC<StatusNoteModalProps> = ({
  isOpen,
  onClose,
  currentNote,
  username,
  avatarUrl,
}) => {
  const { updateProfile } = useAuth();
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [noteText, setNoteText] = useState(currentNote || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setNoteText(currentNote || "");
    }
  }

  if (!isOpen) return null;

  const handleShare = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ note: noteText.trim() });
      try {
        confetti({
          particleCount: 25,
          spread: 40,
          origin: { y: 0.4 },
          colors: ["#7C5CFC", "#22D3EE", "#FF4D8D"],
        });
      } catch {}
      onClose();
    } catch (err) {
      console.error("Failed to update status note:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ note: "" });
      onClose();
    } catch (err) {
      console.error("Failed to delete status note:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddVibe = (emoji: string) => {
    if (noteText.includes(emoji)) return;
    const next = noteText ? `${noteText} ${emoji}` : emoji;
    if (next.length <= 60) {
      setNoteText(next);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900/95 backdrop-blur-2xl rounded-3xl border border-zinc-200 dark:border-zinc-800/90 shadow-2xl p-6 text-zinc-900 dark:text-zinc-100 font-sans space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 dark:text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-violet" />
            <span>Anomaly Status Note</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Thought Bubble Preview on Avatar (Instagram-style) */}
        <div className="flex flex-col items-center justify-center pt-2">
          {/* Live Floating Thought Bubble */}
          <div className="relative mb-3 px-3 py-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 shadow-md text-xs font-mono text-zinc-900 dark:text-zinc-100 flex items-center gap-1 max-w-[220px] text-center backdrop-blur-md animate-in zoom-in-95">
            <span className="truncate">
              {noteText.trim() ? noteText : "Share a thought..."}
            </span>
            {/* Pointer notch */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-100 dark:bg-zinc-800 border-b border-r border-zinc-200 dark:border-zinc-700/80 rotate-45" />
          </div>

          {/* User Avatar */}
          <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-cyan via-violet to-magenta ring-2 ring-violet/30 overflow-hidden shadow-xl">
            <img
              src={avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`}
              alt={username}
              className="w-full h-full rounded-full object-cover bg-zinc-100 dark:bg-zinc-950"
            />
          </div>
          <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-2">@{username}</span>
        </div>

        {/* Text Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
            <span>What&apos;s on your radar?</span>
            <span className={noteText.length > 50 ? "text-amber-500 dark:text-amber-400" : "text-zinc-400 dark:text-zinc-500"}>
              {noteText.length}/60
            </span>
          </div>
          <input
            type="text"
            maxLength={60}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="e.g. Scanning optical refractions 🌌"
            autoFocus
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 font-mono focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/30 transition-all"
          />
        </div>

        {/* Quick Mood Vibes Picker */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Quick Vibes
          </div>
          <div className="flex flex-wrap gap-1.5">
            {MOOD_VIBES.map((v) => (
              <button
                key={v.label}
                type="button"
                onClick={() => handleAddVibe(v.emoji)}
                className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-800 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 dark:border-zinc-700/60 text-xs font-mono dark:text-zinc-200 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <span>{v.emoji}</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          {currentNote && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSaving}
              className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-mono transition-colors cursor-pointer"
              title="Delete current note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleShare}
            disabled={isSaving}
            className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold text-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center gap-1.5"
          >
            {isSaving ? (
              <span>Updating...</span>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{currentNote ? "Update Note" : "Share Note"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
