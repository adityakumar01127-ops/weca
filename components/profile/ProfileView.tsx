"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, WicaImage, getTierColor, getTierFromScore } from "@/lib/types";
import { PhotoDetailModal } from "@/components/feed/PhotoDetailModal";
import { useAuth } from "@/context/AuthContext";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { FollowersModal } from "@/components/profile/FollowersModal";
import { StatusNoteModal } from "@/components/profile/StatusNoteModal";
import { StoryViewerModal, StoryItem } from "@/components/profile/StoryViewerModal";
import { AddStoryModal } from "@/components/profile/AddStoryModal";
import { AvatarActionModal } from "@/components/profile/AvatarActionModal";
import { HighlightModal, HighlightItem } from "@/components/profile/HighlightModal";
import { ExplorerDashboardModal } from "@/components/profile/ExplorerDashboardModal";
import { CreatePostModal } from "@/components/upload/CreatePostModal";
import { createConversation, getConversationByUsername } from "@/lib/messages";
import confetti from "canvas-confetti";
import {
  Grid,
  Bookmark,
  Swords,
  Plus,
  Camera,
  User as UserIcon,
  Sparkles,
  MessageCircle,
  Heart,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
  Share2,
  Coins,
  Settings,
  Flame,
  ArrowLeft,
  Copy,
  BarChart3,
  Pencil,
  Play,
} from "lucide-react";

