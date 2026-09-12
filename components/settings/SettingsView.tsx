"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  User as UserIcon,
  Sparkles,
  Cpu,
  Coins,
  ShieldCheck,
  Check,
  Camera,
  ExternalLink,
  Sliders,
  LogOut,
  RotateCcw,
  AlertTriangle,
  ChevronRight,
  Eye,
  EyeOff,
  Flame,
  Zap,
  HelpCircle,
  Clock,
  Wallet,
} from "lucide-react";
import { getTierColor, getTierFromScore } from "@/lib/types";

type SettingsTab = "profile" | "ai-vision" | "wallet" | "account";

export const SettingsView: React.FC = () => {
  const router = useRouter();
  const { user, profile, updateProfile, updateUserWC, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tab 1: Profile & Identity State
  const [displayName, setDisplayName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [pronouns, setPronouns] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [isAiProfile, setIsAiProfile] = useState<boolean>(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [showPhotoPicker, setShowPhotoPicker] = useState<boolean>(false);

  // Tab 2: AI Vision Settings
  const [visionEngine, setVisionEngine] = useState<"gemini-2.5-flash" | "claude-3.5-sonnet" | "local-neural">(
    "gemini-2.5-flash"
  );
  const [strictness, setStrictness] = useState<number>(85);
  const [autoScore, setAutoScore] = useState<boolean>(true);

  // Tab 3: Wallet & Credits
  const [dailyClaimed, setDailyClaimed] = useState<boolean>(false);

  // Tab 4: Account & Session State
  const [publicVisibility, setPublicVisibility] = useState<boolean>(true);
  const [microAnimations, setMicroAnimations] = useState<boolean>(true);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  // Synchronize state when user or profile loads
  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || user.username || "Aditya Kaushik");
      setUsername(user.username || "weca_explorer");
      setPronouns(user.pronouns || "they/them");
      setBio(
        user.bio ||
          "I am writer, dancer, director, editor, student, researcher, etc.\n💎 I AM THE PRESTIGE\n🔹 Tech & Anomaly Enthusiast"
      );
      setWebsite(user.website || "https://weca.ai");
      setGender(user.gender || "Entrepreneur / Anomaly Investigator");
      setNote(user.note || "Just curious...");
      setIsAiProfile(Boolean(user.is_ai_profile));
      setAvatarUrl(user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id || "explorer"}`);
    }
  }, [user]);

  // Load persistent AI & session settings from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedAi = localStorage.getItem("weca_ai_settings");
        if (savedAi) {
          const parsed = JSON.parse(savedAi);
          if (parsed.visionEngine) setVisionEngine(parsed.visionEngine);
          if (parsed.strictness) setStrictness(parsed.strictness);
          if (typeof parsed.autoScore === "boolean") setAutoScore(parsed.autoScore);
        }

        const todayKey = `weca_daily_claimed_${new Date().toISOString().slice(0, 10)}`;
        if (localStorage.getItem(todayKey)) {
          setDailyClaimed(true);
        }
      } catch {}
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Avatar presets
  const avatarPresets = [
    `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id || "explorer"}`,
    "https://api.dicebear.com/7.x/bottts/svg?seed=spiritual",
    "https://api.dicebear.com/7.x/bottts/svg?seed=anomaly",
    "https://api.dicebear.com/7.x/bottts/svg?seed=tokyo",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  ];

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateProfile({
        display_name: displayName.trim(),
        username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ""),
        pronouns: pronouns.trim(),
        bio: bio.trim(),
        website: website.trim(),
        gender: gender.trim(),
        note: note.trim(),
        is_ai_profile: isAiProfile,
        avatar_url: avatarUrl,
      });

      showToast("Profile configuration saved successfully!");
      if (microAnimations) {
        try {
          confetti({
            particleCount: 35,
            spread: 50,
            origin: { y: 0.3 },
            colors: ["#7C5CFC", "#22D3EE", "#FF4D8D"],
          });
        } catch {}
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      showToast("Failed to save changes. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save AI Vision Handler
  const handleSaveAiSettings = () => {
    try {
      localStorage.setItem(
        "weca_ai_settings",
        JSON.stringify({
          visionEngine,
          strictness,
          autoScore,
        })
      );
      showToast("AI Vision appraisal parameters updated!");
      if (microAnimations) {
        try {
          confetti({
            particleCount: 25,
            spread: 45,
            origin: { y: 0.3 },
            colors: ["#22D3EE", "#7C5CFC"],
          });
        } catch {}
      }
    } catch {
      showToast("Failed to store AI vision settings.");
    }
  };

  // Claim Daily Observation WC
  const handleClaimDaily = () => {
    if (dailyClaimed) return;
    updateUserWC(10);
    const todayKey = `weca_daily_claimed_${new Date().toISOString().slice(0, 10)}`;
    localStorage.setItem(todayKey, "true");
    setDailyClaimed(true);
    showToast("Claimed +10 Weird Credits! Vault updated.");
    if (microAnimations) {
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.4 },
          colors: ["#F59E0B", "#22D3EE", "#7C5CFC"],
        });
      } catch {}
    }
  };

  // Reset Demo Session Handler
  const handleResetDemo = async () => {
    localStorage.removeItem("weca_user_extras");
    localStorage.removeItem("weca_ai_settings");
    await updateProfile({
      display_name: "Aditya Kaushik",
      username: "weca_explorer",
      pronouns: "they/them",
      bio: "I am writer, dancer, director, editor, student, researcher, etc.\n💎 I AM THE PRESTIGE\n🔹 Tech & Anomaly Enthusiast",
      website: "https://weca.ai",
      gender: "Entrepreneur / Anomaly Investigator",
      note: "Just curious...",
      is_ai_profile: true,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=spiritual`,
    });
    setShowResetConfirm(false);
    showToast("Session reset to default explorer baseline.");
  };

  // Sign Out Handler
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  const currentWC = user?.total_wc || profile?.credits_balance || 140;
  const tier = user?.tier || "Certified Weird";
  const tierColors = getTierColor(tier);

  return (
    <div className="relative min-h-screen bg-[#09090b] text-zinc-100 selection:bg-violet/30 font-sans pb-20">
      {/* Radial Ambient Glows */}
      <div
        className="pointer-events-none absolute -top-32 left-1/3 -translate-x-1/2 w-[700px] h-[400px] bg-violet/10 rounded-full blur-[140px] opacity-70"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-96 -right-24 w-[500px] h-[450px] bg-cyan/8 rounded-full blur-[160px] opacity-60"
        aria-hidden="true"
      />

      {/* Floating Success Notification */}
      {toastMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-full bg-zinc-900/95 border border-violet/60 text-xs font-mono text-white shadow-2xl shadow-violet/25 animate-in fade-in slide-in-from-top-3 backdrop-blur-xl">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Console Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#09090b]/80 backdrop-blur-xl border-b border-zinc-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(`/profile/${user?.username || ""}`)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
              title="Return to Profile"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-sm sm:text-base text-white">
                  Console Settings
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet/15 text-violet border border-violet/30">
                  Obsidian v2.4
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400 hidden sm:block">
                Configure identity, sensory AI vision models, credits vault, and sessions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/profile/${user?.username || ""}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer"
            >
              <img
                src={avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=explorer`}
                alt="Avatar"
                className="w-5 h-5 rounded-full object-cover bg-zinc-950"
              />
              <span className="hidden sm:inline">@{user?.username || "explorer"}</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Settings Console Layout */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ============================================================ */}
          {/* LEFT COLUMN: NAVIGATION TABS                                 */}
          {/* ============================================================ */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-3xl bg-zinc-900/60 backdrop-blur-2xl border border-zinc-800/80 shadow-xl space-y-2">
              <div className="px-3 py-2 text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                System Control Panels
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "profile"
                    ? "bg-violet/15 border border-violet/40 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      activeTab === "profile" ? "bg-violet text-white" : "bg-zinc-800/60 text-zinc-400"
                    }`}
                  >
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white">Profile & Identity</div>
                    <div className="text-[10px] font-mono text-zinc-400">Bio, handle, note & badges</div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${activeTab === "profile" ? "text-violet" : "text-zinc-600"}`} />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("ai-vision")}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "ai-vision"
                    ? "bg-cyan/15 border border-cyan/40 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      activeTab === "ai-vision" ? "bg-cyan text-zinc-950" : "bg-zinc-800/60 text-zinc-400"
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white">AI Vision & Scoring</div>
                    <div className="text-[10px] font-mono text-zinc-400">Model engine & strictness</div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${activeTab === "ai-vision" ? "text-cyan" : "text-zinc-600"}`} />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("wallet")}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "wallet"
                    ? "bg-amber-500/15 border border-amber-500/40 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      activeTab === "wallet" ? "bg-amber-500 text-zinc-950" : "bg-zinc-800/60 text-zinc-400"
                    }`}
                  >
                    <Coins className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white">Weird Credits & Vault</div>
                    <div className="text-[10px] font-mono text-zinc-400">{currentWC} WC balance & faucet</div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${activeTab === "wallet" ? "text-amber-400" : "text-zinc-600"}`} />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("account")}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "account"
                    ? "bg-magenta/15 border border-magenta/40 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      activeTab === "account" ? "bg-magenta text-white" : "bg-zinc-800/60 text-zinc-400"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white">Account & Session</div>
                    <div className="text-[10px] font-mono text-zinc-400">Privacy, reset & logout</div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${activeTab === "account" ? "text-magenta" : "text-zinc-600"}`} />
              </button>
            </div>

            {/* Quick Status Pill */}
            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Hunter Tier:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] border ${tierColors.bg} ${tierColors.text} ${tierColors.border}`}>
                  {tier}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Vault Balance:</span>
                <span className="text-amber-400 font-bold">{currentWC} WC</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>State Engine:</span>
                <span className="text-emerald-400">Connected</span>
              </div>
            </div>
          </aside>

          {/* ============================================================ */}
          {/* RIGHT COLUMN: ACTIVE PANEL CONTENT                           */}
          {/* ============================================================ */}
          <section className="lg:col-span-8">
            <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/60 backdrop-blur-2xl border border-zinc-800/80 shadow-2xl space-y-8">
              
              {/* ========================================================== */}
              {/* PANEL 1: PROFILE & IDENTITY                                */}
              {/* ========================================================== */}
              {activeTab === "profile" && (
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div>
                    <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                      <span>Public Identity & Field Dossier</span>
                    </h2>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      This information represents your researcher persona across the Weca anomaly index.
                    </p>
                  </div>

                  {/* Avatar Picker Section */}
                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative group shrink-0">
                      <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-cyan via-violet to-magenta ring-2 ring-violet/30 overflow-hidden">
                        <img
                          src={avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=explorer`}
                          alt="Avatar"
                          className="w-full h-full rounded-full object-cover bg-zinc-950"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPhotoPicker(!showPhotoPicker)}
                        className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white cursor-pointer"
                        title="Change avatar"
                      >
                        <Camera className="w-4 h-4 mb-0.5" />
                        <span className="text-[9px] font-mono">Change</span>
                      </button>
                    </div>

                    <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <span className="text-xs font-semibold text-white">Avatar Holo-Lens</span>
                        <button
                          type="button"
                          onClick={() => setShowPhotoPicker(!showPhotoPicker)}
                          className="px-3 py-1 rounded-xl bg-violet/15 hover:bg-violet/25 text-violet border border-violet/30 text-xs font-mono transition-colors cursor-pointer"
                        >
                          {showPhotoPicker ? "Close Presets" : "Select Preset / Custom URL"}
                        </button>
                      </div>
                      <p className="text-[11px] font-mono text-zinc-400">
                        Supports SVG Bottts, Dicebear initial seeds, or custom hosted HTTPS images.
                      </p>
                    </div>
                  </div>

                  {/* Preset Avatar Selector Drawer */}
                  {showPhotoPicker && (
                    <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3 animate-in fade-in">
                      <div className="text-xs font-mono text-zinc-300">Choose an anomaly researcher icon:</div>
                      <div className="flex items-center gap-3 overflow-x-auto pb-2">
                        {avatarPresets.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setAvatarUrl(preset);
                            }}
                            className={`w-12 h-12 rounded-full p-0.5 border-2 transition-transform hover:scale-105 shrink-0 ${
                              avatarUrl === preset ? "border-cyan ring-2 ring-cyan/30" : "border-zinc-700"
                            }`}
                          >
                            <img src={preset} alt="preset" className="w-full h-full rounded-full object-cover bg-zinc-900" />
                          </button>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-zinc-400">Or enter image URL:</label>
                        <input
                          type="url"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-cyan"
                        />
                      </div>
                    </div>
                  )}

                  {/* Form Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Display Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-zinc-300">Display Name</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Aditya Kaushik"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 font-sans focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/30 transition-all"
                        required
                      />
                    </div>

                    {/* Username Handle */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-zinc-300">Username Handle</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-mono">@</span>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="weca_explorer"
                          className="w-full pl-7 pr-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/30 transition-all"
                          required
                        />
                      </div>
                    </div>

                    {/* Pronouns */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-zinc-300">Pronouns</label>
                      <input
                        type="text"
                        value={pronouns}
                        onChange={(e) => setPronouns(e.target.value)}
                        placeholder="they/them, he/him, she/her"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/30 transition-all"
                      />
                    </div>

                    {/* Status Note / Thought Bubble */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-zinc-300">Status Note (Thought Bubble)</label>
                      <input
                        type="text"
                        value={note}
                        maxLength={40}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g. Just curious..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/30 transition-all"
                      />
                    </div>

                    {/* Role / Tag */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-mono text-zinc-300">Observer Specialty / Role Tag</label>
                      <input
                        type="text"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        placeholder="e.g. Entrepreneur / Anomaly Investigator"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 font-sans focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/30 transition-all"
                      />
                    </div>

                    {/* Website Link */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-mono text-zinc-300">Website or Expedition Log Link</label>
                      <input
                        type="text"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://weca.ai"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/30 transition-all"
                      />
                    </div>

                    {/* Bio */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-mono text-zinc-300">Field Bio</label>
                        <span className="text-[10px] font-mono text-zinc-500">{bio.length}/200</span>
                      </div>
                      <textarea
                        value={bio}
                        maxLength={200}
                        rows={3}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Documenting anomalies..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 font-sans focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/30 transition-all leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* AI Creator Toggle Switch (Matching Reference Image 1) */}
                  <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-violet" />
                        <span>AI Vision Creator Mode</span>
                      </div>
                      <p className="text-[11px] font-mono text-zinc-400">
                        Displays the luminous AI Vision Creator badge on your public anomaly profile.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAiProfile(!isAiProfile)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isAiProfile ? "bg-violet shadow-lg shadow-violet/30" : "bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isAiProfile ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Save Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-semibold text-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-md flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Profile Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* ========================================================== */}
              {/* PANEL 2: AI VISION & SCORING                               */}
              {/* ========================================================== */}
              {activeTab === "ai-vision" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan" />
                      <span>Sensory Vision & Anomaly Appraisal Engine</span>
                    </h2>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      Configure the multi-modal neural models that evaluate absurdity, rarity, craft, novelty, and wit.
                    </p>
                  </div>

                  {/* Model Selector Cards */}
                  <div className="space-y-3">
                    <label className="text-xs font-mono text-zinc-300">Active Vision Inference Provider</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      
                      {/* Gemini 2.5 Flash */}
                      <div
                        onClick={() => setVisionEngine("gemini-2.5-flash")}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                          visionEngine === "gemini-2.5-flash"
                            ? "bg-violet/15 border-violet shadow-lg shadow-violet/20"
                            : "bg-zinc-950/70 border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">Gemini 2.5 Flash</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan/20 text-cyan">
                              Recommended
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 font-mono">
                            Multi-modal visual tensors with high dynamic sensitivity.
                          </p>
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500">Latency: ~420ms</div>
                      </div>

                      {/* Claude 3.5 Sonnet */}
                      <div
                        onClick={() => setVisionEngine("claude-3.5-sonnet")}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                          visionEngine === "claude-3.5-sonnet"
                            ? "bg-cyan/15 border-cyan shadow-lg shadow-cyan/20"
                            : "bg-zinc-950/70 border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">Claude 3.5 Sonnet</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                              Deep
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 font-mono">
                            Semantic reasoning on cultural absurdity and wit metrics.
                          </p>
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500">Latency: ~680ms</div>
                      </div>

                      {/* Local Neural Mock */}
                      <div
                        onClick={() => setVisionEngine("local-neural")}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                          visionEngine === "local-neural"
                            ? "bg-magenta/15 border-magenta shadow-lg shadow-magenta/20"
                            : "bg-zinc-950/70 border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">Local Neural Engine</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                              Offline
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 font-mono">
                            Deterministic heuristic simulator for test environments.
                          </p>
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500">Latency: ~15ms</div>
                      </div>

                    </div>
                  </div>

                  {/* Strictness Slider */}
                  <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono text-zinc-300">
                        Authenticity & Reality-Break Strictness
                      </label>
                      <span className="text-xs font-mono font-bold text-cyan">{strictness}%</span>
                    </div>

                    <input
                      type="range"
                      min={50}
                      max={100}
                      step={5}
                      value={strictness}
                      onChange={(e) => setStrictness(Number(e.target.value))}
                      className="w-full accent-cyan cursor-pointer"
                    />

                    <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                      <span>50% Permissive</span>
                      <span>85% Balanced Forensic</span>
                      <span>100% Reality Audit</span>
                    </div>

                    <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
                      Higher strictness penalizes synthetic generative artifacts, stock photo cues, and unverified post-processing filters.
                    </p>
                  </div>

                  {/* Auto-Score Toggle */}
                  <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white">Instant Upload Auto-Appraisal</div>
                      <p className="text-[11px] font-mono text-zinc-400">
                        Automatically dispatch newly uploaded anomalies to the vision pipeline upon upload.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAutoScore(!autoScore)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        autoScore ? "bg-cyan shadow-lg shadow-cyan/30" : "bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-zinc-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
                          autoScore ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Save Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveAiSettings}
                      className="px-6 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-semibold text-xs transition-all active:scale-[0.98] cursor-pointer shadow-md flex items-center gap-2"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Vision Parameters</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* PANEL 3: WEIRD CREDITS & WALLET                            */}
              {/* ========================================================== */}
              {activeTab === "wallet" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-400" />
                      <span>Weird Credits (WC) Vault & Rewards</span>
                    </h2>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      Weird Credits are the utility currency earned by uncovering rare sightings and winning community Versus battles.
                    </p>
                  </div>

                  {/* Balance Display Card */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/15 via-zinc-900 to-zinc-950 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
                    <div className="space-y-1 text-center sm:text-left">
                      <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                        Available Balance
                      </span>
                      <div className="text-3xl sm:text-4xl font-black font-mono text-white flex items-center justify-center sm:justify-start gap-2">
                        <Coins className="w-7 h-7 text-amber-400" />
                        <span>{currentWC}</span>
                        <span className="text-sm font-bold text-amber-400">WC</span>
                      </div>
                      <p className="text-xs font-mono text-zinc-400">
                        ≈ ${(currentWC * 0.1).toFixed(2)} USD Anomaly Sighting Valuation
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleClaimDaily}
                        disabled={dailyClaimed}
                        className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          dailyClaimed
                            ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
                            : "bg-amber-400 hover:bg-amber-300 text-zinc-950 shadow-lg shadow-amber-400/20 active:scale-95"
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>{dailyClaimed ? "Daily Bonus Claimed" : "Claim Daily Bonus (+10 WC)"}</span>
                      </button>

                      <Link
                        href="/wallet"
                        className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white transition-all flex items-center justify-center gap-1.5"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>Open Full Quantum Vault</span>
                      </Link>
                    </div>
                  </div>

                  {/* Cashout Threshold Status */}
                  <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-300">Cashout Threshold Progress</span>
                      <span className="text-cyan">{Math.min(100, Math.round((currentWC / 500) * 100))}% (500 WC Required)</span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                      <div
                        className="h-full bg-gradient-to-r from-cyan via-violet to-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (currentWC / 500) * 100)}%` }}
                      />
                    </div>

                    <p className="text-[11px] font-mono text-zinc-400">
                      Upon reaching 500 WC, you can redeem credits for physical anomaly prints, verified Hunter NFT stamps, or crypto transfers.
                    </p>
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* PANEL 4: ACCOUNT & SESSION                                 */}
              {/* ========================================================== */}
              {activeTab === "account" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-magenta" />
                      <span>Account Privacy & Session Management</span>
                    </h2>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      Control visibility, clear demo overrides, or end your authenticated explorer session.
                    </p>
                  </div>

                  {/* Privacy & Visibility Toggle */}
                  <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        {publicVisibility ? <Eye className="w-3.5 h-3.5 text-cyan" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-500" />}
                        <span>Public Discovery Ledger</span>
                      </div>
                      <p className="text-[11px] font-mono text-zinc-400">
                        Allow your anomaly captures to be featured on the global feed and interactive radar map.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPublicVisibility(!publicVisibility)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        publicVisibility ? "bg-cyan shadow-lg shadow-cyan/30" : "bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-zinc-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
                          publicVisibility ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Micro-animations Toggle */}
                  <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-violet" />
                        <span>Haptic Micro-Animations & Confetti</span>
                      </div>
                      <p className="text-[11px] font-mono text-zinc-400">
                        Enable canvas particles and celebratory visual feedback when saving sightings or earning credits.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMicroAnimations(!microAnimations)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        microAnimations ? "bg-violet shadow-lg shadow-violet/30" : "bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          microAnimations ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Reset Demo State */}
                  <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                          <span>Reset Demo Overrides</span>
                        </div>
                        <p className="text-[11px] font-mono text-zinc-400">
                          Restores profile bio, custom avatar, and AI parameters back to initial showcase baseline.
                        </p>
                      </div>

                      {showResetConfirm ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowResetConfirm(false)}
                            className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-mono hover:bg-zinc-700"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleResetDemo}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 text-xs font-semibold hover:bg-amber-400"
                          >
                            Confirm Reset
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowResetConfirm(true)}
                          className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-amber-400 transition-colors cursor-pointer"
                        >
                          Reset Demo
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sign Out Section */}
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Terminate Session</span>
                      </div>
                      <p className="text-[11px] font-mono text-zinc-400">
                        Sign out of this workstation and return to login screen.
                      </p>
                    </div>

                    {showLogoutConfirm ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowLogoutConfirm(false)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-mono hover:bg-zinc-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                        >
                          Log Out Now
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowLogoutConfirm(true)}
                        className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-semibold text-rose-300 transition-colors cursor-pointer"
                      >
                        Sign Out
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>
          </section>

        </div>
      </main>
    </div>
  );
};
