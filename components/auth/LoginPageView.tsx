"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/brand/Logo";
import {
  Heart,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Zap,
  Globe,
  Star,
  ChevronDown,
} from "lucide-react";

interface LoginPageViewProps {
  onExploreFeed?: () => void;
}

export const LoginPageView: React.FC<LoginPageViewProps> = ({ onExploreFeed }) => {
  const { signInWithEmail, signUpWithEmail, loginAsDemo } = useAuth();

  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [identifier, setIdentifier] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [forgotSent, setForgotSent] = useState<boolean>(false);
  const [likedAnomaly, setLikedAnomaly] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isSignUp) {
        if (!username.trim()) {
          setError("Please choose a username");
          setSubmitting(false);
          return;
        }
        const email = identifier.includes("@") ? identifier : `${identifier}@wica.ai`;
        const res = await signUpWithEmail(email, password, username);
        if (res.error) {
          setError(res.error);
        } else {
          onExploreFeed?.();
        }
      } else {
        const email = identifier.includes("@") ? identifier : `${identifier}@wica.ai`;
        const res = await signInWithEmail(email, password);
        if (res.error) {
          setError(res.error);
        } else {
          onExploreFeed?.();
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoSignIn = () => {
    loginAsDemo();
    onExploreFeed?.();
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-ink selection:bg-violet/20 font-sans">
      {/* Top Mobile Bar (Visible only on small mobile screens) */}
      <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-zinc-100">
        <Logo size={28} showWordmark={true} />
        {onExploreFeed && (
          <button
            onClick={onExploreFeed}
            className="text-xs font-medium text-violet hover:underline flex items-center gap-1"
          >
            Explore Feed <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Split Section */}
      <main className="flex-1 flex items-center justify-center w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Hero & Visual Display (Cols 1-7) */}
          <section className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left pt-2 lg:pt-0">
            {/* Desktop Brand Logo */}
            <div className="hidden lg:flex items-center gap-3 mb-6">
              <Logo size={44} showWordmark={false} />
            </div>

            {/* Punchy Headline matching reference aesthetic */}
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-[56px] text-ink tracking-tight leading-[1.12] mb-8 max-w-xl">
              See everyday moments from the{" "}
              <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 bg-clip-text text-transparent">
                weird world.
              </span>
            </h1>

            {/* Layered 3D Story Cards Graphic */}
            <div className="relative w-full max-w-[460px] sm:max-w-[500px] h-[410px] sm:h-[450px] flex items-center justify-center select-none my-2">
              
              {/* Back-Left Phone (Tilted -7deg) */}
              <div 
                className="absolute left-1 sm:left-4 top-8 w-[190px] sm:w-[220px] h-[330px] sm:h-[375px] -rotate-6 rounded-[30px] overflow-hidden shadow-xl border border-zinc-200/90 bg-zinc-950 transition-all duration-300 hover:rotate-[-4deg] hover:scale-105 z-0"
              >
                <img
                  src="/anom-2.jpg"
                  alt="Upside-down glowing mushroom anomaly"
                  className="w-full h-full object-cover brightness-95"
                />
                {/* Story Top Progress Bar */}
                <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
                  <div className="h-1 flex-1 bg-white/90 rounded-full" />
                  <div className="h-1 flex-1 bg-white/40 rounded-full" />
                </div>
                {/* Story Author info */}
                <div className="absolute top-6 left-3 flex items-center gap-2 z-10">
                  <div className="w-6 h-6 rounded-full ring-1 ring-white overflow-hidden bg-zinc-700">
                    <img 
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" 
                      alt="botanical_glitch" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[11px] font-mono text-white font-medium drop-shadow-md">
                    @botanical_glitch
                  </span>
                </div>
                <div className="absolute bottom-4 left-3 right-3 flex items-center justify-between text-white drop-shadow-md">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/20">
                    ★ 88 WC
                  </span>
                </div>
              </div>

              {/* 3D Radiant Heart Reaction Badge (Bottom Left) */}
              <div 
                className="absolute -left-1 sm:left-2 bottom-6 z-20 w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 p-[2px] shadow-2xl shadow-rose-500/40 animate-pulse cursor-pointer hover:scale-110 transition-transform"
                onClick={() => setLikedAnomaly(!likedAnomaly)}
                title="Heart Reaction"
              >
                <div className="w-full h-full rounded-[14px] bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center">
                  <Heart className={`w-6 sm:w-7 h-6 sm:h-7 text-white fill-white ${likedAnomaly ? "animate-ping" : ""}`} />
                </div>
              </div>

              {/* Front-Center Phone (Prominent, Rounded-[34px], Shadow-2xl) */}
              <div 
                className="relative z-10 w-[215px] sm:w-[245px] h-[370px] sm:h-[415px] rounded-[34px] overflow-hidden shadow-2xl border-[3px] border-white/95 bg-zinc-950 transition-all duration-300 hover:scale-[1.02]"
              >
                <img
                  src="/anom-1.jpg"
                  alt="Cheerful cat anomaly scored by Wica"
                  className="w-full h-full object-cover"
                />

                {/* Story Top Progress Bar */}
                <div className="absolute top-3.5 left-4 right-4 flex gap-1.5 z-20">
                  <div className="h-1 flex-1 bg-white rounded-full shadow-sm" />
                  <div className="h-1 flex-1 bg-white/40 rounded-full" />
                  <div className="h-1 flex-1 bg-white/40 rounded-full" />
                </div>

                {/* Center Story User Header */}
                <div className="absolute top-7 left-4 flex items-center gap-2 z-20">
                  <div className="w-7 h-7 rounded-full ring-2 ring-violet overflow-hidden bg-zinc-800">
                    <img 
                      src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80" 
                      alt="anomaly_hunter" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-white font-bold drop-shadow-md flex items-center gap-1">
                      @anomaly_hunter
                    </span>
                    <span className="text-[10px] text-zinc-300 font-mono drop-shadow">Tokyo, Japan</span>
                  </div>
                </div>

                {/* Score Pill Overlay */}
                <div className="absolute top-20 left-4 z-20">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-mono text-[11px] font-bold shadow-lg">
                    <Sparkles className="w-3 h-3 text-cyan" />
                    <span>94 Wica Score</span>
                  </div>
                </div>

                {/* Bottom Story Interaction Bar */}
                <div className="absolute bottom-4 left-3 right-3 z-20 flex items-center gap-2">
                  <div className="flex-1 py-1.5 px-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white/90 text-[11px] truncate shadow-sm">
                    Score this anomaly...
                  </div>
                  <button 
                    onClick={() => setLikedAnomaly(!likedAnomaly)}
                    className="p-1.5 rounded-full bg-black/30 backdrop-blur-sm text-white hover:text-rose-400 transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${likedAnomaly ? "text-rose-500 fill-rose-500" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Floating Emoji Reactions Bubble above Front Card */}
              <div 
                className="absolute top-3 sm:top-2 z-30 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-zinc-200 shadow-xl shadow-black/10 text-lg hover:scale-110 transition-transform cursor-default"
                title="Community Reactions"
              >
                <span className="hover:scale-125 transition-transform">🔮</span>
                <span className="hover:scale-125 transition-transform">👀</span>
                <span className="hover:scale-125 transition-transform">🤯</span>
              </div>

              {/* Back-Right Phone (Tilted +6deg) */}
              <div 
                className="absolute right-1 sm:right-4 top-10 w-[190px] sm:w-[220px] h-[330px] sm:h-[375px] rotate-6 rounded-[30px] overflow-hidden shadow-xl border border-zinc-200/90 bg-zinc-950 transition-all duration-300 hover:rotate-[4deg] hover:scale-105 z-0"
              >
                <img
                  src="/anom-3.jpg"
                  alt="Neon anomaly"
                  className="w-full h-full object-cover"
                />
                {/* Story Top Progress Bar */}
                <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
                  <div className="h-1 flex-1 bg-white/90 rounded-full" />
                  <div className="h-1 flex-1 bg-white/40 rounded-full" />
                </div>

                {/* Close Friends / Certified Weird Green Star Badge */}
                <div className="absolute top-6 right-3 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold text-[10px] shadow-md">
                  <Star className="w-2.5 h-2.5 fill-white" />
                  <ChevronDown className="w-2.5 h-2.5" />
                </div>

                {/* Bottom Author Tag */}
                <div className="absolute bottom-4 left-3 z-10">
                  <span className="text-[11px] font-mono text-white font-medium drop-shadow-md">
                    @urban_stranger
                  </span>
                </div>
              </div>

              {/* Overlapping User Avatar Badge on Right */}
              <div 
                className="absolute right-0 sm:right-2 bottom-8 z-20 w-12 sm:w-14 h-12 sm:h-14 rounded-full ring-2 ring-white shadow-xl overflow-hidden border-2 border-emerald-400 bg-zinc-100"
                title="Certified Weird Scout"
              >
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" 
                  alt="urban_stranger" 
                  className="w-full h-full object-cover"
                />
              </div>

            </div>
          </section>

          {/* Right Column: Authentication Form (Cols 8-12) */}
          <section className="lg:col-span-5 flex flex-col items-center justify-center w-full">
            <div className="w-full max-w-[380px] px-2 sm:px-0">
              
              {/* Header */}
              <div className="mb-6 text-left">
                <h2 className="font-display font-bold text-2xl sm:text-[26px] text-ink tracking-tight">
                  {isSignUp ? "Join the Weirdness Index" : "Log in to Wica"}
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  {isSignUp 
                    ? "Score rare real-world anomalies with Gemini AI." 
                    : "Welcome back to the global rarity community."}
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
                  {error}
                </div>
              )}

              {/* Forgot Password Banner */}
              {forgotSent && (
                <div className="mb-4 p-3 rounded-xl bg-violet/10 border border-violet/20 text-xs text-violet font-medium">
                  Demo Mode: Sign in directly or click &ldquo;Instant Demo Explorer&rdquo; below!
                </div>
              )}

              {/* Auth Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                
                {isSignUp && (
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Choose username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3.5 text-sm bg-zinc-50/80 border border-zinc-200 rounded-xl focus:outline-none focus:bg-white focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all placeholder:text-zinc-400 font-sans"
                    />
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    required
                    placeholder="Username or email address"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full px-4 py-3.5 text-sm bg-zinc-50/80 border border-zinc-200 rounded-xl focus:outline-none focus:bg-white focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all placeholder:text-zinc-400 font-sans"
                  />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-11 py-3.5 text-sm bg-zinc-50/80 border border-zinc-200 rounded-xl focus:outline-none focus:bg-white focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all placeholder:text-zinc-400 font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-700 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-violet hover:bg-violet/90 text-white font-semibold text-sm shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting 
                    ? "Authenticating..." 
                    : isSignUp 
                      ? "Sign up" 
                      : "Log in"}
                </button>
              </form>

              {/* Forgotten Password Link */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setForgotSent(true)}
                  className="text-xs text-zinc-600 hover:text-ink hover:underline transition-colors"
                >
                  Forgotten password?
                </button>
              </div>

              {/* Instant Demo Sign-In (Replaces Facebook Login in reference) */}
              <div className="mt-6 pt-5 border-t border-zinc-100 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleDemoSignIn}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200/90 text-ink font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Zap className="w-4 h-4 text-violet fill-violet" />
                  <span>Instant Demo Explorer Sign In</span>
                </button>

                {/* Create New Account Button (Navigates to full Instagram-style Signup page) */}
                <Link
                  href="/signup"
                  className="w-full py-2.5 px-4 rounded-full border border-zinc-300 hover:border-violet text-ink hover:text-violet font-semibold text-xs text-center transition-all active:scale-[0.98] block"
                >
                  Create new account
                </Link>
              </div>

              {/* Explore Feed as Guest Link */}
              {onExploreFeed && (
                <div className="mt-4 pt-3 text-center border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={onExploreFeed}
                    className="text-xs text-zinc-500 hover:text-ink font-medium inline-flex items-center gap-1 transition-colors group"
                  >
                    <span>Explore World Feed without logging in</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform text-violet" />
                  </button>
                </div>
              )}

              {/* Card Footnote (Meta style) */}
              <div className="mt-7 flex items-center justify-center gap-2 text-zinc-400">
                <Logo size={16} showWordmark={false} />
                <span className="font-mono text-[10px] tracking-wider uppercase text-zinc-400">
                  Powered by Gemini Vision AI
                </span>
              </div>

            </div>
          </section>

        </div>
      </main>

      {/* Subtle Bottom Footer matching Instagram layout */}
      <footer className="w-full py-8 text-xs text-zinc-400 border-t border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col items-center gap-4 text-center">
          {/* Navigation Links */}
          <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-[11px] text-zinc-500">
            <button onClick={onExploreFeed} className="hover:text-ink transition-colors">World Feed</button>
            <Link href="/about" className="hover:text-ink transition-colors">About Wica</Link>
            <Link href="/scoring-engine" className="hover:text-ink transition-colors">Scoring Engine</Link>
            <Link href="/rarity-tiers" className="hover:text-ink transition-colors">Rarity Tiers</Link>
            <Link href="/directory" className="hover:text-ink transition-colors">Anomaly Directory</Link>
            <Link href="/community-guidelines" className="hover:text-ink transition-colors">Community Guidelines</Link>
            <Link href="/gemini-vision-api" className="hover:text-ink transition-colors">Gemini Vision API</Link>
            <Link href="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-ink transition-colors">Terms</Link>
            <Link href="/verified-anomalies" className="hover:text-ink transition-colors">Verified Anomalies</Link>
            <Link href="/anomaly-guidelines" className="hover:text-ink transition-colors">Anomaly Guidelines</Link>
            <Link href="/learn-more" className="hover:text-ink transition-colors">Learn More</Link>
          </div>

          {/* Bottom Copyright & Language */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-zinc-400 font-mono">
            <div className="flex items-center gap-1 cursor-pointer hover:text-zinc-600 transition-colors">
              <Globe className="w-3.5 h-3.5" />
              <span>English (US)</span>
              <ChevronDown className="w-3 h-3" />
            </div>
            <span>© 2026 Wica — The Global Weirdness Index</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
