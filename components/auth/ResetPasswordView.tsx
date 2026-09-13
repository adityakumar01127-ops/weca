"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/brand/Logo";
import confetti from "canvas-confetti";
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";

export const ResetPasswordView: React.FC = () => {
  const router = useRouter();
  const { authUser, loading: authLoading, updatePassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please ensure both fields are identical.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await updatePassword(password);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        try {
          confetti({
            particleCount: 70,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#7C5CFC", "#22D3EE", "#10B981"],
          });
        } catch {}
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update password.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-violet/30 overflow-hidden font-sans p-4">
      {/* Background ambient glow */}
      <div 
        className="pointer-events-none absolute -top-40 left-1/3 w-[500px] h-[500px] bg-violet/10 rounded-full blur-[140px] opacity-70"
        aria-hidden="true" 
      />

      <div className="relative z-10 w-full max-w-md bg-white/90 dark:bg-zinc-900/80 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-transparent via-violet/50 to-transparent rounded-full" />

        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800/80 shadow-inner mb-3">
            <Logo size={36} showWordmark={false} />
          </div>
          <h1 className="font-display font-bold text-2xl text-zinc-900 dark:text-white tracking-tight">
            {success ? "Password Updated" : "Set New Password"}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans mt-1 max-w-xs">
            {success
              ? "Your security credentials have been updated successfully."
              : "Choose a strong password to secure your Weca researcher account."}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {success ? (
          <div className="space-y-4 text-center animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              You are now signed in with your new password. You can explore the feed or return to home.
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
            >
              <span>Continue to Feed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : !authLoading && !authUser ? (
          <div className="space-y-4 text-center animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              No active recovery session was detected. Your reset link may have expired or was already used.
            </p>
            <Link
              href="/login"
              className="inline-flex w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold text-xs shadow-md transition-all active:scale-[0.98] items-center justify-center gap-2 min-h-[44px]"
            >
              <span>Request New Reset Link</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800/90 rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/40 transition-all font-mono min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors cursor-pointer min-h-[44px] flex items-center"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength meter */}
              {password && (
                <div className="pt-1 space-y-1 animate-in fade-in">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-zinc-500">Security Rating:</span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{strength.label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden flex gap-0.5">
                    <div className={`h-full flex-1 rounded-full transition-all duration-300 ${strength.score >= 1 ? strength.color : "bg-zinc-200 dark:bg-zinc-800"}`} />
                    <div className={`h-full flex-1 rounded-full transition-all duration-300 ${strength.score >= 2 ? strength.color : "bg-zinc-200 dark:bg-zinc-800"}`} />
                    <div className={`h-full flex-1 rounded-full transition-all duration-300 ${strength.score >= 3 ? strength.color : "bg-zinc-200 dark:bg-zinc-800"}`} />
                    <div className={`h-full flex-1 rounded-full transition-all duration-300 ${strength.score >= 4 ? strength.color : "bg-zinc-200 dark:bg-zinc-800"}`} />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Confirm New Password
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800/90 rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/40 transition-all font-mono min-h-[44px]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold text-xs shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 dark:border-zinc-900/30 border-t-white dark:border-t-zinc-900 rounded-full animate-spin" />
              ) : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link href="/login" className="text-xs text-violet hover:underline">
                Return to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
