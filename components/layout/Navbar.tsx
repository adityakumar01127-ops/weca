"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Plus, Swords, Trophy, Wallet, LogOut, User as UserIcon, Menu, X, Sparkles } from "lucide-react";
import { CreatePostModal } from "@/components/upload/CreatePostModal";

export const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
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
    { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { label: "Wallet", href: "/wallet", icon: Wallet },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#09090b]/85 backdrop-blur-md border-b border-zinc-800/80 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Brand & Primary Navigation */}
          <div className="flex items-center gap-6 sm:gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="font-bold text-base tracking-tight text-white group-hover:opacity-80 transition-opacity">
                weca
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                phase 3
              </span>
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
                        ? "text-white bg-zinc-800/80 font-semibold border border-zinc-700/50"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5 opacity-70" />}
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Upload Button */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-medium transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>

            {/* User Account / Profile */}
            {profile || user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
                {/* Credits Balance link */}
                {profile?.credits_balance !== undefined && (
                  <Link
                    href="/wallet"
                    className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/90 text-[11px] font-mono text-zinc-300 hover:border-zinc-700 border border-zinc-700/60 transition-colors"
                    title="Weird Credits Wallet"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>{profile.credits_balance} WC</span>
                  </Link>
                )}

                <Link
                  href="/profile"
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-zinc-900 transition-colors"
                  title="Your Profile"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.username}
                      className="w-6 h-6 rounded-full object-cover border border-zinc-800"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 text-xs">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <span className="hidden sm:inline text-xs text-zinc-300 font-mono">
                    @{profile?.username || "user"}
                  </span>
                </Link>

                <button
                  onClick={() => signOut()}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
                <Link
                  href="/login"
                  className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-2.5 py-1.5 text-xs font-medium text-white border border-zinc-700 hover:border-zinc-500 rounded-lg transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800 bg-[#09090b]/95 backdrop-blur-md px-4 py-3 space-y-1">
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
                      ? "bg-zinc-800 text-white font-semibold border border-zinc-700/50"
                      : "text-zinc-400 hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-4 h-4 opacity-70" />}
                    <span>{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            {/* Mobile Upload Action */}
            <div className="pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsCreateModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 transition-colors cursor-pointer"
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
