"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/brand/Logo";
import confetti from "canvas-confetti";
import {
  Mail,
  Lock,
  User as UserIcon,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  Zap,
  ShieldCheck,
  Globe,
  Star,
  Flame,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface AuthConsoleProps {
  initialMode?: "signin" | "signup";
}

export const AuthConsole: React.FC<AuthConsoleProps> = ({ initialMode = "signin" }) => {
  const router = useRouter();
  const { signIn, signUp, loginAsDemo } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [reactionClicked, setReactionClicked] = useState<string | null>(null);

  const [prevInitialMode, setPrevInitialMode] = useState(initialMode);
  if (initialMode !== prevInitialMode) {
    setPrevInitialMode(initialMode);
    setMode(initialMode);
  }

  // Real-time password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "Empty", color: "bg-zinc-700" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: "Weak", color: "bg-rose-500" };
      case 2:
        return { score: 2, label: "Fair", color: "bg-amber-500" };
      case 3:
        return { score: 3, label: "Good", color: "bg-cyan" };
      case 4:
        return { score: 4, label: "Strong", color: "bg-emerald-500" };
      default:
        return { score: 0, label: "Too short", color: "bg-zinc-700" };
    }
  };

  const strength = getPasswordStrength(password);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.65 },
        colors: ["#7C5CFC", "#FF4D8D", "#22D3EE", "#F59E0B"],
      });
    } catch {
      // safe fallback
    }
  };

  const handleReactionClick = (type: string) => {
    setReactionClicked(type);
    triggerConfetti();
    setTimeout(() => setReactionClicked(null), 1200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        if (!email.trim() || !password) {
          setError("Please enter both your email/username and password.");
          setLoading(false);
          return;
        }

        const effectiveEmail = email.includes("@") ? email.trim() : `${email.trim()}@wica.ai`;
        const res = await signIn(effectiveEmail, password);
        if (res.error) {
          setError(res.error);
          setLoading(false);
        } else {
          router.push("/");
        }
      } else {
        // Sign Up
        const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
        if (!cleanUsername || cleanUsername.length < 3) {
          setError("Username must be at least 3 characters (letters, numbers, underscores).");
          setLoading(false);
          return;
        }
        if (!email.trim() || !email.includes("@")) {
          setError("Please provide a valid email address.");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters long.");
          setLoading(false);
          return;
        }

        const res = await signUp(
          email.trim(),
          password,
          cleanUsername,
          displayName.trim() || cleanUsername
        );

        if (res.error) {
          setError(res.error);
          setLoading(false);
        } else {
          triggerConfetti();
          router.push("/");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication request failed.";
      setError(msg);
      setLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    loginAsDemo();
    triggerConfetti();
    router.push("/");
  };

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex flex-col justify-between bg-[#09090b] text-zinc-100 selection:bg-violet/30 overflow-hidden font-sans">
      {/* Dynamic Ambient Background Glows */}
      <div 
        className="pointer-events-none absolute -top-40 left-1/4 w-[600px] h-[500px] bg-violet/10 rounded-full blur-[140px] opacity-70"
        aria-hidden="true" 
      />
      <div 
        className="pointer-events-none absolute top-1/2 -right-32 w-[550px] h-[450px] bg-cyan/8 rounded-full blur-[160px] opacity-60"
        aria-hidden="true" 
      />
      <div 
        className="pointer-events-none absolute -bottom-32 left-10 w-[500px] h-[400px] bg-magenta/8 rounded-full blur-[140px] opacity-50"
        aria-hidden="true" 
      />

      {/* Main Responsive Grid Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-14 w-full">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* ========================================================================= */}
          {/* LEFT COLUMN: Visual Anomaly Radar & Showcase (Desktop Cols 1-7)           */}
          {/* ========================================================================= */}
          <section className="hidden lg:flex lg:col-span-7 flex-col items-start text-left select-none pr-4">
            
            {/* Telemetry live status tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-zinc-300 backdrop-blur-md mb-5 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Weca Global Grid Active</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">Network Active</span>
            </div>

            {/* Punchy Headline with Chromatic Gradient */}
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-[54px] text-white tracking-tight leading-[1.12] mb-4 max-w-xl">
              See everyday moments from the{" "}
              <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-violet-400 bg-clip-text text-transparent">
                weird world.
              </span>
            </h1>

            <p className="text-sm text-zinc-400 font-sans max-w-lg mb-8 leading-relaxed">
              Join thousands of observers cataloging rare anomalies, environmental glitches,
              and curiosities scored dynamically by AI Vision.
            </p>

            {/* Layered 3D Cards Stage */}
            <div className="relative w-full max-w-[500px] h-[420px] flex items-center justify-center my-2">
              
              {/* Back Left Card: Tilt -7 deg */}
              <div className="absolute left-2 top-8 w-[205px] h-[345px] -rotate-6 rounded-[28px] overflow-hidden shadow-2xl border border-zinc-700/60 bg-zinc-950 transition-all duration-300 hover:rotate-[-3deg] hover:scale-105 z-0 group">
                <img
                  src="/anom-2.jpg"
                  alt="Glowing botanical specimen anomaly"
                  className="w-full h-full object-cover brightness-90 group-hover:brightness-100 transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                
                <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-white/60 bg-zinc-800">
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

                <div className="absolute bottom-4 left-3.5 right-3.5 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-mono font-bold text-amber-300">
                    ★ 88 WC
                  </span>
                  <span className="text-[10px] font-mono text-zinc-300">Kyoto, JP</span>
                </div>
              </div>

              {/* Front Center Card: Hero Elevation */}
              <div className="relative z-10 w-[235px] h-[390px] rounded-[32px] overflow-hidden shadow-2xl shadow-violet/20 border-2 border-zinc-600/70 bg-zinc-950 transition-all duration-300 hover:scale-[1.02] group">
                <img
                  src="/anom-1.jpg"
                  alt="Anomalous optical refraction captured in Tokyo"
                  className="w-full h-full object-cover brightness-95 group-hover:brightness-105 transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40" />

                {/* Aperture Scan Line effect */}
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan to-transparent animate-scan-beam pointer-events-none opacity-70" />

                {/* Top Author Tag */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-violet bg-zinc-800">
                    <img
                      src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80"
                      alt="anomaly_hunter"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-white font-bold drop-shadow">
                      @anomaly_hunter
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400">Tokyo Sighting</div>
                  </div>
                </div>

                {/* Score Pill Overlay */}
                <div className="absolute top-16 left-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-cyan/40 text-white font-mono text-[11px] font-bold shadow-lg shadow-cyan/10">
                    <Sparkles className="w-3.5 h-3.5 text-cyan" />
                    <span>94 Wica Score</span>
                  </div>
                </div>

                {/* Bottom Story Interaction Bar */}
                <div className="absolute bottom-4 left-3.5 right-3.5 flex items-center gap-2">
                  <div className="flex-1 py-1.5 px-3 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white/90 text-[11px] truncate">
                    Score this anomaly...
                  </div>
                  <button
                    type="button"
                    onClick={() => handleReactionClick("heart")}
                    className="p-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white hover:text-rose-400 transition-colors cursor-pointer"
                    title="React with appreciation"
                  >
                    <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
                  </button>
                </div>
              </div>

              {/* Back Right Card: Tilt +6 deg */}
              <div className="absolute right-2 top-10 w-[205px] h-[345px] rotate-6 rounded-[28px] overflow-hidden shadow-2xl border border-zinc-700/60 bg-zinc-950 transition-all duration-300 hover:rotate-[3deg] hover:scale-105 z-0 group">
                <img
                  src="/anom-3.jpg"
                  alt="Neon celestial anomaly"
                  className="w-full h-full object-cover brightness-90 group-hover:brightness-100 transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                <div className="absolute top-3.5 right-3.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/90 text-white font-bold text-[10px] shadow-md">
                  <Star className="w-2.5 h-2.5 fill-white" />
                  <span>Verified</span>
                </div>

                <div className="absolute bottom-4 left-3.5">
                  <div className="text-[11px] font-mono text-white font-medium drop-shadow-md">
                    @urban_stranger
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400">Reykjavik</div>
                </div>
              </div>

              {/* Floating Reaction Bubbles (Interactive) */}
              <div className="absolute -top-3 z-30 flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 shadow-xl text-base">
                <button
                  type="button"
                  onClick={() => handleReactionClick("orb")}
                  className="hover:scale-125 active:scale-95 transition-transform cursor-pointer"
                  title="Cosmic Mystery"
                >
                  🔮
                </button>
                <button
                  type="button"
                  onClick={() => handleReactionClick("zap")}
                  className="hover:scale-125 active:scale-95 transition-transform cursor-pointer"
                  title="Reality Breaking"
                >
                  ⚡
                </button>
                <button
                  type="button"
                  onClick={() => handleReactionClick("eye")}
                  className="hover:scale-125 active:scale-95 transition-transform cursor-pointer"
                  title="Visual Anomaly"
                >
                  👁️
                </button>
                {reactionClicked && (
                  <span className="text-[10px] font-mono text-violet font-semibold animate-pulse pl-1">
                    Recorded!
                  </span>
                )}
              </div>
            </div>

            {/* Bottom feature bullets */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-lg mt-6 pt-6 border-t border-zinc-800/80 text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>AI Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet shrink-0" />
                <span>Earn Credits</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan shrink-0" />
                <span>Global Feed</span>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: Auth Console Card (Cols 8-12)                               */}
          {/* ========================================================================= */}
          <section className="lg:col-span-5 flex flex-col items-center justify-center w-full">
            <div className="w-full max-w-[420px] bg-zinc-900/70 backdrop-blur-2xl border border-zinc-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative">
              
              {/* Subtle Ambient Card Top Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-violet/50 to-transparent rounded-full" />

              {/* Card Header & Brand */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shadow-inner mb-3">
                  <Logo size={36} showWordmark={false} />
                </div>
                <h2 className="font-display font-bold text-2xl text-white tracking-tight">
                  {mode === "signin" ? "Welcome back" : "Join the Foundation"}
                </h2>
                <p className="text-xs text-zinc-400 font-sans mt-1">
                  {mode === "signin"
                    ? "Enter your credentials to access the classification index."
                    : "Create your researcher identity and begin logging sightings."}
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-950/80 border border-zinc-800/80 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    mode === "signin"
                      ? "bg-zinc-800 text-white shadow-xs border border-zinc-700/60"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    mode === "signup"
                      ? "bg-zinc-800 text-white shadow-xs border border-zinc-700/60"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Error Alert Banner */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Forgot Password Notification */}
              {forgotSent && (
                <div className="mb-4 p-3 rounded-xl bg-violet/15 border border-violet/30 text-xs text-violet font-mono flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-violet shrink-0" />
                  <span>Use instant guest mode or sign in with your email.</span>
                </div>
              )}

              {/* Auth Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                
                {/* Sign Up: Username Field */}
                {mode === "signup" && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                      <span>Username</span>
                      <span className="text-[10px] text-zinc-500 font-mono">Unique handle</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="anomaly_scout"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950/70 border border-zinc-800/90 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/40 transition-all font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Sign Up: Display Name (Optional) */}
                {mode === "signup" && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                      <span>Display Name</span>
                      <span className="text-[10px] text-zinc-500 font-mono">Optional</span>
                    </label>
                    <div className="relative">
                      <Sparkles className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Dr. Elena Vance"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950/70 border border-zinc-800/90 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/40 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Email / Identifier Field */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">
                    {mode === "signin" ? "Email or Username" : "Email Address"}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type={mode === "signup" ? "email" : "text"}
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={mode === "signup" ? "you@organization.org" : "you@example.com"}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950/70 border border-zinc-800/90 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/40 transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-300">
                      Password
                    </label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        onClick={() => setForgotSent(true)}
                        className="text-[11px] text-violet hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-zinc-950/70 border border-zinc-800/90 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/40 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Sign Up: Password Strength Meter */}
                  {mode === "signup" && password && (
                    <div className="pt-1.5 space-y-1 animate-in fade-in">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-zinc-500">Security Rating:</span>
                        <span className="text-zinc-300 font-semibold">{strength.label}</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex gap-0.5">
                        <div className={`h-full flex-1 rounded-full transition-all duration-300 ${strength.score >= 1 ? strength.color : "bg-zinc-800"}`} />
                        <div className={`h-full flex-1 rounded-full transition-all duration-300 ${strength.score >= 2 ? strength.color : "bg-zinc-800"}`} />
                        <div className={`h-full flex-1 rounded-full transition-all duration-300 ${strength.score >= 3 ? strength.color : "bg-zinc-800"}`} />
                        <div className={`h-full flex-1 rounded-full transition-all duration-300 ${strength.score >= 4 ? strength.color : "bg-zinc-800"}`} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs shadow-lg shadow-white/5 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{mode === "signin" ? "Sign In to Weca" : "Complete Registration"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-5 flex items-center justify-center">
                <div className="border-t border-zinc-800 w-full" />
                <span className="bg-[#121215] px-2.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500 relative">
                  Quick Access
                </span>
              </div>

              {/* Instant Guest Mode Button */}
              <button
                type="button"
                onClick={handleDemoSignIn}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-950/80 hover:bg-zinc-800/80 text-zinc-200 border border-zinc-800 hover:border-zinc-700 text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Instant Explorer Pass (Guest Mode)</span>
              </button>

              {/* Terms & Footer */}
              <div className="mt-5 text-center text-[11px] text-zinc-500 leading-relaxed">
                By accessing Weca, you agree to our{" "}
                <Link href="/community-guidelines" className="text-zinc-400 hover:underline">
                  Guidelines
                </Link>{" "}
                and{" "}
                <Link href="/terms" className="text-zinc-400 hover:underline">
                  Terms
                </Link>
                .
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Subtle Bottom Global Footer */}
      <footer className="relative z-10 w-full py-5 text-xs text-zinc-500 border-t border-zinc-800/80 bg-[#09090b]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-[11px] font-mono">
            <Link href="/" className="hover:text-zinc-300 transition-colors">World Feed</Link>
            <Link href="/scoring-engine" className="hover:text-zinc-300 transition-colors">Scoring Engine</Link>
            <Link href="/rarity-tiers" className="hover:text-zinc-300 transition-colors">Rarity Tiers</Link>
            <Link href="/challenges" className="hover:text-zinc-300 transition-colors">Challenges</Link>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
          </div>
          <div className="text-[11px] font-mono text-zinc-500">
            © 2026 Weca Platform • Powered by Gemini Vision AI
          </div>
        </div>
      </footer>
    </div>
  );
};
