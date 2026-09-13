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
    signInWithOAuth,
    resetPassword,
    authModalMode,
  } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [oauthLoading, setOauthLoading] = useState<boolean>(false);
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

  const handleOAuth = async (provider: "google" | "github") => {
    setError(null);
    setOauthLoading(true);
    try {
      const res = await signInWithOAuth(provider);
      if (res.error) {
        setError(res.error);
        setOauthLoading(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "OAuth sign-in failed");
      setOauthLoading(false);
    }
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
        if (!email.trim() || !email.includes("@")) {
          setError("Please provide a valid email address.");
          setSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters long.");
          setSubmitting(false);
          return;
        }

        const res = await signUp(email.trim(), password, cleanUsername);
        if (res.error) {
          setError(res.error);
        } else if (res.requiresEmailConfirmation) {
          setConfirmationSent(true);
        } else {
          handleClose();
        }
      } else {
        // Sign in
        const effectiveEmail = email.includes("@") ? email.trim() : `${email.trim()}@wica.ai`;
        const res = await signIn(effectiveEmail, password);
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
            {/* Google OAuth Quick Sign In */}
            {mode !== "forgot" && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => handleOAuth("google")}
                  disabled={oauthLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border border-zinc-200 hover:border-zinc-300 dark:bg-zinc-950/80 dark:hover:bg-zinc-800/80 dark:text-zinc-200 dark:border-zinc-800 dark:hover:border-zinc-700 text-xs font-semibold flex items-center justify-center gap-2.5 transition-all shadow-xs active:scale-[0.98] cursor-pointer min-h-[44px]"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{oauthLoading ? "Connecting..." : "Continue with Google"}</span>
                </button>

                <div className="relative my-4 flex items-center justify-center">
                  <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
                  <span className="bg-white/95 dark:bg-zinc-900/95 px-2.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 relative">
                    or with email
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. anomaly_hunter"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800/90 rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/40 transition-all font-mono min-h-[44px]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800/90 rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/40 transition-all min-h-[44px]"
                  />
                </div>
              </div>

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
