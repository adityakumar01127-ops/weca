"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { 
  Search, 
  User as UserIcon, 
  Bell, 
  Lock, 
  Users, 
  ShieldAlert, 
  MapPin, 
  MessageSquare, 
  Tag, 
  MessageCircle, 
  Share2, 
  EyeOff, 
  Sliders, 
  Heart, 
  Sparkles, 
  Download, 
  Globe, 
  HelpCircle, 
  ShieldCheck, 
  Activity, 
  ChevronRight, 
  Check, 
  ArrowLeft,
  Camera,
  ExternalLink,
  Info,
  Layers,
  ChevronDown
} from "lucide-react";

type SettingsTab = 
  | "edit-profile" 
  | "notifications" 
  | "privacy" 
  | "comments" 
  | "downloading" 
  | "language" 
  | "verified" 
  | "help";

export const SettingsView: React.FC = () => {
  const router = useRouter();
  const { user, updateProfile, openAuthModal } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>("edit-profile");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Edit Profile Form State
  const [displayName, setDisplayName] = useState<string>(user?.display_name || user?.username || "spiritual");
  const [website, setWebsite] = useState<string>(user?.website || "");
  const [bio, setBio] = useState<string>(user?.bio || "spiritual");
  const [isAiProfile, setIsAiProfile] = useState<boolean>(user?.is_ai_profile || false);
  const [gender, setGender] = useState<string>(user?.gender || "Prefer not to say");
  const [showSuggestions, setShowSuggestions] = useState<boolean>(user?.show_suggestions ?? true);
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatar_url || "");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  // Avatar presets for easy change demonstration
  const [showPhotoPicker, setShowPhotoPicker] = useState<boolean>(false);
  const avatarPresets = [
    "https://api.dicebear.com/7.x/bottts/svg?seed=spiritual",
    "https://api.dicebear.com/7.x/bottts/svg?seed=explorer",
    "https://api.dicebear.com/7.x/bottts/svg?seed=anomaly",
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateProfile({
        display_name: displayName,
        website,
        bio,
        is_ai_profile: isAiProfile,
        gender,
        show_suggestions: showSuggestions,
        avatar_url: avatarUrl || user?.avatar_url,
      });
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const navItems = [
    {
      section: "How you use Wica",
      items: [
        { id: "edit-profile" as SettingsTab, label: "Edit Profile", icon: <UserIcon className="w-5 h-5" /> },
        { id: "notifications" as SettingsTab, label: "Notifications", icon: <Bell className="w-5 h-5" /> },
      ],
    },
    {
      section: "Who can see your content",
      items: [
        { id: "privacy" as SettingsTab, label: "Account privacy", icon: <Lock className="w-5 h-5" /> },
        { id: "privacy" as SettingsTab, label: "Trusted Hunters", icon: <Users className="w-5 h-5" /> },
        { id: "privacy" as SettingsTab, label: "Blocked", icon: <EyeOff className="w-5 h-5" /> },
        { id: "privacy" as SettingsTab, label: "Story and location", icon: <MapPin className="w-5 h-5" /> },
      ],
    },
    {
      section: "How others can interact with you",
      items: [
        { id: "comments" as SettingsTab, label: "Messages and anomaly replies", icon: <MessageSquare className="w-5 h-5" /> },
        { id: "comments" as SettingsTab, label: "Tags and mentions", icon: <Tag className="w-5 h-5" /> },
        { id: "comments" as SettingsTab, label: "Comments", icon: <MessageCircle className="w-5 h-5" /> },
        { id: "comments" as SettingsTab, label: "Sharing and reuse", icon: <Share2 className="w-5 h-5" /> },
      ],
    },
    {
      section: "What you see",
      items: [
        { id: "edit-profile" as SettingsTab, label: "Muted accounts", icon: <EyeOff className="w-5 h-5" /> },
        { id: "edit-profile" as SettingsTab, label: "Content preferences", icon: <Sliders className="w-5 h-5" /> },
        { id: "edit-profile" as SettingsTab, label: "Like and score counts", icon: <Heart className="w-5 h-5" /> },
      ],
    },
    {
      section: "Your app and media",
      items: [
        { id: "downloading" as SettingsTab, label: "Archiving and downloading", icon: <Download className="w-5 h-5" /> },
        { id: "language" as SettingsTab, label: "Language", icon: <Globe className="w-5 h-5" /> },
      ],
    },
    {
      section: "For professionals",
      items: [
        { id: "verified" as SettingsTab, label: "Wica Verified", icon: <ShieldCheck className="w-5 h-5" /> },
      ],
    },
    {
      section: "More info and support",
      items: [
        { id: "help" as SettingsTab, label: "Help", icon: <HelpCircle className="w-5 h-5" /> },
        { id: "help" as SettingsTab, label: "Account Status", icon: <Activity className="w-5 h-5" /> },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900">
      <Header onOpenUpload={() => {}} />

      {/* Success Notification */}
      {showSuccessToast && (
        <div className="fixed top-20 right-6 z-50 animate-bounce flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 text-white shadow-xl text-xs font-mono">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Profile saved successfully!</span>
        </div>
      )}

      {/* Photo Picker Modal */}
      {showPhotoPicker && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200">
            <h3 className="font-display font-bold text-lg text-zinc-900 mb-2">
              Select Profile Picture
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Choose an avatar preset or enter a custom image URL:
            </p>

            <div className="grid grid-cols-5 gap-2 mb-4">
              {avatarPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setAvatarUrl(preset);
                    setShowPhotoPicker(false);
                  }}
                  className="w-12 h-12 rounded-full border-2 hover:border-violet overflow-hidden p-0.5"
                >
                  <img src={preset} alt="preset" className="w-full h-full rounded-full object-cover" />
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Paste custom image URL..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-lg mb-4 outline-none focus:ring-1 focus:ring-violet"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPhotoPicker(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="border border-zinc-200 rounded-2xl bg-white shadow-xs overflow-hidden flex flex-col md:flex-row min-h-[750px]">
          {/* ============================================================ */}
          {/* LEFT COLUMN: SETTINGS NAVIGATION SIDEBAR                    */}
          {/* ============================================================ */}
          <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r border-zinc-200 p-4 sm:p-6 flex flex-col justify-between shrink-0 bg-white">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-xl text-zinc-900">Settings</h2>
                {user && (
                  <Link
                    href={`/profile/${user.username}`}
                    className="text-xs font-mono text-violet hover:underline flex items-center gap-1"
                  >
                    <span>View Profile</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-100 text-xs text-zinc-800 placeholder-zinc-400 outline-none focus:ring-1 focus:ring-zinc-300"
                />
              </div>

              {/* Accounts Centre Card (Instagram / Meta style) */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
                  <span className="w-4 h-4 rounded-full bg-violet/20 flex items-center justify-center text-[10px] text-violet font-mono">
                    W
                  </span>
                  <span>Wica Accounts Centre</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-tight">
                  Password, security, personal details, connected experiences, ad preferences
                </p>
              </div>

              {/* Navigation Items Grouped */}
              <div className="space-y-6 text-xs max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                {navItems.map((group, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="font-mono text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-3 mb-1">
                      {group.section}
                    </div>
                    {group.items.map((item, itemIdx) => {
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={itemIdx}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                            isActive
                              ? "bg-zinc-100 font-bold text-zinc-900"
                              : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                          }`}
                        >
                          <span className={isActive ? "text-zinc-900" : "text-zinc-500"}>
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* ============================================================ */}
          {/* RIGHT COLUMN: MAIN CONTENT PANEL                            */}
          {/* ============================================================ */}
          <section className="flex-1 p-6 sm:p-10 bg-white overflow-y-auto">
            {activeTab === "edit-profile" && (
              <div className="max-w-xl space-y-8">
                <h1 className="font-display font-bold text-2xl text-zinc-900">
                  Edit Profile
                </h1>

                {/* Profile Box matching Screenshot 2 */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-100/90 border border-zinc-200">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-200 ring-2 ring-zinc-300">
                      <img
                        src={
                          avatarUrl ||
                          user?.avatar_url ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id || "spiritual"}`
                        }
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900">
                        {user?.username || "spiritualinsights001"}
                      </h3>
                      <p className="text-xs text-zinc-500 font-mono">
                        {displayName || "spiritual"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPhotoPicker(true)}
                    className="px-4 py-2 rounded-xl bg-violet hover:bg-violet/90 text-white font-semibold text-xs transition-all active:scale-95 shadow-xs cursor-pointer"
                  >
                    Change photo
                  </button>
                </div>

                {/* Main Form matching Screenshot 2, 3, 4 */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Website Field */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-xs text-zinc-900 block">
                      Website
                    </label>
                    <input
                      type="text"
                      placeholder="Website URL"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-violet"
                    />
                    <p className="text-[11px] text-zinc-400 leading-tight">
                      Editing your links is available on desktop & mobile. Links will appear on your public Wica profile.
                    </p>
                  </div>

                  {/* Bio Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-xs text-zinc-900">
                        Bio
                      </label>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {bio.length} / 150
                      </span>
                    </div>
                    <textarea
                      maxLength={150}
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Bio..."
                      className="w-full p-3.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-violet resize-none"
                    />
                  </div>

                  {/* AI-Generated Profile Toggle matching Screenshot 2 & 3 */}
                  <div className="p-4 rounded-2xl border border-zinc-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-zinc-900">
                        AI-generated profile
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAiProfile}
                          onChange={(e) => setIsAiProfile(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet" />
                      </label>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Add this label if your profile features an AI-generated persona.{" "}
                      <Link href="/anomaly-guidelines" className="text-violet hover:underline">
                        Learn more
                      </Link>
                    </p>
                  </div>

                  {/* Gender Field matching Screenshot 2 & 3 */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-xs text-zinc-900 block">
                      Gender
                    </label>
                    <div className="relative">
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full appearance-none px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-violet"
                      >
                        <option value="Prefer not to say">Prefer not to say</option>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Custom">Custom</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      This won&apos;t be part of your public profile.
                    </p>
                  </div>

                  {/* Show Account Suggestions on Profiles Toggle matching Screenshot 3 */}
                  <div className="p-4 rounded-2xl border border-zinc-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-zinc-900">
                        Show account suggestions on profiles
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showSuggestions}
                          onChange={(e) => setShowSuggestions(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet" />
                      </label>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Choose whether people can see similar anomaly observer suggestions on your profile, and whether your account can be suggested on other profiles.
                    </p>
                  </div>

                  <p className="text-[11px] text-zinc-500 leading-relaxed pt-2">
                    Certain profile info, such as your name, bio and links, is visible to everyone.{" "}
                    <Link href="/privacy" className="text-violet hover:underline">
                      See what profile info is visible
                    </Link>
                  </p>

                  {/* Primary Submit Button matching Screenshot 3 */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-violet hover:bg-violet/90 disabled:opacity-50 text-white font-semibold text-xs tracking-wide shadow-sm transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving changes...</span>
                      </span>
                    ) : (
                      <span>Submit</span>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* SECONDARY PANEL: NOTIFICATIONS */}
            {activeTab === "notifications" && (
              <div className="max-w-xl space-y-6">
                <h2 className="font-display font-bold text-2xl text-zinc-900">Notifications</h2>
                <div className="divide-y divide-zinc-200 text-xs">
                  <div className="py-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-zinc-900">New Anomaly Scored</div>
                      <div className="text-zinc-500 text-[11px]">Receive push alerts when Gemini Vision finishes rating your photo.</div>
                    </div>
                    <input type="checkbox" defaultChecked className="accent-violet" />
                  </div>
                  <div className="py-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-zinc-900">Versus Battle Outcomes</div>
                      <div className="text-zinc-500 text-[11px]">Alert when a battle you voted on reaches 24 hours.</div>
                    </div>
                    <input type="checkbox" defaultChecked className="accent-violet" />
                  </div>
                  <div className="py-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-zinc-900">Weekly Challenge Bounties</div>
                      <div className="text-zinc-500 text-[11px]">Notify every Monday when a new theme is announced.</div>
                    </div>
                    <input type="checkbox" defaultChecked className="accent-violet" />
                  </div>
                </div>
              </div>
            )}

            {/* SECONDARY PANEL: PRIVACY */}
            {activeTab === "privacy" && (
              <div className="max-w-xl space-y-6">
                <h2 className="font-display font-bold text-2xl text-zinc-900">Account Privacy</h2>
                <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-2 text-xs">
                  <div className="font-bold text-zinc-900">Public Archive Ledger</div>
                  <p className="text-zinc-600 text-[11px] leading-relaxed">
                    By design, verified candid anomalies are indexed to the public global ledger for scientific and cultural documentation. Exact GPS coordinates are automatically blurred to city-level precision for privacy.
                  </p>
                </div>
              </div>
            )}

            {/* SECONDARY PANEL: DOWNLOADING */}
            {activeTab === "downloading" && (
              <div className="max-w-xl space-y-6">
                <h2 className="font-display font-bold text-2xl text-zinc-900">Archiving & Downloading</h2>
                <div className="p-4 rounded-xl border border-zinc-200 text-xs space-y-3">
                  <div className="font-bold text-zinc-900">4K Original Uncompressed Photos</div>
                  <p className="text-zinc-500 text-[11px]">
                    Hunter Pro accounts can batch-download optical master files and raw vision tensor data.
                  </p>
                  <Link
                    href="/pro"
                    className="inline-block px-4 py-2 rounded-lg bg-zinc-900 text-white font-mono text-xs font-bold"
                  >
                    View Pro Features
                  </Link>
                </div>
              </div>
            )}

            {/* SECONDARY PANEL: HELP */}
            {activeTab === "help" && (
              <div className="max-w-xl space-y-6">
                <h2 className="font-display font-bold text-2xl text-zinc-900">Help & Support</h2>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Need assistance with your anomaly submission, Gemini Vision score review, or Weird Credits wallet?
                </p>
                <div className="space-y-2 text-xs font-mono">
                  <Link href="/community-guidelines" className="p-3 rounded-xl border border-zinc-200 block hover:bg-zinc-50 text-violet font-bold">
                    → Community Guidelines
                  </Link>
                  <Link href="/anomaly-guidelines" className="p-3 rounded-xl border border-zinc-200 block hover:bg-zinc-50 text-violet font-bold">
                    → Anomaly Guidelines
                  </Link>
                  <Link href="/learn-more" className="p-3 rounded-xl border border-zinc-200 block hover:bg-zinc-50 text-violet font-bold">
                    → Contact Support Team
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* BOTTOM FOOTER MATCHING SCREENSHOT 2, 3, 4 */}
        <footer className="mt-12 text-center space-y-4 text-[11px] text-zinc-400 font-mono">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link href="/about" className="hover:text-zinc-600">About</Link>
            <Link href="/scoring-engine" className="hover:text-zinc-600">Scoring Engine</Link>
            <Link href="/help" className="hover:text-zinc-600">Help</Link>
            <Link href="/gemini-vision-api" className="hover:text-zinc-600">API</Link>
            <Link href="/privacy" className="hover:text-zinc-600">Privacy</Link>
            <Link href="/terms" className="hover:text-zinc-600">Terms</Link>
            <Link href="/map" className="hover:text-zinc-600">Locations</Link>
            <Link href="/pro" className="hover:text-zinc-600">Wica Verified</Link>
          </div>

          <div className="flex items-center justify-center gap-4 text-zinc-400">
            <span>English (US)</span>
            <span>© 2026 Wica from Meta / Wica Inc.</span>
          </div>
        </footer>
      </main>

      {/* Floating Messages Bubble matching Screenshot 1 & 2 */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => alert("Direct messaging inbox demonstration")}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-white border border-zinc-300 text-zinc-900 font-semibold text-xs shadow-xl hover:bg-zinc-50 transition-all active:scale-95 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 text-zinc-700" />
          <span>Messages</span>
        </button>
      </div>
    </div>
  );
};
