"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MasonryFeed } from "@/components/feed/MasonryFeed";
import { UploadModal } from "@/components/upload/UploadModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { LoginPageView } from "@/components/auth/LoginPageView";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/context/AuthContext";
import { WicaImage } from "@/lib/types";
import { Plus, Sparkles, ShieldCheck, Eye, LogIn } from "lucide-react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isGuestBrowsing, setIsGuestBrowsing] = useState<boolean>(false);
  const [latestUploadedImage, setLatestUploadedImage] = useState<WicaImage | null>(null);

  // If unauthenticated and not explicitly browsing as guest, show the redesigned Instagram-style login 1st page
  if (!loading && !user && !isGuestBrowsing) {
    return (
      <>
        <LoginPageView onExploreFeed={() => setIsGuestBrowsing(true)} />
        <AuthModal />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-ink">
      <Header onOpenUpload={() => setIsUploadOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Guest Exploring Banner */}
        {!user && isGuestBrowsing && (
          <div className="mb-6 p-3.5 rounded-xl bg-violet/5 border border-violet/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-zinc-700">
              <span className="w-2 h-2 rounded-full bg-violet animate-pulse" />
              <span className="font-mono">Browsing World Feed as Guest</span>
              <span className="text-zinc-400">• Real photos & Gemini Vision scores</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsGuestBrowsing(false)}
                className="px-3.5 py-1.5 rounded-lg bg-violet hover:bg-violet/90 text-white font-medium text-xs transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log in / Create Account</span>
              </button>
            </div>
          </div>
        )}

        {/* Minimal Hero Section */}
        <section className="mb-12 border-b border-zinc-200 pb-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs font-mono mb-4">
              <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
              <span>AI Weirdness Engine v0.2.0 • Rarity First</span>
            </div>

            <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-ink tracking-tight leading-[1.08] mb-4">
              Score the world&apos;s <span className="underline decoration-violet decoration-wavy underline-offset-8">weirdness.</span>
            </h1>

            <p className="text-zinc-600 text-base sm:text-lg leading-relaxed max-w-2xl mb-6">
              Upload real photos of strange or rare things you found. The AI rates each on 5 dimensions of uniqueness, calculates your Wica Score, and awards Weird Credits.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-5 py-2.5 rounded-full bg-ink hover:bg-zinc-800 text-white font-semibold text-xs tracking-wide flex items-center gap-2 shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 text-cyan" />
                <span>Upload a Photo to Score</span>
              </button>

              <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 pl-2">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-violet" /> Real photos only
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-magenta" /> Vision scored
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Discovery Feed Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 id="world-feed-heading" className="font-display font-bold text-2xl text-ink tracking-tight">
                The World Feed
              </h2>
              <p className="text-xs text-zinc-500 font-mono">
                Ranked by rarity & composite Wica Score, not popularity.
              </p>
            </div>
          </div>

          <MasonryFeed newlyUploadedImage={latestUploadedImage} />
        </section>
      </main>

      {/* Universal Footer with links to all 11 sections */}
      <div className="mt-16">
        <Footer />
      </div>

      {/* Global Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={(newImg) => {
          setLatestUploadedImage(newImg);
        }}
      />
      <AuthModal />
    </div>
  );
}
