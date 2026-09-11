"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Globe, ChevronDown, Sparkles, Swords, MapPin, Trophy } from "lucide-react";

interface FooterProps {
  minimal?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ minimal = false }) => {
  return (
    <footer className="w-full py-12 text-xs text-zinc-500 border-t border-zinc-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
        {!minimal && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-zinc-100">
            {/* Column 1: Engine & Platform */}
            <div className="space-y-3">
              <h4 className="font-mono text-[11px] font-semibold text-ink uppercase tracking-wider">
                Index & Engine
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/about" className="hover:text-ink transition-colors">
                    About Wica
                  </Link>
                </li>
                <li>
                  <Link href="/scoring-engine" className="hover:text-ink transition-colors">
                    Scoring Engine (5-D)
                  </Link>
                </li>
                <li>
                  <Link href="/rarity-tiers" className="hover:text-ink transition-colors">
                    Rarity Tiers
                  </Link>
                </li>
                <li>
                  <Link href="/gemini-vision-api" className="hover:text-ink transition-colors">
                    Gemini Vision API
                  </Link>
                </li>
                <li>
                  <Link href="/pro" className="hover:text-violet font-semibold transition-colors flex items-center gap-1">
                    <span>Wica Pro & Licensing</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-violet/10 text-violet">NEW</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Discovery & Cartography */}
            <div className="space-y-3">
              <h4 className="font-mono text-[11px] font-semibold text-ink uppercase tracking-wider">
                The Archive & Map
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/" className="hover:text-ink transition-colors">
                    World Feed
                  </Link>
                </li>
                <li>
                  <Link href="/map" className="hover:text-cyan font-semibold transition-colors flex items-center gap-1">
                    <span>World Map Explorer</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan/15 text-cyan">MAP</span>
                  </Link>
                </li>
                <li>
                  <Link href="/directory" className="hover:text-ink transition-colors">
                    Anomaly Directory
                  </Link>
                </li>
                <li>
                  <Link href="/verified-anomalies" className="hover:text-ink transition-colors">
                    Verified Anomalies
                  </Link>
                </li>
                <li>
                  <Link href="/anomaly-guidelines" className="hover:text-ink transition-colors">
                    Anomaly Guidelines
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Arena & Gamification */}
            <div className="space-y-3">
              <h4 className="font-mono text-[11px] font-semibold text-ink uppercase tracking-wider">
                Community & Arena
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/versus" className="hover:text-magenta font-semibold transition-colors flex items-center gap-1">
                    <span>Versus Battles</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-magenta/15 text-magenta">LIVE</span>
                  </Link>
                </li>
                <li>
                  <Link href="/leaderboard" className="hover:text-amber-600 font-semibold transition-colors">
                    Global Leaderboard
                  </Link>
                </li>
                <li>
                  <Link href="/challenges" className="hover:text-ink transition-colors">
                    Weekly Challenges
                  </Link>
                </li>
                <li>
                  <Link href="/wallet" className="hover:text-ink transition-colors">
                    Weird Credits Wallet
                  </Link>
                </li>
                <li>
                  <Link href="/community-guidelines" className="hover:text-ink transition-colors">
                    Community Guidelines
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Platform Mission & Legal */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Logo size={24} showWordmark={true} />
              </div>
              <p className="text-zinc-500 text-[11px] leading-relaxed">
                The Global Weirdness Index. Scoring candid real-world anomalies through 5-dimensional Gemini Vision multimodal intelligence.
              </p>
              <div className="pt-1 flex flex-wrap gap-2 text-[11px]">
                <Link href="/terms" className="hover:text-ink transition-colors">Terms</Link>
                <span>•</span>
                <Link href="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
                <span>•</span>
                <Link href="/learn-more" className="hover:text-ink transition-colors">Contacts</Link>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-100 text-[10px] font-mono text-zinc-600">
                <Sparkles className="w-3 h-3 text-cyan" />
                <span>Weirdness Engine v0.2.0 • 89 Countries</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Horizontal Bar */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-[11px] text-zinc-500">
            <Link href="/" className="hover:text-ink transition-colors">World Feed</Link>
            <Link href="/versus" className="hover:text-magenta transition-colors font-semibold">Versus</Link>
            <Link href="/map" className="hover:text-cyan transition-colors font-semibold">World Map</Link>
            <Link href="/directory" className="hover:text-ink transition-colors">Directory</Link>
            <Link href="/leaderboard" className="hover:text-ink transition-colors">Leaderboard</Link>
            <Link href="/challenges" className="hover:text-ink transition-colors">Challenges</Link>
            <Link href="/wallet" className="hover:text-ink transition-colors">Wallet</Link>
            <Link href="/pro" className="hover:text-violet transition-colors font-semibold">Wica Pro</Link>
            <Link href="/about" className="hover:text-ink transition-colors">About</Link>
            <Link href="/scoring-engine" className="hover:text-ink transition-colors">Scoring Engine</Link>
            <Link href="/rarity-tiers" className="hover:text-ink transition-colors">Rarity Tiers</Link>
            <Link href="/community-guidelines" className="hover:text-ink transition-colors">Guidelines</Link>
            <Link href="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-ink transition-colors">Terms</Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-zinc-400 font-mono">
            <div className="flex items-center gap-1 cursor-pointer hover:text-zinc-600 transition-colors">
              <Globe className="w-3.5 h-3.5" />
              <span>English (US)</span>
              <ChevronDown className="w-3 h-3" />
            </div>
            <span>© 2026 Wica — The Global Weirdness Index</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
