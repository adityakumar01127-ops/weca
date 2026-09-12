"use client";

import React, { useState, useRef } from "react";
import { X, Upload, Dices, Trash2, Link as LinkIcon, Check, Camera, User as UserIcon } from "lucide-react";
import confetti from "canvas-confetti";
import { useAuth } from "@/context/AuthContext";

interface AvatarActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string | null;
  username: string;
}

export const AvatarActionModal: React.FC<AvatarActionModalProps> = ({
  isOpen,
  onClose,
  currentAvatarUrl,
  username,
}) => {
  const { updateProfile } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUpdating(true);
      const reader = new FileReader();
      reader.onload = async (uploadEvent) => {
        if (uploadEvent.target?.result) {
          const dataUrl = uploadEvent.target.result as string;
          try {
            await updateProfile({ avatar_url: dataUrl });
            try {
              confetti({
                particleCount: 30,
                spread: 50,
                origin: { y: 0.4 },
                colors: ["#7C5CFC", "#22D3EE", "#FF4D8D"],
              });
            } catch {}
            onClose();
          } catch (err) {
            console.error("Failed to upload avatar:", err);
          } finally {
            setIsUpdating(false);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRollDiceBear = async () => {
    setIsUpdating(true);
    const newSeed = `anomaly_${Math.random().toString(36).substring(2, 9)}`;
    const newAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${newSeed}`;
    try {
      await updateProfile({ avatar_url: newAvatar });
      onClose();
    } catch (err) {
      console.error("Failed to generate bot avatar:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApplyUrl = async () => {
    if (!customUrl.trim()) return;
    setIsUpdating(true);
    try {
      await updateProfile({ avatar_url: customUrl.trim() });
      onClose();
    } catch (err) {
      console.error("Failed to apply custom avatar URL:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemovePhoto = async () => {
    setIsUpdating(true);
    // Reset to default clean initials placeholder
    const defaultPlaceholder = `https://api.dicebear.com/7.x/initials/svg?seed=${username}`;
    try {
      await updateProfile({ avatar_url: defaultPlaceholder });
      onClose();
    } catch (err) {
      console.error("Failed to remove avatar:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-sm bg-zinc-900/95 backdrop-blur-2xl rounded-3xl border border-zinc-800/90 shadow-2xl shadow-black/90 p-6 text-zinc-100 font-sans space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white">
            <Camera className="w-4 h-4 text-cyan" />
            <span>Profile Picture Settings</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Avatar Holo Preview */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-cyan via-violet to-magenta ring-2 ring-violet/30 overflow-hidden shadow-2xl">
            <img
              src={currentAvatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`}
              alt={username}
              className="w-full h-full rounded-full object-cover bg-zinc-950"
            />
          </div>
          <span className="text-[11px] font-mono text-zinc-400 mt-2">@{username}</span>
        </div>

        {/* Action Menu (Instagram-style options) */}
        <div className="space-y-2">
          {/* 1. Upload Photo from Device */}
          <button
            type="button"
            id="avatar-action-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUpdating}
            className="w-full p-3 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-white flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet/20 text-violet">
                <Upload className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div>Upload Photo from Device</div>
                <div className="text-[10px] font-mono text-zinc-400 font-normal">JPG, PNG, WebP up to 10MB</div>
              </div>
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* 2. Roll Random Anomaly Bot */}
          <button
            type="button"
            id="avatar-action-roll-bot-btn"
            onClick={handleRollDiceBear}
            disabled={isUpdating}
            className="w-full p-3 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-white flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan/20 text-cyan">
                <Dices className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div>Generate Anomaly Bot Avatar</div>
                <div className="text-[10px] font-mono text-zinc-400 font-normal">Roll unique neural bot design</div>
              </div>
            </div>
          </button>

          {/* 3. Enter Custom Image URL */}
          <button
            type="button"
            id="avatar-action-url-toggle-btn"
            onClick={() => setShowUrlInput(!showUrlInput)}
            disabled={isUpdating}
            className="w-full p-3 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-white flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <LinkIcon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div>Paste Custom Image URL</div>
                <div className="text-[10px] font-mono text-zinc-400 font-normal">Use hosted HTTPS image link</div>
              </div>
            </div>
          </button>

          {showUrlInput && (
            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 animate-in fade-in">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-cyan"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                disabled={!customUrl.trim() || isUpdating}
                className="w-full py-2 rounded-xl bg-cyan hover:bg-cyan/90 text-zinc-950 font-semibold text-xs transition-colors cursor-pointer"
              >
                Apply Image URL
              </button>
            </div>
          )}

          {/* 4. Remove / Delete Current Photo */}
          <button
            type="button"
            id="avatar-action-remove-btn"
            onClick={handleRemovePhoto}
            disabled={isUpdating}
            className="w-full p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-400 flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div>Remove Current Photo</div>
                <div className="text-[10px] font-mono text-rose-400/80 font-normal">Delete photo and reset to default</div>
              </div>
            </div>
          </button>
        </div>

        {/* Footer Cancel */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-mono transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
