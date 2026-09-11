"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, WicaImage, getTierColor, getTierFromScore } from "@/lib/types";
import { getSafeImageUrl } from "@/lib/utils/image";
import { PhotoDetailModal } from "@/components/feed/PhotoDetailModal";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { UploadModal } from "@/components/upload/UploadModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { 
  Settings, 
  Grid, 
  Bookmark, 
  Tag, 
  Plus, 
  Camera, 
  Phone, 
  User as UserIcon, 
  Sparkles, 
  MessageCircle, 
  Heart, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Award,
  MoreHorizontal,
  LogOut,
  Activity,
  Sun,
  Moon,
  AlertCircle,
  Users,
  Check,
  Swords
} from "lucide-react";

interface ProfileViewProps {
  username: string;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ username }) => {
  const router = useRouter();
  const { user: currentUser, signOut, loginAsDemo } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [images, setImages] = useState<WicaImage[]>([]);
  const [avgScore, setAvgScore] = useState<number>(0);
  const [totalWC, setTotalWC] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<WicaImage | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"posts" | "saved" | "battles">("posts");
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const [userNote, setUserNote] = useState<string>("Note...");
  const [isEditingNote, setIsEditingNote] = useState<boolean>(false);
  const [tempNote, setTempNote] = useState<string>("");

  const isOwnProfile =
    currentUser &&
    (currentUser.username.toLowerCase() === username.toLowerCase() ||
      currentUser.id === username);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const res = await fetch(`/api/profile?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        if (data.user) {
          setProfileUser(data.user);
          setImages(data.images || []);
          setAvgScore(data.avgScore || 0);
          setTotalWC(data.totalWC || data.user.total_wc || 0);
        } else if (isOwnProfile && currentUser) {
          setProfileUser(currentUser);
          setTotalWC(currentUser.total_wc || 0);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [username, currentUser, isOwnProfile]);

  const displayUser = profileUser || (isOwnProfile ? currentUser : null);
  const tier = displayUser?.tier || (avgScore ? getTierFromScore(avgScore) : "Mildly Odd");
  const tierColors = getTierColor(tier);

  // Demo highlights
  const [highlights, setHighlights] = useState([
    { id: "h1", name: "Glitch Finds", image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=150&auto=format&fit=crop&q=80" },
    { id: "h2", name: "Luminous", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=150&auto=format&fit=crop&q=80" },
  ]);

  const handleCreateHighlight = () => {
    const name = prompt("Name your anomaly collection:", "Rare Nature");
    if (name) {
      setHighlights((prev) => [
        ...prev,
        {
          id: `h-${Date.now()}`,
          name,
          image: images[0]?.storage_path || "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=150&auto=format&fit=crop&q=80",
        },
      ]);
    }
  };

  const handleSaveNote = () => {
    if (tempNote.trim()) {
      setUserNote(tempNote.trim());
    }
    setIsEditingNote(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-ink">
      <Header onOpenUpload={() => setIsUploadOpen(true)} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-xs font-mono text-zinc-400">Loading profile archive...</span>
          </div>
        ) : !displayUser ? (
          <div className="py-24 text-center">
            <h2 className="font-display font-bold text-2xl text-ink">User not found</h2>
            <p className="text-xs text-zinc-500 mt-2">
              The explorer @{username} doesn&apos;t seem to be indexed yet.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block px-4 py-2 rounded-xl bg-ink text-white text-xs font-semibold"
            >
              Return to World Feed
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {/* INSTAGRAM-STYLE PROFILE HEADER */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-16 pb-8 border-b border-zinc-200">
              {/* Circular Avatar with Floating Note Bubble */}
              <div className="relative mx-auto md:mx-0 shrink-0">
                {/* "Note..." Thought Bubble */}
                {isEditingNote ? (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-white border border-zinc-300 shadow-md rounded-full px-2.5 py-1">
                    <input
                      type="text"
                      maxLength={30}
                      value={tempNote}
                      onChange={(e) => setTempNote(e.target.value)}
                      placeholder="Share a thought..."
                      className="text-[11px] font-mono outline-none w-24 text-ink"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleSaveNote()}
                    />
                    <button
                      onClick={handleSaveNote}
                      className="text-emerald-600 hover:text-emerald-700"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (isOwnProfile) {
                        setTempNote(userNote === "Note..." ? "" : userNote);
                        setIsEditingNote(true);
                      }
                    }}
                    className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-white border border-zinc-200 shadow-sm text-[11px] text-zinc-600 font-mono flex items-center gap-1 hover:bg-zinc-50 transition-all cursor-pointer group"
                    title={isOwnProfile ? "Click to set a status note" : ""}
                  >
                    <span className="max-w-[100px] truncate">{userNote}</span>
                    {/* Small speech bubble indicator */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-b border-r border-zinc-200 rotate-45" />
                  </button>
                )}

                {/* Big Avatar */}
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1 bg-gradient-to-tr from-cyan via-violet to-magenta ring-2 ring-transparent">
                  <div className="w-full h-full rounded-full bg-white p-1 overflow-hidden relative group">
                    <img
                      src={
                        displayUser.avatar_url ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${displayUser.id}`
                      }
                      alt={displayUser.username}
                      className="w-full h-full rounded-full object-cover bg-zinc-100"
                    />

                    {isOwnProfile && (
                      <Link
                        href="/settings"
                        className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
                        title="Change profile picture"
                      >
                        <Camera className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-mono">Change</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Details & Actions */}
              <div className="flex-1 w-full space-y-4">
                {/* Top Row: Username + Edit Profile / Settings Gear */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <h1 className="font-display font-semibold text-xl sm:text-2xl text-ink tracking-tight">
                    {displayUser.username}
                  </h1>

                  {/* Tier Badge */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${tierColors.bg} ${tierColors.text} ${tierColors.border}`}
                  >
                    {tier}
                  </span>

                  {isOwnProfile ? (
                    <div className="flex items-center gap-2 ml-auto sm:ml-0">
                      <Link
                        href="/settings"
                        className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-ink text-xs font-semibold transition-all active:scale-95"
                      >
                        Edit Profile
                      </Link>

                      <Link
                        href="/wallet"
                        className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-ink text-xs font-semibold transition-all active:scale-95"
                      >
                        View archive
                      </Link>

                      {/* Settings Gear with Dropdown / Link */}
                      <Link
                        href="/settings"
                        className="p-1.5 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors"
                        title="Settings"
                      >
                        <Settings className="w-5 h-5" />
                      </Link>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 ml-auto sm:ml-0">
                      <button
                        onClick={() => alert(`Now following @${displayUser.username}`)}
                        className="px-5 py-1.5 rounded-lg bg-violet hover:bg-violet/90 text-white text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-sm"
                      >
                        Follow
                      </button>
                      <button
                        onClick={() => alert(`Direct messages with @${displayUser.username}`)}
                        className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-ink text-xs font-semibold transition-all cursor-pointer"
                      >
                        Message
                      </button>
                    </div>
                  )}
                </div>

                {/* Stats Row (Posts, Followers, Following, WC) */}
                <div className="flex items-center gap-6 sm:gap-8 text-sm text-zinc-700">
                  <div>
                    <strong className="font-bold text-ink">{images.length}</strong>{" "}
                    <span className="text-zinc-500 text-xs sm:text-sm">posts</span>
                  </div>
                  <div>
                    <strong className="font-bold text-ink">
                      {displayUser.followers_count || 14}
                    </strong>{" "}
                    <span className="text-zinc-500 text-xs sm:text-sm">followers</span>
                  </div>
                  <div>
                    <strong className="font-bold text-ink">
                      {displayUser.following_count || 28}
                    </strong>{" "}
                    <span className="text-zinc-500 text-xs sm:text-sm">following</span>
                  </div>
                  <Link
                    href="/wallet"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan/10 border border-cyan/30 text-cyan text-xs font-mono font-bold hover:bg-cyan/20 transition-colors"
                    title="Weird Credits Wallet"
                  >
                    <Sparkles className="w-3 h-3 text-cyan" />
                    <span>{totalWC} WC</span>
                  </Link>
                </div>

                {/* Bio & Identity Details */}
                <div className="space-y-1 text-xs sm:text-sm">
                  <div className="font-semibold text-ink">
                    {displayUser.display_name || displayUser.username}
                  </div>
                  {displayUser.bio ? (
                    <p className="text-zinc-600 leading-relaxed whitespace-pre-line max-w-lg">
                      {displayUser.bio}
                    </p>
                  ) : (
                    <p className="text-zinc-400 italic">No bio added yet.</p>
                  )}

                  {displayUser.website && (
                    <a
                      href={
                        displayUser.website.startsWith("http")
                          ? displayUser.website
                          : `https://${displayUser.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-violet font-semibold hover:underline mt-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>{displayUser.website.replace(/^https?:\/\//, "")}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* STORY HIGHLIGHTS ROW */}
            <div className="flex items-center gap-6 overflow-x-auto pb-2 scrollbar-none">
              {/* + New Highlight Button */}
              {isOwnProfile && (
                <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group" onClick={handleCreateHighlight}>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-zinc-300 group-hover:border-zinc-500 flex items-center justify-center bg-white transition-all">
                    <Plus className="w-6 h-6 text-zinc-400 group-hover:text-ink transition-colors" />
                  </div>
                  <span className="text-[11px] font-mono text-zinc-600 font-medium">New</span>
                </div>
              )}

              {/* Highlights */}
              {highlights.map((h) => (
                <div key={h.id} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0.5 border border-zinc-200 group-hover:border-violet transition-all">
                    <img
                      src={h.image}
                      alt={h.name}
                      className="w-full h-full rounded-full object-cover bg-zinc-100"
                    />
                  </div>
                  <span className="text-[11px] font-mono text-zinc-600 font-medium max-w-[70px] truncate text-center">
                    {h.name}
                  </span>
                </div>
              ))}
            </div>

            {/* NAVIGATION TABS (POSTS / SAVED / BATTLES) */}
            <div className="border-t border-zinc-200">
              <div className="flex justify-center gap-12 sm:gap-16">
                <button
                  onClick={() => setActiveTab("posts")}
                  className={`flex items-center gap-2 py-3 -mt-px text-xs font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                    activeTab === "posts"
                      ? "border-t border-ink text-ink font-bold"
                      : "text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Posts ({images.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("saved")}
                  className={`flex items-center gap-2 py-3 -mt-px text-xs font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                    activeTab === "saved"
                      ? "border-t border-ink text-ink font-bold"
                      : "text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </button>

                <button
                  onClick={() => setActiveTab("battles")}
                  className={`flex items-center gap-2 py-3 -mt-px text-xs font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                    activeTab === "battles"
                      ? "border-t border-ink text-ink font-bold"
                      : "text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  <Swords className="w-3.5 h-3.5 text-magenta" />
                  <span>Versus</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT: POSTS / ANOMALIES */}
            {activeTab === "posts" && (
              <>
                {/* Onboarding Cards (Matching Screenshot 1 when 0 or few posts) */}
                {images.length === 0 ? (
                  <div className="space-y-6 pt-2">
                    <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                      Getting Started
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Card 1: Share photos */}
                      <div className="p-6 rounded-2xl border border-zinc-200 bg-white flex flex-col items-center text-center justify-between">
                        <div className="w-14 h-14 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-700 mb-4 bg-zinc-50">
                          <Camera className="w-7 h-7" />
                        </div>
                        <h4 className="font-semibold text-sm text-ink mb-1">Share photos</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed mb-6">
                          When you share photos of real strange things, they will appear on your profile.
                        </p>
                        <button
                          onClick={() => setIsUploadOpen(true)}
                          className="w-full py-2 px-3 rounded-lg bg-violet hover:bg-violet/90 text-white text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                        >
                          Share your first photo
                        </button>
                      </div>

                      {/* Card 2: Add phone / info */}
                      <div className="p-6 rounded-2xl border border-zinc-200 bg-white flex flex-col items-center text-center justify-between">
                        <div className="w-14 h-14 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-700 mb-4 bg-zinc-50">
                          <Phone className="w-7 h-7" />
                        </div>
                        <h4 className="font-semibold text-sm text-ink mb-1">Add bio & details</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed mb-6">
                          Add your biography, links, and region so fellow observers can recognize you.
                        </p>
                        <Link
                          href="/settings"
                          className="w-full py-2 px-3 rounded-lg bg-violet hover:bg-violet/90 text-white text-xs font-semibold transition-all active:scale-95 text-center"
                        >
                          Edit Profile Info
                        </Link>
                      </div>

                      {/* Card 3: Add profile photo */}
                      <div className="p-6 rounded-2xl border border-zinc-200 bg-white flex flex-col items-center text-center justify-between">
                        <div className="w-14 h-14 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-700 mb-4 bg-zinc-50">
                          <UserIcon className="w-7 h-7" />
                        </div>
                        <h4 className="font-semibold text-sm text-ink mb-1">Add profile photo</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed mb-6">
                          Add a profile avatar so friends and the community know it&apos;s you.
                        </p>
                        <Link
                          href="/settings"
                          className="w-full py-2 px-3 rounded-lg bg-violet hover:bg-violet/90 text-white text-xs font-semibold transition-all active:scale-95 text-center"
                        >
                          Change Profile Photo
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 3-COLUMN INSTAGRAM SQUARE GRID */
                  <div className="grid grid-cols-3 gap-1 sm:gap-4">
                    {images.map((img) => (
                      <div
                        key={img.id}
                        onClick={() => setSelectedImage(img)}
                        className="group relative aspect-square bg-zinc-100 overflow-hidden cursor-pointer"
                      >
                        <img
                          src={getSafeImageUrl(img.storage_path)}
                          alt={img.caption || "Anomaly"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Instagram-style Hover Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 text-white p-3 text-center">
                          <div className="flex items-center gap-4 text-xs font-mono font-bold">
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-4 h-4 text-cyan fill-current" />
                              <span>{img.wica_score}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-4 h-4 fill-current text-rose-500" />
                              <span>{img.likes_count || 12}</span>
                            </span>
                          </div>

                          <p className="text-[11px] font-mono text-zinc-200 line-clamp-2 max-w-[85%]">
                            &ldquo;{img.ai_verdict}&rdquo;
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* TAB CONTENT: SAVED */}
            {activeTab === "saved" && (
              <div className="py-16 text-center border-2 border-dashed border-zinc-200 rounded-3xl p-8">
                <Bookmark className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                <h3 className="font-display font-bold text-base text-ink">Saved Anomalies</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                  Only you can see what you&apos;ve saved. Bookmark weird finds across the World Feed to view them here.
                </p>
              </div>
            )}

            {/* TAB CONTENT: BATTLES */}
            {activeTab === "battles" && (
              <div className="py-16 text-center border-2 border-dashed border-zinc-200 rounded-3xl p-8">
                <Swords className="w-10 h-10 text-magenta mx-auto mb-3" />
                <h3 className="font-display font-bold text-base text-ink">Versus Showdown Record</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                  Anomalies entered into daily community Versus battles will appear here with win/loss records.
                </p>
                <Link
                  href="/versus"
                  className="mt-4 inline-block px-4 py-2 rounded-xl bg-magenta text-white text-xs font-semibold"
                >
                  Enter Today&apos;s Versus Arena
                </Link>
              </div>
            )}
          </div>
        )}
      </main>

      {/* INSTAGRAM-STYLE "MORE" BOTTOM POPOVER / SIDEBAR MENU */}
      <div className="fixed bottom-6 left-6 z-40">
        <div className="relative">
          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-zinc-200 text-ink text-xs font-semibold shadow-lg hover:bg-zinc-50 transition-all cursor-pointer"
          >
            <MoreHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">More</span>
          </button>

          {isMoreMenuOpen && (
            <div className="absolute bottom-12 left-0 w-64 rounded-2xl bg-white border border-zinc-200 shadow-2xl p-2 space-y-1 font-mono text-xs animate-in slide-in-from-bottom-2 duration-150 z-50 text-zinc-700">
              <Link
                href="/settings"
                onClick={() => setIsMoreMenuOpen(false)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-100 transition-colors"
              >
                <Settings className="w-4 h-4 text-zinc-500" />
                <span>Settings</span>
              </Link>

              <Link
                href="/wallet"
                onClick={() => setIsMoreMenuOpen(false)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-100 transition-colors"
              >
                <Activity className="w-4 h-4 text-zinc-500" />
                <span>Your Activity & Wallet</span>
              </Link>

              <button
                onClick={() => {
                  setActiveTab("saved");
                  setIsMoreMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-100 transition-colors text-left"
              >
                <Bookmark className="w-4 h-4 text-zinc-500" />
                <span>Saved</span>
              </button>

              <button
                onClick={() => alert("Appearance toggle demonstration")}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-100 transition-colors text-left"
              >
                <Moon className="w-4 h-4 text-zinc-500" />
                <span>Switch appearance</span>
              </button>

              <Link
                href="/learn-more"
                onClick={() => setIsMoreMenuOpen(false)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-100 transition-colors"
              >
                <AlertCircle className="w-4 h-4 text-zinc-500" />
                <span>Report a problem</span>
              </Link>

              <div className="pt-1 border-t border-zinc-100 my-1" />

              <button
                onClick={() => {
                  loginAsDemo();
                  setIsMoreMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-100 transition-colors text-left text-violet font-semibold"
              >
                <Users className="w-4 h-4" />
                <span>Switch accounts (Demo)</span>
              </button>

              <button
                onClick={() => {
                  signOut();
                  setIsMoreMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-100 transition-colors text-left text-rose-600 font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Universal Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={(newImg) => {
          setImages((prev) => [newImg, ...prev]);
        }}
      />
      <PhotoDetailModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
      <AuthModal />

      <Footer />
    </div>
  );
};
