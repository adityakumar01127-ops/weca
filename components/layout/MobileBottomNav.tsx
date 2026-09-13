"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Compass, Swords, Trophy, User as UserIcon, Plus } from "lucide-react";
import { CreatePostModal } from "@/components/upload/CreatePostModal";

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { user, profile, openAuthModal } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  const handleUploadClick = () => {
    if (!user && !profile) {
      openAuthModal();
      return;
    }
    setIsCreateOpen(true);
  };

  // Hide the bottom dock when inside messaging or on auth/compliance pages
  if (
    pathname.startsWith("/messages") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/cancellation-and-refund") ||
    pathname.startsWith("/contact")
  ) {
    return null;
  }

  return (
    <>
      {/* Mobile Persistent App Dock */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/92 dark:bg-[#09090b]/92 backdrop-blur-2xl border-t border-zinc-200/80 dark:border-zinc-800/80 transition-colors duration-200 select-none"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom, 10px), 10px)",
        }}
      >
        <div className="max-w-md mx-auto px-3 h-14 flex items-center justify-around">
          {/* 1. Feed / Explore */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center w-14 h-full relative transition-all active:scale-90 ${
              isActive("/")
                ? "text-violet dark:text-white"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Compass className={`w-5 h-5 ${isActive("/") ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
            <span className="text-[10px] font-medium tracking-tight mt-0.5">Feed</span>
            {isActive("/") && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-violet dark:bg-white" />
            )}
          </Link>

          {/* 2. Versus Arena */}
          <Link
            href="/versus"
            className={`flex flex-col items-center justify-center w-14 h-full relative transition-all active:scale-90 ${
              isActive("/versus")
                ? "text-magenta dark:text-white"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <div className="relative">
              <Swords className={`w-5 h-5 ${isActive("/versus") ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[8px] font-mono font-bold bg-magenta text-white leading-none">
                VS
              </span>
            </div>
            <span className="text-[10px] font-medium tracking-tight mt-0.5">Versus</span>
            {isActive("/versus") && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-magenta dark:bg-white" />
            )}
          </Link>

          {/* 3. Center Action: Camera / Upload */}
          <div className="relative -top-2 flex flex-col items-center">
            <button
              type="button"
              id="mobile-dock-post-btn"
              onClick={handleUploadClick}
              className="p-[2.5px] rounded-full bg-gradient-to-tr from-violet via-fuchsia-500 to-amber-400 shadow-lg shadow-violet/20 hover:shadow-violet/40 transition-all active:scale-90 cursor-pointer"
              aria-label="Upload anomaly photograph"
            >
              <div className="w-11 h-11 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center transition-transform">
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </div>
            </button>
            <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 tracking-tight mt-0.5 font-semibold">
              Post
            </span>
          </div>

          {/* 4. Leaderboard */}
          <Link
            href="/leaderboard"
            className={`flex flex-col items-center justify-center w-14 h-full relative transition-all active:scale-90 ${
              isActive("/leaderboard")
                ? "text-amber-500 dark:text-white"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Trophy className={`w-5 h-5 ${isActive("/leaderboard") ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
            <span className="text-[10px] font-medium tracking-tight mt-0.5">Ranks</span>
            {isActive("/leaderboard") && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-500 dark:bg-white" />
            )}
          </Link>

          {/* 5. Profile / Account */}
          <Link
            href={user ? "/profile" : "/login"}
            className={`flex flex-col items-center justify-center w-14 h-full relative transition-all active:scale-90 ${
              isActive("/profile") || isActive("/login")
                ? "text-zinc-900 dark:text-white"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            {profile?.avatar_url || user?.avatar_url ? (
              <div
                className={`w-5 h-5 rounded-full overflow-hidden border ${
                  isActive("/profile")
                    ? "border-zinc-900 dark:border-white ring-1 ring-zinc-900 dark:ring-white"
                    : "border-zinc-300 dark:border-zinc-700"
                }`}
              >
                <img
                  src={profile?.avatar_url || user?.avatar_url || ""}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <UserIcon className={`w-5 h-5 ${isActive("/profile") ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
            )}
            <span className="text-[10px] font-medium tracking-tight mt-0.5">
              {user ? "Profile" : "Log In"}
            </span>
            {(isActive("/profile") || isActive("/login")) && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-zinc-900 dark:bg-white" />
            )}
          </Link>
        </div>
      </nav>

      {/* Upload Modal (Triggered by Center Action) */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </>
  );
};
