"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Plus, LogOut, User as UserIcon } from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-semibold text-base tracking-tight text-zinc-900 dark:text-white">
              weca
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
              phase 1
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-4 text-xs font-medium">
            <Link
              href="/"
              className={`transition-colors ${
                isActive("/")
                  ? "text-zinc-900 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Feed
            </Link>
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Upload Button */}
          <Link
            href="/upload"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-medium transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload</span>
          </Link>

          {profile || user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
              <Link
                href="/profile"
                className="flex items-center gap-2 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                title="Your Profile"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="w-6 h-6 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 text-xs">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
                <span className="hidden md:inline text-xs text-zinc-700 dark:text-zinc-300 font-mono">
                  @{profile?.username || "user"}
                </span>
              </Link>

              <button
                onClick={() => signOut()}
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-2.5 py-1.5 text-xs font-medium text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 rounded-lg transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
