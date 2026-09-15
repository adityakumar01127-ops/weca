"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/brand/Logo";
import { X, ArrowRight, Lock, Mail, User as UserIcon, AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    signIn,
    signUp,
    resetPassword,
    authModalMode,
  } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [confirmationSent, setConfirmationSent] = useState<boolean>(false);
  const [resetSent, setResetSent] = useState<boolean>(false);

  // Sync mode with trigger intent when opened
  useEffect(() => {
    if (isAuthModalOpen) {
      setMode(authModalMode || "signin");
      setError(null);
      setConfirmationSent(false);
      setResetSent(false);
    }
  }, [isAuthModalOpen, authModalMode]);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setError(null);
    setConfirmationSent(false);
    setResetSent(false);
    closeAuthModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "forgot") {
        if (!email.trim() || !email.includes("@")) {
          setError("Please enter a valid email address.");
          setSubmitting(false);
          return;
        }
        const res = await resetPassword(email.trim());
        if (res.error) {
          setError(res.error);
        } else {
          setResetSent(true);
        }
        setSubmitting(false);
        return;
      }

      if (mode === "signup") {
        const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
        if (!cleanUsername || cleanUsername.length < 3) {
          setError("Username must be at least 3 characters (letters, numbers, underscores).");
          setSubmitting(false);
          return;
        }
        if (cleanUsername.length > 20) {
          setError("Username must be 20 characters or fewer.");
          setSubmitting(false);
          return;
        }
        if (email.trim() && !email.includes("@")) {
          setError("Please provide a valid email address or leave it blank.");
          setSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters long.");
          setSubmitting(false);
          return;
        }

        const res = await signUp(cleanUsername, password, email.trim() || undefined);
        if (res.error) {
          setError(res.error);
        } else if (res.requiresEmailConfirmation) {
          setConfirmationSent(true);
        } else {
          handleClose();
        }
      } else {
        // Sign in: email state holds username or email
        const identifier = email.trim();
        if (!identifier || !password) {
          setError("Please enter your username/email and password.");
          setSubmitting(false);
          return;
        }

        const res = await signIn(identifier, password);
        if (res.error) {
          setError(res.error);
        } else {
          handleClose();
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
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div 
        className="relative w-full max-w-md bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-t-[32px] sm:rounded-3xl border-t sm:border border-zinc-200 dark:border-zinc-800/90 shadow-2xl overflow-hidden p-6 sm:p-7 pb-safe animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 text-zinc-900 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto -mt-2 mb-4 sm:hidden shrink-0" />

        {/* Subtle Ambient Card Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-transparent via-violet/60 to-transparent rounded-full" />

        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800/80 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5 flex flex-col items-center text-center">
          <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800/80 shadow-inner mb-3">
            <Logo size={36} showWordmark={false} />
          </div>
          <h2 className="font-display font-bold text-2xl text-zinc-900 dark:text-white tracking-tight">
            {mode === "signup"
              ? "Join the Weirdness Index"
              : mode === "forgot"
              ? "Reset Your Password"
              : "Welcome back to Weca"}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs font-sans">
            {mode === "signup"
              ? "Share genuine anomalies and start earning Weird Credits."
              : mode === "forgot"
              ? "Enter your email and we'll send you a password reset link."
              : "Sign in to score anomalies, like, and comment."}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Verification Sent Banner */}
        {confirmationSent && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center animate-in fade-in">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
              Check Your Inbox
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-400/90 leading-relaxed mb-3">
              We sent a verification link to <strong className="font-mono">{email}</strong>. Click the link to activate your account and start exploring.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="py-2 px-4 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-500 transition-colors min-h-[44px]"
            >
              Done
            </button>
          </div>
        )}

        {/* Reset Password Sent Banner */}
        {resetSent && (
          <div className="mb-5 p-4 rounded-2xl bg-violet/10 border border-violet/30 text-center animate-in fade-in">
            <CheckCircle2 className="w-8 h-8 text-violet mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
              Reset Link Sent
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              We dispatched a secure reset link to <strong className="font-mono text-zinc-900 dark:text-zinc-200">{email}</strong>. Follow the instructions in the email to set a new password.
            </p>
            <button
              type="button"
              onClick={() => {
                setResetSent(false);
                setMode("signin");
              }}
              className="py-2 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs hover:bg-zinc-800 transition-colors min-h-[44px]"
            >
              Back to Sign In
            </button>
          </div>
        )}

        {!confirmationSent && !resetSent && (
          <>
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Sign Up: Unique Username (Primary & Required) */}
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center justify-between">
                    <span className="font-semibold text-zinc-900 dark:text-white">Unique Username</span>
                    <span className="text-[10px] text-violet font-mono font-medium">Required</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. anomaly_hunter"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800/90 rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/40 transition-all font-mono min-h-[44px]"
                    />
                  </div>
                </div>
              )}

              {/* Sign In & Forgot Mode: Username or Email */}
              {mode !== "signup" && (
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    {mode === "signin" ? "Username or Email" : "Your Username or Email"}
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Enter username or email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800/90 rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/40 transition-all min-h-[44px]"
                    />
                  </div>
                </div>
              )}

              {mode !== "forgot" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Password
                    </label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode("forgot");
                          setError(null);
                        }}
                        className="text-[11px] text-violet hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800/90 rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/40 transition-all font-mono min-h-[44px]"
                    />
                  </div>
                </div>
              )}

              {/* Sign Up: Optional Email Address */}
              {mode === "signup" && (
                <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center justify-between">
                    <span>Email Address</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">Optional</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      placeholder="you@example.com (optional recovery)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800/90 rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/40 transition-all min-h-[44px]"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
                    Optional. Used only for password recovery or announcements.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] disabled:opacity-50 cursor-pointer min-h-[44px]"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 dark:border-zinc-900/30 border-t-white dark:border-t-zinc-900 rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {mode === "signup"
                        ? "Create Account"
                        : mode === "forgot"
                        ? "Send Reset Link"
                        : "Sign In"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-center">
              {mode === "forgot" ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                  }}
                  className="text-xs text-violet font-semibold hover:underline cursor-pointer min-h-[44px] inline-flex items-center"
                >
                  ← Return to Sign In
                </button>
              ) : (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {mode === "signup" ? "Already have an account?" : "Don't have an account yet?"}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === "signup" ? "signin" : "signup");
                      setError(null);
                    }}
                    className="text-violet font-semibold hover:underline cursor-pointer min-h-[44px] inline-flex items-center"
                  >
                    {mode === "signup" ? "Sign In" : "Create Account"}
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
