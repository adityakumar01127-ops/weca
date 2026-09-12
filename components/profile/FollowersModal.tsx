"use client";

import React, { useState } from "react";
import { X, Search, UserCheck, UserPlus, ShieldCheck, Flame } from "lucide-react";
import { Tier, getTierColor } from "@/lib/types";

interface ResearcherItem {
  id: string;
  name: string;
  username: string;
  avatar_url: string;
  tier: Tier;
  role: string;
  isFollowing: boolean;
}

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "followers" | "following";
  username: string;
}

const INITIAL_RESEARCHERS: ResearcherItem[] = [
  {
    id: "r-1",
    name: "Dr. Elena Vance",
    username: "anomaly_hunter",
    avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
    tier: "Reality-Breaking",
    role: "Tokyo Sighting Lead",
    isFollowing: true,
  },
  {
    id: "r-2",
    name: "Marcus Thorne",
    username: "urban_stranger",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    tier: "Certified Weird",
    role: "Atmospheric Observer",
    isFollowing: false,
  },
  {
    id: "r-3",
    name: "Aoi Takahashi",
    username: "botanical_glitch",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    tier: "Legendary Anomaly",
    role: "Kyoto Flora Research",
    isFollowing: true,
  },
  {
    id: "r-4",
    name: "Liam O'Connor",
    username: "cryptid_scout",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    tier: "Mildly Odd",
    role: "Geological Field Scout",
    isFollowing: false,
  },
  {
    id: "r-5",
    name: "Sora Kim",
    username: "neon_glitcher",
    avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
    tier: "Certified Weird",
    role: "Optical Sensor Engineer",
    isFollowing: true,
  },
];

export const FollowersModal: React.FC<FollowersModalProps> = ({
  isOpen,
  onClose,
  type,
  username,
}) => {
  const [researchers, setResearchers] = useState<ResearcherItem[]>(INITIAL_RESEARCHERS);
  const [query, setQuery] = useState("");

  if (!isOpen) return null;

  const toggleFollow = (id: string) => {
    setResearchers((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isFollowing: !r.isFollowing } : r))
    );
  };

  const filtered = researchers.filter(
    (r) =>
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.username.toLowerCase().includes(query.toLowerCase()) ||
      r.role.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900/95 backdrop-blur-2xl rounded-3xl border border-zinc-200 dark:border-zinc-800/90 shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Card Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-cyan/60 to-transparent rounded-full" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/40 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-base text-zinc-900 dark:text-white">
              {type === "followers" ? "Community Observers" : "Following Observers"}
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan/10 text-cyan-700 dark:text-cyan border border-cyan/20">
              @{username}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/30">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search researchers by handle or role..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/30 transition-all font-mono"
            />
          </div>
        </div>

        {/* Researchers List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/50 p-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400 dark:text-zinc-500 font-mono">
              No matching anomaly researchers found.
            </div>
          ) : (
            filtered.map((r) => {
              const tierColors = getTierColor(r.tier);
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors gap-3"
                >
                  {/* Left: Avatar & Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={r.avatar_url}
                      alt={r.name}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700/80 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                          {r.name}
                        </span>
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan shrink-0" />
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                        <span>@{r.username}</span>
                        <span>•</span>
                        <span className="truncate">{r.role}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Tier Badge & Follow Toggle */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border ${tierColors.bg} ${tierColors.text} ${tierColors.border}`}
                    >
                      <Flame className="w-2.5 h-2.5" />
                      <span>{r.tier.split(" ")[0]}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleFollow(r.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] flex items-center gap-1.5 cursor-pointer shadow-xs ${
                        r.isFollowing
                          ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 dark:text-zinc-300 dark:border-zinc-700"
                          : "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950"
                      }`}
                    >
                      {r.isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/40 text-center text-[10px] font-mono text-zinc-400 dark:text-zinc-500 shrink-0">
          Weca Global Observer Network • Verified Roster
        </div>
      </div>
    </div>
  );
};
