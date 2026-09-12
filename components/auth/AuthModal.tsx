"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/brand/Logo";
import { X, ArrowRight, Lock, Mail, User as UserIcon } from "lucide-react";

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isAuthModalOpen) return null;

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
        const res = await signUpWithEmail(email, password, username);
        if (res.error) {
          setError(res.error);
        } else {
          closeAuthModal();
        }
      } else {
        const res = await signInWithEmail(email, password);
        if (res.error) {
          setError(res.error);
        } else {
          closeAuthModal();
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-zinc-900/90 backdrop-blur-2xl rounded-3xl border border-zinc-800/90 shadow-2xl shadow-black/80 overflow-hidden p-6 sm:p-7 animate-in zoom-in-95 duration-200 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Card Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-transparent via-violet/60 to-transparent rounded-full" />

        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 flex flex-col items-center text-center">
          <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shadow-inner mb-3">
            <Logo size={36} showWordmark={false} dark={true} />
          </div>
          <h2 className="font-display font-bold text-2xl text-white tracking-tight">
            {isSignUp ? "Join the Weirdness Index" : "Welcome back to Weca"}
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs font-sans">
            {isSignUp
              ? "Share genuine anomalies and start earning Weird Credits."
              : "Sign in to score anomalies, like, and comment."}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Username
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. anomaly_hunter"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950/70 border border-zinc-800/90 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/40 transition-all font-mono"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950/70 border border-zinc-800/90 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/40 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950/70 border border-zinc-800/90 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/40 transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-white/5 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Authenticating..." : isSignUp ? "Create Account" : "Sign In"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-zinc-800 text-center">
          <p className="text-xs text-zinc-400">
            {isSignUp ? "Already have an account?" : "Don't have an account yet?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-violet font-semibold hover:underline cursor-pointer"
            >
              {isSignUp ? "Sign In" : "Create Account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
