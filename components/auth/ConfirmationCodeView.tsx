"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Globe, ChevronDown, CheckCircle2, RefreshCw } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

interface ConfirmationCodeViewProps {
  email: string;
  onBack: () => void;
  onConfirm: (code: string) => Promise<{ error?: string } | void>;
  onResend?: () => void;
}

export const ConfirmationCodeView: React.FC<ConfirmationCodeViewProps> = ({
  email,
  onBack,
  onConfirm,
  onResend,
}) => {
  const router = useRouter();
  const [code, setCode] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Please enter the confirmation code");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const res = await onConfirm(code.trim());
      if (res && res.error) {
        setError(res.error);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to confirm code";
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = () => {
    if (resendCooldown > 0) return;
    setResendCooldown(30);
    setResendMessage(`A new 6-digit confirmation code was sent to ${email}`);
    onResend?.();
    setTimeout(() => setResendMessage(null), 5000);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-ink font-sans selection:bg-violet/20">
      
      {/* Top Header Row with Back Arrow */}
      <header className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-zinc-100 text-zinc-700 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 text-zinc-800">
          <Logo size={20} showWordmark={true} />
        </div>

        <div className="w-9" /> {/* Spacer for symmetry */}
      </header>

      {/* Main Content Card Container */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-[420px] mx-auto text-left">
          
          {/* Headline */}
          <h1 className="font-display font-bold text-2xl sm:text-[28px] text-ink tracking-tight mb-2">
            Enter the confirmation code
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-[13px] text-zinc-600 leading-relaxed mb-6">
            To confirm your account, enter the 6-digit code we sent to{" "}
            <span className="font-semibold text-ink font-mono">{email || "your email"}</span>.
          </p>

          {/* Demo hint banner */}
          <div className="mb-5 p-3 rounded-xl bg-violet/5 border border-violet/20 text-xs text-violet font-medium flex items-center justify-between">
            <span>Demo Test Code: <strong className="font-mono">123456</strong></span>
            <button
              type="button"
              onClick={() => setCode("123456")}
              className="text-[11px] underline font-semibold hover:opacity-80"
            >
              Auto-fill
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
              {error}
            </div>
          )}

          {/* Resend success notice */}
          {resendMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{resendMessage}</span>
            </div>
          )}

          {/* Code Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="code" className="sr-only">
                Confirmation code
              </label>
              <input
                id="code"
                type="text"
                maxLength={6}
                autoFocus
                placeholder="Confirmation code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-3.5 text-base sm:text-lg tracking-widest font-mono bg-zinc-50/80 border border-zinc-200 rounded-xl focus:outline-none focus:bg-white focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:text-zinc-400 text-ink"
              />
            </div>

            {/* Confirm Primary Button */}
            <button
              type="submit"
              disabled={submitting || code.length < 4}
              className="w-full py-3 px-4 rounded-xl bg-violet hover:bg-violet/90 text-white font-semibold text-sm shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? "Verifying code..." : "Confirm"}
            </button>

            {/* Didn't get the code Secondary Button */}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-ink font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${resendCooldown > 0 ? "animate-spin" : ""}`} />
              <span>
                {resendCooldown > 0
                  ? `Resend available in ${resendCooldown}s`
                  : "Didn't get the code"}
              </span>
            </button>
          </form>

          {/* Already have an account link */}
          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="text-xs font-semibold text-violet hover:underline transition-colors"
            >
              Already have an account?
            </Link>
          </div>

        </div>
      </main>

      {/* Standard Minimal Footer */}
      <footer className="w-full py-8 text-xs text-zinc-400 border-t border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col items-center gap-4 text-center">
          <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-[11px] text-zinc-500">
            <Link href="/" className="hover:text-ink transition-colors">World Feed</Link>
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
