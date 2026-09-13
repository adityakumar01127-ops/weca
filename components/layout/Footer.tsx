"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Globe, ChevronDown, Sparkles, Swords, MapPin, Trophy } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface FooterProps {
  minimal?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ minimal = false }) => {
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();

  // Keep footer only on login, signup, and regulatory legal compliance pages
  // to preserve a clean native app feel across the main platform
  const isAllowedPage =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/terms") ||
    pathname?.startsWith("/privacy") ||
    pathname?.startsWith("/cancellation-and-refund") ||
    pathname?.startsWith("/contact");

  if (!isAllowedPage) {
    return null;
  }

  return (
    <footer className="w-full py-12 pb-28 md:pb-12 text-xs text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-[#09090b] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
        {!minimal && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-zinc-200 dark:border-zinc-800">
            {/* Column 1: Engine & Platform */}
            <div className="space-y-3">
              <h4 className="font-mono text-[11px] font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                Index & Engine
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/about" className="hover:text-zinc-950 dark:hover:text-white transition-colors">
                    About Weca
                  </Link>
                </li>
                <li>
                  <Link href="/scoring-engine" className="hover:text-zinc-950 dark:hover:text-white transition-colors">
                    Scoring Engine (5-D)
                  </Link>
                </li>
                <li>
                  <Link href="/rarity-tiers" className="hover:text-zinc-950 dark:hover:text-white transition-colors">
                    Rarity Tiers
                  </Link>
                </li>
                <li>
                  <Link href="/gemini-vision-api" className="hover:text-zinc-950 dark:hover:text-white transition-colors">
                    Gemini Vision API
                  </Link>
                </li>
                <li>
                  <Link href="/brand" className="hover:text-cyan font-semibold transition-colors flex items-center gap-1">
                    <span>Brand Kit & Logos</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan/20 text-cyan border border-cyan/30">SVG</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Discovery & Cartography */}
            <div className="space-y-3">
              <h4 className="font-mono text-[11px] font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                The Archive & Map
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/" className="hover:text-zinc-950 dark:hover:text-white transition-colors">
                    World Feed
                  </Link>
                </li>
                <li>
                  <Link href="/map" className="hover:text-cyan font-semibold transition-colors flex items-center gap-1">
                    <span>World Map Explorer</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan/20 text-cyan border border-cyan/30">MAP</span>
                  </Link>
                </li>
                <li>
                  <Link href="/directory" className="hover:text-zinc-950 dark:hover:text-white transition-colors">
                    Anomaly Directory
                  </Link>
                </li>
                <li>
                  <Link href="/verified-anomalies" className="hover:text-zinc-950 dark:hover:text-white transition-colors">
                    Verified Anomalies
                  </Link>
                </li>
                <li>
                  <Link href="/anomaly-guidelines" className="hover:text-zinc-950 dark:hover:text-white transition-colors">
                    Anomaly Guidelines
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Arena & Gamification */}
            <div className="space-y-3">
              <h4 className="font-mono text-[11px] font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                Community & Arena
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/versus" className="hover:text-magenta font-semibold transition-colors flex items-center gap-1">
                    <span>Versus Battles</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">LIVE</span>
                  </Link>
                </li>
                <li>
                  <Link href="/leaderboard" className="hover:text-amber-500 dark:hover:text-amber-400 font-semibold transition-colors">
                    Global Leaderboard
                  </Link>
                </li>
                <li>
                  <Link href="/challenges" className="hover:text-zinc-950 dark:hover:text-white transition-colors">
                    Weekly Challenges
                  </Link>
                </li>
                <li>
                  <Link href="/wallet" className="hover:text-zinc-950 dark:hover:text-white transition-colors">
                    Weird Credits Wallet
                  </Link>
                </li>
                <li>
                  <Link href="/community-guidelines" className="hover:text-zinc-950 dark:hover:text-white transition-colors">
                    Community Guidelines
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Platform Mission & Legal */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Logo size={24} showWordmark={true} dark={resolvedTheme === "dark"} />
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                The Global Weirdness Index. Scoring candid real-world anomalies through 5-dimensional Gemini Vision multimodal intelligence.
              </p>
              <div className="pt-1 flex flex-wrap gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                <Link href="/terms" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Terms</Link>
                <span>•</span>
                <Link href="/privacy" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Privacy</Link>
                <span>•</span>
                <Link href="/cancellation-and-refund" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Refunds</Link>
                <span>•</span>
                <Link href="/contact" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Contact</Link>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-200/80 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-[10px] font-mono text-zinc-700 dark:text-zinc-400">
                <Sparkles className="w-3 h-3 text-cyan" />
                <span>Weirdness Engine v0.2.0 • 89 Countries</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Horizontal Bar */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-[11px] text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="hover:text-zinc-950 dark:hover:text-white transition-colors">World Feed</Link>
            <Link href="/versus" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors font-semibold">Versus</Link>
            <Link href="/map" className="hover:text-cyan transition-colors font-semibold">World Map</Link>
            <Link href="/directory" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Directory</Link>
            <Link href="/leaderboard" className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors">Leaderboard</Link>
            <Link href="/challenges" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Challenges</Link>
            <Link href="/wallet" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Wallet</Link>
            <Link href="/about" className="hover:text-zinc-950 dark:hover:text-white transition-colors">About</Link>
            <Link href="/scoring-engine" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Scoring Engine</Link>
            <Link href="/rarity-tiers" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Rarity Tiers</Link>
            <Link href="/community-guidelines" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Guidelines</Link>
            <Link href="/brand" className="hover:text-cyan transition-colors font-semibold">Brand Kit</Link>
            <Link href="/privacy" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Terms</Link>
            <Link href="/cancellation-and-refund" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Refund Policy</Link>
            <Link href="/contact" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Contact Us</Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-zinc-500 font-mono">
            <div className="flex items-center gap-1 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
              <Globe className="w-3.5 h-3.5" />
              <span>English (US)</span>
              <ChevronDown className="w-3 h-3" />
            </div>
            <span>© 2026 Weca — The Global Weirdness Index</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