interface ProfileViewProps {
  username: string;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ username }) => {
  const router = useRouter();
  const { user: currentUser, profile: authProfile } = useAuth();
  
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [images, setImages] = useState<WicaImage[]>([]);
  const [avgScore, setAvgScore] = useState<number>(0);
  const [totalWC, setTotalWC] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<WicaImage | null>(null);
  const [activeTab, setActiveTab] = useState<"posts" | "battles" | "saved">("posts");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFollowersOpen, setIsFollowersOpen] = useState(false);
  const [followersType, setFollowersType] = useState<"followers" | "following">("followers");
  const [selectedHighlight, setSelectedHighlight] = useState<string | null>(null);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

  // Dedicated Modals State
  const [isStatusNoteOpen, setIsStatusNoteOpen] = useState(false);
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [isAddStoryOpen, setIsAddStoryOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isHighlightModalOpen, setIsHighlightModalOpen] = useState(false);
  const [editingHighlight, setEditingHighlight] = useState<HighlightItem | null>(null);
  const [activeHighlightReel, setActiveHighlightReel] = useState<HighlightItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Stories state with local persistence
  const [stories, setStories] = useState<StoryItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("weca_active_stories");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // ignore
        }
      }
    }
    return [
      {
        id: "story-init-1",
        image_url: "/anom-1.jpg",
        caption: "Field sighting: Tokyo optical anomaly ⚡",
        created_at: "2h ago",
        wica_score: 94.2,
      },
      {
        id: "story-init-2",
        image_url: "/anom-2.jpg",
        caption: "Bioluminescent botanical glitch in Shinjuku 🌸",
        created_at: "45m ago",
        wica_score: 88.7,
      },
    ];
  });

  const handleAddStory = (newStory: StoryItem) => {
    const updated = [newStory, ...stories];
    setStories(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("weca_active_stories", JSON.stringify(updated));
    }
  };

  const handleDeleteStory = (storyId: string) => {
    const updated = stories.filter((s) => s.id !== storyId);
    setStories(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("weca_active_stories", JSON.stringify(updated));
    }
  };

  // Check if viewing own profile
  const isOwnProfile =
    !username ||
    (currentUser &&
      (currentUser.username?.toLowerCase() === username.toLowerCase() ||
        currentUser.id === username));

  // Default Expedition Highlights
  const DEFAULT_HIGHLIGHTS: HighlightItem[] = [
    {
      id: "h1",
      name: "Glitch Finds",
      icon: "🛸",
      gradient: "from-violet/80 via-purple-600/70 to-cyan/80",
      cover_image: "/anom-1.jpg",
      stories: [
        {
          id: "hl-s1",
          image_url: "/anom-1.jpg",
          caption: "Glitch anomaly in Sector 7",
          created_at: new Date().toISOString(),
          wica_score: 96,
        },
        {
          id: "hl-s2",
          image_url: "/anom-2.jpg",
          caption: "Spectral frequency feedback loop",
          created_at: new Date().toISOString(),
          wica_score: 91,
        },
      ],
    },
    {
      id: "h2",
      name: "Tokyo Night",
      icon: "⛩️",
      gradient: "from-indigo-600/80 via-fuchsia-600/70 to-pink-500/80",
      cover_image: "/anom-2.jpg",
      stories: [
        {
          id: "hl-s3",
          image_url: "/anom-2.jpg",
          caption: "Neon refraction over Shinjuku crossing",
          created_at: new Date().toISOString(),
          wica_score: 94,
        },
      ],
    },
    {
      id: "h3",
      name: "Rare Nature",
      icon: "🌿",
      gradient: "from-emerald-500/80 via-teal-600/70 to-cyan/80",
      cover_image: "/anom-3.jpg",
      stories: [
        {
          id: "hl-s4",
          image_url: "/anom-3.jpg",
          caption: "Bioluminescent botanical specimen",
          created_at: new Date().toISOString(),
          wica_score: 89,
        },
      ],
    },
  ];

  // Expeditions / Story highlights with localStorage persistence
  const [highlights, setHighlights] = useState<HighlightItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("weca_highlights");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
      }
    }
    return DEFAULT_HIGHLIGHTS;
  });

  const sampleExhibitionImages: WicaImage[] = [
    {
      id: "samp-1",
      user_id: "demo",
      storage_path: "/anom-1.jpg",
      category: "Human-Made",
      caption: "Urban optical refraction Tokyo",
      wica_score: 94,
      absurdity: 92,
      rarity: 95,
      craft: 88,
      cultural_novelty: 90,
      wit: 85,
      ai_verdict: "Certified S-Tier Anomaly",
      moderation_status: "approved",
      created_at: new Date().toISOString(),
      likes_count: 86,
      comments_count: 14,
    },
    {
      id: "samp-2",
      user_id: "demo",
      storage_path: "/anom-2.jpg",
      category: "Nature",
      caption: "Bioluminescent botanical glitch Kyoto",
      wica_score: 88,
      absurdity: 85,
      rarity: 89,
      craft: 84,
      cultural_novelty: 82,
      wit: 78,
      ai_verdict: "Verified Botanical Mutation",
      moderation_status: "approved",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      likes_count: 53,
      comments_count: 9,
    },
    {
      id: "samp-3",
      user_id: "demo",
      storage_path: "/anom-3.jpg",
      category: "Coincidences",
      caption: "Atmospheric resonance in night sky",
      wica_score: 91,
      absurdity: 88,
      rarity: 93,
      craft: 87,
      cultural_novelty: 86,
      wit: 80,
      ai_verdict: "Celestial Atmospheric Anomaly",
      moderation_status: "approved",
      created_at: new Date(Date.now() - 172800000).toISOString(),
      likes_count: 67,
      comments_count: 11,
    },
  ];

  const sampleBattles = [
    {
      id: "battle-tokyo-neon",
      title: "Urban Optical Refraction vs Atmospheric Resonance",
      postA: {
        id: "samp-1",
        title: "Urban Refraction",
        image: "/anom-1.jpg",
        score: 94,
        votes: 42,
      },
      postB: {
        id: "samp-3",
        title: "Atmospheric Resonance",
        image: "/anom-3.jpg",
        score: 91,
        votes: 31,
      },
      status: "active",
      statusLabel: "Live Voting",
      prize: "50 WC Bounty",
      endsIn: "5h 18m",
    },
    {
      id: "battle-kyoto-glitch",
      title: "Bioluminescent Glitch vs Silicon Mirror",
      postA: {
        id: "samp-2",
        title: "Bioluminescent Flora",
        image: "/anom-2.jpg",
        score: 88,
        votes: 76,
      },
      postB: {
        id: "samp-1",
        title: "Urban Refraction",
        image: "/anom-1.jpg",
        score: 85,
        votes: 49,
      },
      status: "won",
      statusLabel: "Victory (+50 WC)",
      prize: "Concluded",
      endsIn: "Ended",
    },
  ];

  // Load Saved Post IDs from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("weca_saved_posts");
        if (stored) {
          setSavedPostIds(JSON.parse(stored));
        } else {
          // Initialize with samp-1 as a demo bookmark if empty
          setSavedPostIds(["samp-1"]);
        }
      } catch {}
    }
  }, [activeTab]);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const targetUsername = username || currentUser?.username || "weca_explorer";
        const res = await fetch(`/api/profile?username=${encodeURIComponent(targetUsername)}`);
        const data = await res.json();
        
        if (data.user) {
          setProfileUser(data.user);
          const loadedImgs = (data.images && data.images.length > 0) ? data.images : sampleExhibitionImages;
          setImages(loadedImgs);
          setAvgScore(data.avgScore || 92);
          setTotalWC(data.totalWC || data.user.total_wc || authProfile?.credits_balance || 140);
        } else if (isOwnProfile && currentUser) {
          setProfileUser(currentUser);
          setImages(sampleExhibitionImages);
          setTotalWC(currentUser.total_wc || authProfile?.credits_balance || 140);
        } else {
          setImages(sampleExhibitionImages);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
        if (isOwnProfile && currentUser) {
          setProfileUser(currentUser);
          setImages(sampleExhibitionImages);
        }
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [username, currentUser, isOwnProfile, authProfile?.credits_balance]);

  // Synchronize when current user updates profile in context
  const displayUser = (isOwnProfile && currentUser) ? currentUser : (profileUser || currentUser);
  const tier = displayUser?.tier || (avgScore ? getTierFromScore(avgScore) : "Certified Weird");
  const tierColors = getTierColor(tier);

  // Dynamic Highlight Filtering
  const displayImages = useMemo(() => {
    if (!selectedHighlight) return images;
    if (selectedHighlight === "h1") {
      const match = images.filter(
        (img) =>
          img.category === "Human-Made" ||
          img.caption?.toLowerCase().includes("refraction") ||
          img.caption?.toLowerCase().includes("glitch")
      );
      return match.length > 0 ? match : images.slice(0, 1);
    }
    if (selectedHighlight === "h2") {
      const match = images.filter(
        (img) =>
          img.caption?.toLowerCase().includes("tokyo") ||
          img.caption?.toLowerCase().includes("night") ||
          img.caption?.toLowerCase().includes("sky")
      );
      return match.length > 0 ? match : images.slice(0, 2);
    }
    if (selectedHighlight === "h3") {
      const match = images.filter(
        (img) =>
          img.category === "Nature" ||
          img.category === "Coincidences" ||
          img.caption?.toLowerCase().includes("botanical")
      );
      return match.length > 0 ? match : images.slice(1, 3);
    }
    const custom = highlights.find((h) => h.id === selectedHighlight);
    if (custom) {
      if (custom.stories && custom.stories.length > 0) {
        const storyIds = custom.stories.map((s) => s.id);
        const matched = images.filter((img) => storyIds.includes(img.id));
        if (matched.length > 0) return matched;
      }
      const match = images.filter(
        (img) =>
          img.caption?.toLowerCase().includes(custom.name.toLowerCase()) ||
          img.category?.toLowerCase().includes(custom.name.toLowerCase())
      );
      return match.length > 0 ? match : images.slice(0, 2);
    }
    return images;
  }, [images, selectedHighlight, highlights]);

  // Dynamic Saved Posts lookup
  const savedImages = useMemo(() => {
    if (savedPostIds.length === 0) return [];
    const pool = [...images, ...sampleExhibitionImages];
    const map = new Map<string, WicaImage>();
    pool.forEach((item) => {
      if (savedPostIds.includes(item.id)) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  }, [images, savedPostIds]);

  const handleShareProfile = () => {
    if (typeof window !== "undefined") {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      setCopyToast(true);
      try {
        confetti({
          particleCount: 30,
          spread: 45,
          origin: { y: 0.4 },
          colors: ["#7C5CFC", "#22D3EE", "#FF4D8D"],
        });
      } catch {}
      setTimeout(() => setCopyToast(false), 2500);
    }
  };

  const handleAddHighlight = () => {
    setEditingHighlight(null);
    setIsHighlightModalOpen(true);
  };

  const handleSaveHighlight = (newHl: HighlightItem) => {
    setHighlights((prev) => {
      const exists = prev.some((h) => h.id === newHl.id);
      const updated = exists
        ? prev.map((h) => (h.id === newHl.id ? newHl : h))
        : [...prev, newHl];
      if (typeof window !== "undefined") {
        localStorage.setItem("weca_highlights", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleDeleteHighlight = (highlightId: string) => {
    setHighlights((prev) => {
      const updated = prev.filter((h) => h.id !== highlightId);
      if (typeof window !== "undefined") {
        localStorage.setItem("weca_highlights", JSON.stringify(updated));
      }
      return updated;
    });
    if (selectedHighlight === highlightId) {
      setSelectedHighlight(null);
    }
  };

  const handleHighlightClick = (h: HighlightItem) => {
    setSelectedHighlight((prev) => (prev === h.id ? null : h.id));
    if (h.stories && h.stories.length > 0) {
      setActiveHighlightReel(h);
    }
  };

  return (
    <div className="relative min-h-screen w-full min-w-0 overflow-x-clip bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-violet/30 font-sans pb-16 transition-colors duration-200">
      {/* Ambient Radial Background Glows - safely contained */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div 
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-violet/10 rounded-full blur-[140px] opacity-70"
        />
        <div 
          className="pointer-events-none absolute top-96 -left-32 w-[500px] h-[450px] bg-cyan/8 rounded-full blur-[160px] opacity-60"
        />
      </div>

      <div className="relative z-10 max-w-4xl w-full min-w-0 mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8">
        
        {/* Navigation / Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            {!isOwnProfile && (
              <button
                type="button"
                onClick={() => router.back()}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h1 className="font-mono text-sm sm:text-base font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              <span>{displayUser?.username || username || "explorer"}</span>
              <ShieldCheck className="w-4 h-4 text-cyan" />
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {isOwnProfile && (
              <button
                type="button"
                id="profile-create-post-btn"
                onClick={() => setIsCreateModalOpen(true)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Upload Anomaly"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleShareProfile}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Share profile"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {isOwnProfile && (
              <Link
                href="/settings"
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Explorer Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Copy Link Toast Notification */}
        {copyToast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 dark:bg-zinc-900/95 border border-violet/50 text-xs font-mono text-zinc-900 dark:text-white shadow-2xl shadow-violet/20 animate-in fade-in slide-in-from-top-3">
            <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Profile link copied to clipboard!</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 1: PROFILE HEADER & IDENTITY (Matching Reference Image 2)         */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          <div className="flex flex-row items-center gap-6 sm:gap-10">
            
            {/* Avatar with Floating Thought/Status Note & Story Ring */}
            <div className="relative shrink-0 select-none">
              
              {/* Floating Note Thought Bubble (Instagram Notes style) */}
              <button 
                type="button"
                id="profile-status-note-bubble"
                onClick={() => setIsStatusNoteOpen(true)}
                className={`absolute -top-7 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-white/95 dark:bg-zinc-900/95 border border-violet/30 hover:border-violet shadow-lg shadow-violet/10 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer group`}
                title={isOwnProfile ? "Click to view & update status note" : "Status Note"}
              >
                <span className="max-w-[120px] truncate text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-950 dark:group-hover:text-white font-medium">
                  {displayUser?.note || "Just curious..."}
                </span>
                {/* Speech bubble pointer */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-zinc-900 border-b border-r border-violet/30 rotate-45" />
              </button>

              {/* Glowing Chromatic Lens Ring / Story Ring */}
              <div 
                id="profile-avatar-story-ring"
                onClick={() => {
                  if (stories.length > 0) {
                    setIsStoryViewerOpen(true);
                  } else if (isOwnProfile) {
                    setIsAddStoryOpen(true);
                  }
                }}
                className={`w-22 h-22 sm:w-28 sm:h-28 rounded-full p-1 cursor-pointer transition-transform hover:scale-[1.03] active:scale-[0.98] ${
                  stories.length > 0
                    ? "bg-linear-to-tr from-cyan via-violet to-magenta ring-2 ring-violet/40 shadow-xl shadow-violet/20"
                    : "bg-zinc-200 dark:bg-zinc-800 ring-1 ring-zinc-300 dark:ring-zinc-700"
                } overflow-hidden relative group`}
                title={stories.length > 0 ? "Click to view Story" : (isOwnProfile ? "Click to add Story" : "Explorer Avatar")}
              >
                <img
                  src={
                    displayUser?.avatar_url ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${displayUser?.id || "user"}`
                  }
                  alt={displayUser?.username || "Explorer"}
                  className="w-full h-full rounded-full object-cover bg-zinc-100 dark:bg-zinc-950 pointer-events-none"
                />
              </div>

              {/* Bottom-Right: Plus Badge for Add Story (Instagram style) */}
              {isOwnProfile && (
                <button
                  type="button"
                  id="profile-add-story-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAddStoryOpen(true);
                  }}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-linear-to-r from-violet to-cyan text-white shadow-lg border-2 border-white dark:border-[#09090b] hover:scale-110 active:scale-95 transition-all cursor-pointer z-20"
                  title="Add to Expedition Story (+)"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Bottom-Left: Camera Badge for Profile Photo Management */}
              {isOwnProfile && (
                <button
                  type="button"
                  id="profile-edit-avatar-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAvatarModalOpen(true);
                  }}
                  className="absolute bottom-0 left-0 p-1.5 rounded-full bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border-2 border-white dark:border-[#09090b] hover:border-cyan/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm hover:scale-110 active:scale-95 transition-all cursor-pointer z-20"
                  title="Manage Profile Picture (Upload, DiceBear, Remove)"
                >
                  <Camera className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan" />
                </button>
              )}
            </div>

            {/* User Details & 3-Column Stats Row (Matching Reference Image 2) */}
            <div className="flex-1 min-w-0 space-y-3">
              
              {/* Name & Pronouns */}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display font-bold text-lg sm:text-xl text-zinc-900 dark:text-white tracking-tight">
                    {displayUser?.display_name || displayUser?.username || "Aditya Kaushik"}
                  </h2>
                  <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan shrink-0" />
                  
                  {/* Pronouns */}
                  {displayUser?.pronouns && (
                    <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/60 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700/60">
                      {displayUser.pronouns}
                    </span>
                  )}
                </div>
              </div>

              {/* Stats Counters Row */}
              <div className="flex items-center gap-5 sm:gap-7 text-xs sm:text-sm">
                <div>
                  <span className="font-bold text-zinc-900 dark:text-white font-mono">{images.length || 86}</span>{" "}
                  <span className="text-zinc-500 dark:text-zinc-400 font-sans">posts</span>
                </div>
                
                {/* Followers Clickable Target */}
                <button
                  type="button"
                  onClick={() => {
                    setFollowersType("followers");
                    setIsFollowersOpen(true);
                  }}
                  className="hover:opacity-80 transition-opacity text-left cursor-pointer group"
                >
                  <span className="font-bold text-zinc-900 dark:text-white font-mono group-hover:text-cyan-600 dark:group-hover:text-cyan transition-colors">
                    {displayUser?.followers_count || 472}
                  </span>{" "}
                  <span className="text-zinc-500 dark:text-zinc-400 font-sans group-hover:text-zinc-700 dark:group-hover:text-zinc-200">followers</span>
                </button>

                {/* Following Clickable Target */}
                <button
                  type="button"
                  onClick={() => {
                    setFollowersType("following");
                    setIsFollowersOpen(true);
                  }}
                  className="hover:opacity-80 transition-opacity text-left cursor-pointer group"
                >
                  <span className="font-bold text-zinc-900 dark:text-white font-mono group-hover:text-cyan-600 dark:group-hover:text-cyan transition-colors">
                    174
                  </span>{" "}
                  <span className="text-zinc-500 dark:text-zinc-400 font-sans group-hover:text-zinc-700 dark:group-hover:text-zinc-200">following</span>
                </button>

                {/* WC Balance */}
                <Link
                  href="/wallet"
                  className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors group"
                  title="Weird Credits Vault"
                >
                  <span className="font-bold text-amber-600 dark:text-amber-400 font-mono flex items-center gap-1 group-hover:scale-105 transition-transform">
                    <Coins className="w-3.5 h-3.5" />
                    {totalWC}
                  </span>{" "}
                  <span className="text-zinc-500 dark:text-zinc-400 font-sans">WC</span>
                </Link>
              </div>

            </div>
          </div>

          {/* Bio, Roles, and Link Pills */}
          <div className="space-y-2 pt-1">
            {/* Category / Specialty Tag */}
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {displayUser?.gender || "Entrepreneur / Anomaly Investigator"}
            </div>

            {/* Bio Text */}
            <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 font-sans leading-relaxed whitespace-pre-line max-w-xl">
              {displayUser?.bio ||
                "I am writer, dancer, director, editor, student, researcher, etc.\n💎 I AM THE PRESTIGE\n🔹 Tech & Anomaly Enthusiast"}
            </p>

            {/* Badges / Links Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* Website Link Pill */}
              {displayUser?.website && (
                <a
                  href={displayUser.website.startsWith("http") ? displayUser.website : `https://${displayUser.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-900/90 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-cyan-700 dark:text-cyan hover:text-cyan-800 dark:hover:text-cyan/80 transition-colors shadow-xs"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="truncate max-w-[200px]">
                    {displayUser.website.replace(/^https?:\/\//, "")}
                  </span>
                </a>
              )}

              {/* AI Creator Badge (Matching Reference Image 1 switch) */}
              {displayUser?.is_ai_profile && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet/15 border border-violet/30 text-xs font-mono text-violet">
                  <Sparkles className="w-3 h-3" />
                  <span>AI Vision Creator</span>
                </span>
              )}

              {/* Tier Badge */}
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono border ${tierColors.bg} ${tierColors.text} ${tierColors.border}`}>
                <Flame className="w-3 h-3" />
                <span>{tier}</span>
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: EXPLORER DASHBOARD (Matching Reference Image 2)                */}
          {/* ========================================================================= */}
          <div
            id="profile-explorer-dashboard-card"
            onClick={() => setIsDashboardOpen(true)}
            className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/90 hover:border-violet/40 transition-all flex items-center justify-between gap-4 shadow-xs group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet/15 text-violet border border-violet/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <span>Explorer dashboard</span>
                  <span className="flex items-center gap-1 text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Active
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  1.3K views in the last 30 days{" "}
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">+18.4%</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-block text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/60 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700/50">
                Rank #42
              </span>
              <div className="p-1 rounded-lg text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Action Buttons: Edit Profile / Message (own) | Follow / Message (other) */}
          <div className="flex items-center gap-3">
            {isOwnProfile ? (
              <>
                <button
                  type="button"
                  id="profile-edit-profile-btn"
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex-1 py-2 px-4 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer shadow-xs"
                >
                  Edit profile
                </button>
                <button
                  type="button"
                  id="profile-share-profile-btn"
                  onClick={handleShareProfile}
                  className="flex-1 py-2 px-4 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share profile
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`flex-1 py-2 px-4 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer shadow-xs ${
                    isFollowing
                      ? "bg-white text-zinc-800 border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800"
                      : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
                <button
                  type="button"
                  id="profile-message-user-btn"
                  onClick={() => {
                    const targetUsername = (!isOwnProfile && username) ? username : (displayUser?.username || username);
                    if (
                      !targetUsername ||
                      targetUsername === "user" ||
                      targetUsername === "weca_explorer"
                    ) {
                      router.push("/messages");
                      return;
                    }
                    let conv = getConversationByUsername(targetUsername);
                    if (!conv) {
                      conv = createConversation({
                        id: `u-${targetUsername.toLowerCase()}`,
                        username: targetUsername,
                        displayName: displayUser?.display_name || targetUsername,
                        avatarUrl:
                          displayUser?.avatar_url ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${targetUsername}`,
                      });
                    }
                    router.push(`/messages/${conv.id}`);
                  }}
                  className="flex-1 py-2 px-4 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Message
                </button>
              </>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: EXPEDITION HIGHLIGHTS (Matching Reference Image 2)             */}
          {/* ========================================================================= */}
          <div className="pt-2">
            <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-2 scrollbar-none">
              {/* Add Highlight Button */}
              {isOwnProfile && (
                <div className="flex flex-col items-center gap-1.5 shrink-0 select-none">
                  <button
                    type="button"
                    id="add-new-highlight-btn"
                    onClick={handleAddHighlight}
                    className="w-16 h-16 rounded-full border border-zinc-300 dark:border-zinc-700/80 hover:border-violet bg-white dark:bg-zinc-900/90 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer group shadow-xs hover:shadow-md hover:shadow-violet/20"
                    title="Add new expedition collection"
                  >
                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                  <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">New</span>
                </div>
              )}

              {/* Existing Highlights */}
              {highlights.map((h) => {
                const isSelected = selectedHighlight === h.id;
                return (
                  <div
                    key={h.id}
                    className="flex flex-col items-center gap-1.5 shrink-0 select-none group relative"
                  >
                    <div
                      id={`highlight-item-${h.id}`}
                      onClick={() => handleHighlightClick(h)}
                      className={`w-16 h-16 rounded-full p-[2px] transition-all cursor-pointer ${
                        isSelected
                          ? "bg-linear-to-tr from-violet via-fuchsia-500 to-cyan shadow-lg shadow-violet/30 scale-105"
                          : "bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:scale-105"
                      }`}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center relative">
                        {h.icon ? (
                          <div
                            className={`w-full h-full bg-linear-to-br ${
                              h.gradient || "from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-950"
                            } flex items-center justify-center text-2xl select-none group-hover:scale-110 transition-transform duration-300`}
                          >
                            {h.icon}
                          </div>
                        ) : h.cover_image ? (
                          <img
                            src={h.cover_image}
                            alt={h.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-linear-to-br from-violet/80 to-cyan/80 flex items-center justify-center text-2xl">
                            🛸
                          </div>
                        )}

                        {/* Story play indicator on hover */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Play className="w-4 h-4 text-white fill-white drop-shadow" />
                        </div>
                      </div>
                    </div>

                    {/* Edit Highlight Trigger for Owner */}
                    {isOwnProfile && (
                      <button
                        type="button"
                        id={`edit-highlight-btn-${h.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingHighlight(h);
                          setIsHighlightModalOpen(true);
                        }}
                        title="Edit highlight"
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-700 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-xs z-10 cursor-pointer"
                      >
                        <Pencil className="w-2.5 h-2.5" />
                      </button>
                    )}

                    <span
                      onClick={() => handleHighlightClick(h)}
                      className={`text-[11px] font-sans max-w-[70px] truncate text-center cursor-pointer transition-colors ${
                        isSelected ? "text-violet font-bold" : "text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-950 dark:group-hover:text-white"
                      }`}
                    >
                      {h.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 4: TABBED MEDIA SHOWCASE (Matching Reference Image 2)            */}
          {/* ========================================================================= */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/80">
            {/* Tab Bar */}
            <div className="flex items-center justify-around pb-4 border-b border-zinc-200 dark:border-zinc-800/60">
              <button
                type="button"
                onClick={() => setActiveTab("posts")}
                className={`flex items-center gap-2 pb-2 text-xs font-semibold transition-all relative cursor-pointer ${
                  activeTab === "posts" ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                <Grid className="w-4 h-4" />
                <span className="hidden sm:inline">Photographs</span>
                {activeTab === "posts" && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-zinc-900 dark:bg-white rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("battles")}
                className={`flex items-center gap-2 pb-2 text-xs font-semibold transition-all relative cursor-pointer ${
                  activeTab === "battles" ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                <Swords className="w-4 h-4" />
                <span className="hidden sm:inline">Versus Battles</span>
                {activeTab === "battles" && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-zinc-900 dark:bg-white rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("saved")}
                className={`flex items-center gap-2 pb-2 text-xs font-semibold transition-all relative cursor-pointer ${
                  activeTab === "saved" ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span className="hidden sm:inline">Saved</span>
                {activeTab === "saved" && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-zinc-900 dark:bg-white rounded-full" />
                )}
              </button>
            </div>

            {/* Active Highlight Filter Banner */}
            {selectedHighlight && activeTab === "posts" && (
              <div className="mt-4 flex items-center justify-between px-3.5 py-2 rounded-xl bg-violet/10 border border-violet/30 text-xs font-mono text-zinc-800 dark:text-zinc-200 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-violet shrink-0" />
                  <span>
                    Filtered by expedition:{" "}
                    <strong className="text-violet">
                      {highlights.find((h) => h.id === selectedHighlight)?.name}
                    </strong>{" "}
                    ({displayImages.length} captured)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedHighlight(null)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white underline cursor-pointer"
                >
                  Clear filter
                </button>
              </div>
            )}

            {/* 3-Column Media Grid (Matching Reference Image 2) */}
            <div className="pt-4">
              {loading ? (
                <div className="grid grid-cols-3 gap-1 sm:gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="aspect-square bg-zinc-200 dark:bg-zinc-900/60 rounded-lg animate-pulse border border-zinc-200 dark:border-zinc-800/40"
                    />
                  ))}
                </div>
              ) : activeTab === "battles" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                      Active & Past Arena Showdowns ({sampleBattles.length})
                    </p>
                    <Link
                      href="/versus"
                      className="text-xs font-mono text-violet hover:underline flex items-center gap-1"
                    >
                      <span>Versus Arena</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sampleBattles.map((battle) => (
                      <div
                        key={battle.id}
                        className="p-4 rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all flex flex-col justify-between gap-3 group shadow-xs"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-zinc-800 dark:text-zinc-300 font-semibold truncate max-w-[200px]">
                            {battle.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                              battle.status === "active"
                                ? "bg-magenta/15 text-magenta border border-magenta/30"
                                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            }`}
                          >
                            {battle.statusLabel}
                          </span>
                        </div>

                        {/* Side by side preview */}
                        <div className="grid grid-cols-2 gap-2 relative">
                          <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                            <img
                              src={battle.postA.image}
                              alt={battle.postA.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-1 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-mono text-cyan font-bold">
                              ★ {battle.postA.score}
                            </div>
                            <div className="absolute top-1 right-1.5 text-[10px] font-mono text-zinc-300">
                              {battle.postA.votes} votes
                            </div>
                          </div>

                          <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                            <img
                              src={battle.postB.image}
                              alt={battle.postB.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-1 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-mono text-cyan font-bold">
                              ★ {battle.postB.score}
                            </div>
                            <div className="absolute top-1 right-1.5 text-[10px] font-mono text-zinc-300">
                              {battle.postB.votes} votes
                            </div>
                          </div>

                          {/* Centered VS badge */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white flex items-center justify-center text-[10px] font-bold font-mono shadow-md">
                            VS
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-200 dark:border-zinc-800/60">
                          <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold">
                            <Coins className="w-3 h-3" />
                            {battle.prize}
                          </span>
                          <Link
                            href="/versus"
                            className="px-3 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/20 text-zinc-900 dark:text-white font-mono text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-xs"
                          >
                            <span>{battle.status === "active" ? "Vote Now" : "View Result"}</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : activeTab === "saved" ? (
                savedImages.length === 0 ? (
                  <div className="py-14 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 space-y-3 bg-white/40 dark:bg-transparent">
                    <Bookmark className="w-8 h-8 text-zinc-400 dark:text-zinc-600 mx-auto" />
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                      No bookmarked anomaly sightings yet.
                    </p>
                    <p className="text-[11px] text-zinc-500 font-sans max-w-sm mx-auto">
                      Click the bookmark icon on any anomaly photograph in the feed or photo detail modal to save it to your private vault.
                    </p>
                    <Link
                      href="/"
                      className="inline-block px-3.5 py-1.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 text-xs font-semibold dark:hover:bg-zinc-200 transition-colors shadow-xs"
                    >
                      Explore World Feed
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                        Bookmarked Sightings ({savedImages.length})
                      </p>
                      <Link
                        href="/"
                        className="text-xs font-mono text-violet hover:underline flex items-center gap-1"
                      >
                        <span>Find More</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-3 gap-1 sm:gap-2">
                      {savedImages.map((img) => (
                        <div
                          key={`saved-${img.id}`}
                          onClick={() => setSelectedImage(img)}
                          className="group relative aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 cursor-pointer"
                        >
                          <img
                            src={img.storage_path}
                            alt={img.caption || "Anomaly capture"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 right-2 z-10">
                            <span className="px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm border border-white/20 text-[10px] font-mono font-bold text-cyan">
                              ★ {img.wica_score || 90}
                            </span>
                          </div>
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-xs font-mono font-semibold">
                            <Bookmark className="w-5 h-5 fill-white text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ) : displayImages.length === 0 ? (
                <div className="py-14 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 space-y-3 bg-white/40 dark:bg-transparent">
                  <Camera className="w-8 h-8 text-zinc-400 dark:text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                    No anomaly photographs found in this collection.
                  </p>
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="inline-block px-4 py-2 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 text-xs font-semibold dark:hover:bg-zinc-200 transition-colors cursor-pointer shadow-xs"
                    >
                      Upload Photograph
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1 sm:gap-2">
                  {displayImages.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => setSelectedImage(img)}
                      className="group relative aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 cursor-pointer"
                    >
                      <img
                        src={img.storage_path}
                        alt={img.caption || "Anomaly capture"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      
                      {/* Top Right Multi-indicator / Score */}
                      <div className="absolute top-2 right-2 z-10">
                        <span className="px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm border border-white/20 text-[10px] font-mono font-bold text-cyan">
                          ★ {img.wica_score || 90}
                        </span>
                      </div>

                      {/* Hover Overlay with Stats */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-xs font-mono font-semibold">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4 fill-white" />
                          <span>{img.likes_count || 42}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4 fill-white" />
                          <span>{img.comments_count || 7}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Edit Profile Modal (Matching Reference Image 1) */}
      {displayUser && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentUser={displayUser}
        />
      )}

      {/* Followers & Observers Modal */}
      <FollowersModal
        isOpen={isFollowersOpen}
        onClose={() => setIsFollowersOpen(false)}
        type={followersType}
        username={displayUser?.username || username || "explorer"}
      />

      {/* Photo Detail Modal */}
      {selectedImage && (
        <PhotoDetailModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      {/* Status Note Modal (Instagram Notes style) */}
      <StatusNoteModal
        isOpen={isStatusNoteOpen}
        onClose={() => setIsStatusNoteOpen(false)}
        currentNote={displayUser?.note}
        username={displayUser?.username || username || "explorer"}
        avatarUrl={displayUser?.avatar_url}
      />

      {/* Story Viewer Modal (Instagram Stories & Highlight Reels) */}
      <StoryViewerModal
        isOpen={isStoryViewerOpen || Boolean(activeHighlightReel)}
        onClose={() => {
          setIsStoryViewerOpen(false);
          setActiveHighlightReel(null);
        }}
        stories={activeHighlightReel ? activeHighlightReel.stories : stories}
        username={displayUser?.username || username || "explorer"}
        avatarUrl={
          activeHighlightReel?.cover_image ||
          displayUser?.avatar_url
        }
        isOwnStory={Boolean(isOwnProfile && !activeHighlightReel)}
        onDeleteStory={handleDeleteStory}
        isHighlight={Boolean(activeHighlightReel)}
        highlightTitle={activeHighlightReel?.name || null}
      />

      {/* Add Story Modal */}
      <AddStoryModal
        isOpen={isAddStoryOpen}
        onClose={() => setIsAddStoryOpen(false)}
        onAddStory={handleAddStory}
        availablePhotos={images.map((img) => ({
          id: img.id,
          url: img.storage_path,
          caption: img.caption || undefined,
        }))}
      />

      {/* Avatar Action Modal (Upload, Generate, Remove Photo) */}
      <AvatarActionModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={displayUser?.avatar_url}
        username={displayUser?.username || username || "explorer"}
      />

      {/* Explorer Intelligence Dashboard Modal */}
      <ExplorerDashboardModal
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        username={displayUser?.username || username || "explorer"}
        userSightings={images}
        wcBalance={displayUser?.total_wc || authProfile?.credits_balance || 150}
        onSelectSighting={(sighting) => setSelectedImage(sighting)}
      />

      {/* Expedition Highlight Creation & Management Modal */}
      <HighlightModal
        isOpen={isHighlightModalOpen}
        onClose={() => {
          setIsHighlightModalOpen(false);
          setEditingHighlight(null);
        }}
        onSave={handleSaveHighlight}
        onDelete={handleDeleteHighlight}
        editingHighlight={editingHighlight}
        userSightings={images}
      />

      {/* Create / Upload Sighting Modal (Live Camera, Canvas Snap, Drafts, Scheduled Posts) */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={() => {
          if (typeof window !== "undefined") {
            window.location.reload();
          }
        }}
      />
    </div>
  );
};
