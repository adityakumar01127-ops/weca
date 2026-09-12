"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/brand/Logo";
import { 
  Plus, 
  Sparkles, 
  LogOut, 
  User as UserIcon, 
  Swords, 
  Globe2, 
  FolderTree, 
  Trophy, 
  Flame, 
  Wallet, 
  Menu, 
  X,
  Star,
  ChevronRight
} from "lucide-react";

import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface HeaderProps {
  onOpenUpload: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenUpload }) => {
  const { user, openAuthModal, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const navLinks = [
    { label: "Feed", href: "/" },
    { label: "Versus", href: "/versus", badge: "Live", badgeColor: "bg-magenta text-white" },
    { label: "Map", href: "/map" },
    { label: "Directory", href: "/directory" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "Challenges", href: "/challenges" },
    { label: "Pro", href: "/pro", badge: "New", badgeColor: "bg-violet/20 text-violet" },
  ];

  const isActive = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-2 shrink-0">
            <Logo size={30} showWordmark={true} />
            <span className="hidden xl:inline-flex items-center text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              v0.2.0
            </span>
          </Link>

          {/* Desktop Primary Navigation Bar */}
          <nav className="hidden lg:flex items-center gap-1 font-mono text-xs">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    active
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${link.badgeColor}`}>
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
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-semibold tracking-wide transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-cyan" />
            <span className="hidden sm:inline">Upload Photo</span>
            <span className="sm:hidden">Upload</span>
          </button>

          {/* User Account / Profile */}
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
              {/* Weird Credits Link to Wallet */}
              <Link
                href="/wallet"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan/10 border border-cyan/30 text-cyan text-xs font-mono font-bold tracking-tight hover:bg-cyan/15 transition-colors"
                title="Open Weird Credits Wallet"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan" />
                <span>{user.total_wc || 0} WC</span>
              </Link>

              {/* Profile Link */}
              <Link
                href={`/profile/${user.username}`}
                className="flex items-center gap-1.5 p-1 pl-1.5 pr-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all text-xs font-medium text-zinc-900 dark:text-zinc-100"
              >
                <img
                  src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`}
                  alt={user.username}
                  className="w-7 h-7 rounded-full object-cover bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-200 dark:ring-zinc-700"
                />
                <span className="hidden md:inline font-mono text-zinc-700 dark:text-zinc-300">@{user.username}</span>
              </Link>

              {/* Sign out */}
              <button
                onClick={() => signOut()}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Sign Out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/wallet"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-mono transition-colors"
                title="Rewards Wallet"
              >
                <Wallet className="w-3.5 h-3.5 text-violet" />
                <span>Wallet</span>
              </Link>

              <button
                onClick={openAuthModal}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-medium transition-colors cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <span>Sign In</span>
              </button>
            </div>
          )}

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-200 bg-white px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  isActive(link.href)
                    ? "bg-zinc-100 border-zinc-300 font-bold text-ink"
                    : "bg-zinc-50/60 border-zinc-200 text-zinc-700"
                }`}
              >
                <span>{link.label}</span>
                {link.badge ? (
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${link.badgeColor}`}>
                    {link.badge}
                  </span>
                ) : (
                  <ChevronRight className="w-3 h-3 text-zinc-400" />
                )}
              </Link>
            ))}
          </div>

          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs font-mono text-zinc-500">
            <Link
              href="/wallet"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-1.5 text-violet font-semibold"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Weird Credits Wallet</span>
            </Link>

            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="text-zinc-600 hover:text-ink"
            >
              About Wica →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
