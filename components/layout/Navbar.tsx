"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Plus, Swords, Trophy, Wallet, LogOut, User as UserIcon, Menu, X, Sparkles, Globe2, BookOpen, MessageCircle } from "lucide-react";
import { CreatePostModal } from "@/components/upload/CreatePostModal";
import { Logo } from "@/components/brand/Logo";
import { getTotalUnreadCount } from "@/lib/messages";

export const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  React.useEffect(() => {
    const updateCount = () => {
      setUnreadCount(getTotalUnreadCount());
    };
    updateCount();

    window.addEventListener("weca_messages_updated", updateCount);
    window.addEventListener("storage", updateCount);
    return () => {
      window.removeEventListener("weca_messages_updated", updateCount);
      window.removeEventListener("storage", updateCount);
    };
  }, []);

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

  // Hide top navigation when in messaging system (has its own dedicated header)
  if (pathname.startsWith("/messages")) {
    return null;
  }

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800/80 transition-colors"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Brand & Primary Navigation */}
          <div className="flex items-center gap-6 sm:gap-8">
            <Link href="/" className="flex items-center group py-1">
              <Logo size={28} showWordmark={true} dark={resolvedTheme === "dark"} className="transition-opacity group-hover:opacity-90" />
            </Link>

            {/* Desktop Links (lg and above to ensure 0 overflow on tablet 768px) */}
            <nav className="hidden lg:flex items-center gap-1 text-xs font-medium">
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
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Strategic Global Messages Link (Desktop, Tablet & Mobile) */}
            <Link
              href="/messages"
              id="global-messages-btn"
              className="relative w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 active:scale-95 transition-all cursor-pointer select-none"
              style={{ touchAction: "manipulation" }}
              title="Messages"
              aria-label="Direct Messages"
            >
              <MessageCircle className="w-[22px] h-[22px] sm:w-4 sm:h-4" />
              {unreadCount > 0 && (
                <span
                  id="navbar-unread-badge"
                  className="pointer-events-none absolute top-0.5 right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-violet text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-xs border-2 border-white dark:border-[#09090b] animate-in zoom-in-50"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Desktop Upload Button (Mobile uses the center dock action) */}
            <button
              type="button"
              id="navbar-upload-btn"
              onClick={() => setIsCreateModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-white dark:bg-white dark:hover:bg-zinc-200 dark:active:bg-zinc-300 dark:text-zinc-950 text-xs font-medium transition-all shadow-xs cursor-pointer min-h-[44px]"
              style={{ touchAction: "manipulation" }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>

            {/* User Account / Profile */}
            {profile || user ? (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
                {/* Credits Balance link */}
                {profile?.credits_balance !== undefined && (
                  <Link
                    href="/wallet"
                    className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/90 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 border border-zinc-200 dark:border-zinc-700/60 transition-colors"
                    title="Weird Credits Wallet"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>{profile.credits_balance} WC</span>
                  </Link>
                )}

                <Link
                  href="/profile"
                  className="hidden sm:flex items-center gap-2 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors min-h-[36px]"
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
                  className="hidden sm:inline-flex p-2 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
                <Link
                  href="/login"
                  className="px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors min-h-[36px] flex items-center"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-2.5 py-1.5 text-xs font-medium text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 rounded-lg transition-colors min-h-[36px] flex items-center"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile / Tablet Menu Button */}
            <button
              type="button"
              id="navbar-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-11 h-11 flex items-center justify-center rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 active:scale-95 transition-all cursor-pointer select-none"
              style={{ touchAction: "manipulation" }}
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-[22px] h-[22px]" /> : <Menu className="w-[22px] h-[22px]" />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Menu Dropdown */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay to close menu on tap outside */}
            <div
              className="lg:hidden fixed inset-0 top-14 bg-black/20 dark:bg-black/40"
              style={{ paddingTop: "env(safe-area-inset-top, 0px)", touchAction: "manipulation" }}
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="lg:hidden relative border-t border-zinc-200 dark:border-zinc-800 bg-white/98 dark:bg-[#09090b]/98 backdrop-blur-xl px-4 py-3 space-y-1.5 shadow-xl shadow-black/10 dark:shadow-black/30 animate-in slide-in-from-top-1 duration-150">
              {/* Global Messages in Mobile Menu */}
              <Link
                href="/messages"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-xl text-sm min-h-[48px] transition-all active:scale-[0.98] active:bg-zinc-200 dark:active:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 select-none"
                style={{ touchAction: "manipulation" }}
              >
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 opacity-80" />
                  <span className="font-medium">Direct Messages</span>
                </div>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet text-white">
                    {unreadCount} unread
                  </span>
                )}
              </Link>
              {navLinks.map((link) => {
                const active = isActive(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm min-h-[48px] transition-all active:scale-[0.98] select-none ${
                      active
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold border border-zinc-200 dark:border-zinc-700/50"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 active:bg-zinc-200 dark:active:bg-zinc-700"
                    }`}
                    style={{ touchAction: "manipulation" }}
                  >
                    <div className="flex items-center gap-3">
                      {Icon && <Icon className="w-5 h-5 opacity-80" />}
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

              {/* Logout on mobile menu if logged in */}
              {(user || profile) && (
                <div className="pt-2 mt-1 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 active:bg-rose-100 dark:active:bg-rose-950/50 active:scale-[0.98] transition-all cursor-pointer min-h-[48px] select-none"
                    style={{ touchAction: "manipulation" }}
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </>
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
