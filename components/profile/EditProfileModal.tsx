"use client";

import React, { useState, useEffect } from "react";
import { User } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import {
  X,
  Camera,
  Sparkles,
  Check,
  RefreshCw,
  Link as LinkIcon,
  MessageSquare,
  User as UserIcon,
  Globe,
  Tag,
  AtSign,
} from "lucide-react";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const { updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState(currentUser.display_name || "");
  const [username, setUsername] = useState(currentUser.username || "");
  const [pronouns, setPronouns] = useState(currentUser.pronouns || "he/him/his");
  const [bio, setBio] = useState(currentUser.bio || "");
  const [website, setWebsite] = useState(currentUser.website || "");
  const [gender, setGender] = useState(currentUser.gender || "Explorer");
  const [statusNote, setStatusNote] = useState(currentUser.note || "Just curious...");
  const [isAiProfile, setIsAiProfile] = useState(currentUser.is_ai_profile ?? true);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url || "");
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleShuffleAvatar = () => {
    const seed = `weca_${Date.now().toString(36)}`;
    setAvatarUrl(`https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
      await updateProfile({
        display_name: displayName.trim() || cleanUsername,
        username: cleanUsername || currentUser.username,
        pronouns: pronouns.trim(),
        bio: bio.trim(),
        website: website.trim(),
        gender: gender.trim(),
        note: statusNote.trim(),
        is_ai_profile: isAiProfile,
        avatar_url: avatarUrl.trim() || currentUser.avatar_url,
      });

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 600);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/70 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-white dark:bg-zinc-900/95 backdrop-blur-2xl rounded-3xl border border-zinc-200 dark:border-zinc-800/90 shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100 animate-in zoom-in-95 duration-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-violet/70 to-transparent rounded-full" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/40 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-lg text-zinc-900 dark:text-white">Edit profile</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet/10 text-violet border border-violet/20">
              Identity & Settings
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close edit profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form id="edit-profile-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 sm:py-6 space-y-6">
          
          {/* Avatar Section (Matching Reference Image 1) */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-cyan via-violet to-magenta ring-2 ring-violet/30 shadow-xl overflow-hidden">
                <img
                  src={
                    avatarUrl ||
                    currentUser.avatar_url ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.id}`
                  }
                  alt={displayName || currentUser.username}
                  className="w-full h-full rounded-full object-cover bg-zinc-100 dark:bg-zinc-950"
                />
              </div>

              {/* Camera icon badge */}
              <button
                type="button"
                onClick={() => setIsAvatarPickerOpen(!isAvatarPickerOpen)}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-violet hover:bg-violet/90 text-white shadow-lg border-2 border-white dark:border-zinc-900 transition-transform active:scale-95 cursor-pointer"
                title="Change picture"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsAvatarPickerOpen(!isAvatarPickerOpen)}
              className="mt-3 text-xs font-semibold text-violet hover:text-violet/90 hover:underline cursor-pointer"
            >
              Edit picture or avatar
            </button>

            {/* Expandable Avatar Editor */}
            {isAvatarPickerOpen && (
              <div className="mt-3 w-full p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 space-y-2 animate-in fade-in">
                <label className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 block text-left">
                  Image URL or Avatar Seed:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://... or unsplash link"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet"
                  />
                  <button
                    type="button"
                    onClick={handleShuffleAvatar}
                    className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-mono text-zinc-700 dark:text-zinc-300 flex items-center gap-1 cursor-pointer border border-zinc-200 dark:border-zinc-700"
                    title="Generate random DiceBear bot avatar"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Shuffle</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Form Fields Stack (Matching Reference Image 1 Layout) */}
          <div className="space-y-4">
            
            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Name</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-500">Public Display</span>
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Aditya Kaushik"
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/40 transition-all"
              />
            </div>

            {/* Username */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Username</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-500">Unique handle</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="mr_adityakaushik"
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/40 transition-all font-mono"
              />
            </div>

            {/* Pronouns */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Pronouns</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-500">e.g. he/him, they/them</span>
              </label>
              <input
                type="text"
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                placeholder="he/him/his"
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/40 transition-all font-mono"
              />
            </div>

            {/* Bio */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Bio</span>
                <span className="text-[10px] font-mono text-zinc-500">{bio.length}/150</span>
              </label>
              <textarea
                rows={3}
                maxLength={150}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Anomaly investigator, photographer, researcher..."
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/40 transition-all resize-none leading-relaxed"
              />
            </div>

            {/* Links */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Website / Links</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-500">Portfolio URL</span>
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://agirheo.com"
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/40 transition-all font-mono"
              />
            </div>

            {/* Status Note (Thought Bubble) */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Status Note</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-500">Shown above avatar</span>
              </label>
              <input
                type="text"
                maxLength={30}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Just curious..."
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/40 transition-all"
              />
            </div>

            {/* Gender / Specialization */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Specialization / Role</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-500">Researcher Category</span>
              </label>
              <input
                type="text"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                placeholder="Entrepreneur / Anomaly Scout"
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/40 transition-all"
              />
            </div>

            {/* AI Creator Toggle (Reference Image 1 Highlight) */}
            <div className="pt-2">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan" />
                    <span className="text-xs font-semibold text-zinc-900 dark:text-white">AI creator</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                    Add this label to your profile if your content often uses AI.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isAiProfile}
                    onChange={(e) => setIsAiProfile(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet"></div>
                </label>
              </div>
            </div>

          </div>
        </form>

        {/* Pinned Action Footer */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="edit-profile-form"
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 font-semibold text-xs transition-all shadow-xs dark:hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Done</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
