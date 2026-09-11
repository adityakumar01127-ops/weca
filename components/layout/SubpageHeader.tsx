"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { 
  Compass, 
  Sparkles, 
  BookOpen, 
  Swords, 
  Globe2, 
  Wallet, 
  Menu, 
  X,
  ChevronRight 
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface SubpageHeaderProps {
  currentPage?: string;
  category?: string;
}

export const SubpageHeader: React.FC<SubpageHeaderProps> = ({
  currentPage,
  category = "Documentation",
}) => {
  const { user, openAuthModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const navLinks = [
    { label: "Feed", href: "/", icon: <Compass className="w-3.5 h-3.5 text-violet" /> },
    { label: "Versus", href: "/versus", icon: <Swords className="w-3.5 h-3.5 text-magenta" /> },
    { label: "Map", href: "/map", icon: <Globe2 className="w-3.5 h-3.5 text-cyan" /> },
    { label: "Directory", href: "/directory", icon: <BookOpen className="w-3.5 h-3.5 text-zinc-500" /> },
    { label: "Wallet", href: "/wallet", icon: <Wallet className="w-3.5 h-3.5 text-emerald-500" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand + Breadcrumb */}
        <div className="flex items-center gap-3">
          <Link href="/" className="group flex items-center gap-2 shrink-0">
            <Logo size={28} showWordmark={true} />
          </Link>
          
          <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400 font-mono pl-3 border-l border-zinc-200">
            <span>/</span>
            <span className="text-zinc-500">{category}</span>
            {currentPage && (
              <>
                <span>/</span>
                <span className="text-ink font-semibold truncate max-w-[180px]">{currentPage}</span>
              </>
            )}
          </div>
        </div>

        {/* Center/Right: Quick Nav Links */}
        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="hidden md:flex items-center gap-1 font-mono text-xs">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-zinc-600 hover:text-ink hover:bg-zinc-100 transition-colors"
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {user ? (
            <Link
              href={`/profile/${user.username}`}
              className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-xs font-mono font-medium text-ink transition-colors"
            >
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`}
                alt={user.username}
                className="w-5 h-5 rounded-full object-cover bg-white ring-1 ring-zinc-200"
              />
              <span className="hidden sm:inline">@{user.username}</span>
            </Link>
          ) : (
            <button
              onClick={openAuthModal}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-ink hover:bg-zinc-800 text-white text-xs font-semibold tracking-wide transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-cyan" />
              <span>Sign In</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-zinc-600 hover:text-ink hover:bg-zinc-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-4 py-3 space-y-2 font-mono text-xs animate-in slide-in-from-top-1">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-between text-zinc-700"
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
