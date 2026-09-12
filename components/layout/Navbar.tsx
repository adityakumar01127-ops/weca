"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Plus, Swords, Trophy, Wallet, LogOut, User as UserIcon, Menu, X, Sparkles, Settings as SettingsIcon, Globe2, BookOpen } from "lucide-react";
import { CreatePostModal } from "@/components/upload/CreatePostModal";
import { Logo } from "@/components/brand/Logo";

export const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  const navLinks = [
    { label: "Feed", href: "/", icon: null },
    { label: "Versus", href: "/versus", icon: Swords, badge: "Live" },
    { label: "Map", href: "/map", icon: Globe2 },
    { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { label: "Directory", href: "/directory", icon: BookOpen },
    { label: "Wallet", href: "/wallet", icon: Wallet },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/85 dark:bg-[#09090b]/85 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Brand & Primary Navigation */}
          <div className="flex items-center gap-6 sm:gap-8">
            <Link href="/" className="flex items-center group py-1">
              <Logo size={28} showWordmark={true} dark={resolvedTheme === "dark"} className="transition-opacity group-hover:opacity-90" />
            </Link>

            {/* Desktop Links */}
            <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors ${
                      active
                        ? "text-zinc-950 dark:text-white bg-zinc-100 dark:bg-zinc-800/80 font-semibold border border-zinc-200 dark:border-zinc-700/50"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/40"
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5 opacity-70" />}
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Settings Link (Hosts Appearance & Theme Toggle) */}
            <Link
              href="/settings"
              className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Settings & Appearance"
              aria-label="Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </Link>

            {/* Upload Button */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-xs font-medium transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>

            {/* User Account / Profile */}
            {profile || user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
                {/* Credits Balance link */}
                {profile?.credits_balance !== undefined && (
                  <Link
                    href="/wallet"
                    className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/90 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 border border-zinc-200 dark:border-zinc-700/60 transition-colors"
                    title="Weird Credits Wallet"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>{profile.credits_balance} WC</span>
                  </Link>
                )}

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
                  <span className="hidden sm:inline text-xs text-zinc-700 dark:text-zinc-300 font-mono">
                    @{profile?.username || "user"}
                  </span>
                </Link>

                <button
                  onClick={() => signOut()}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
                <Link
                  href="/login"
                  className="px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-2.5 py-1.5 text-xs font-medium text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 rounded-lg transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-md px-4 py-3 space-y-2">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold border border-zinc-200 dark:border-zinc-700/50"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-4 h-4 opacity-70" />}
                    <span>{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Mobile Settings Link */}
            <div className="pt-2 pb-1 border-t border-zinc-200 dark:border-zinc-800">
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <SettingsIcon className="w-4 h-4 opacity-70" />
                  <span>Settings & Appearance</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">Theme</span>
              </Link>
            </div>

            {/* Mobile Upload Action */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsCreateModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Photograph</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Global Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
};
