"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Gem, Sparkles, Loader2, Check } from "lucide-react";
import confetti from "canvas-confetti";
import { INTERACTION_CREDITS } from "@/lib/credits";

interface SuperLikeButtonProps {
  postId: string;
  creatorUsername?: string;
  className?: string;
  compact?: boolean;
}

export const SuperLikeButton: React.FC<SuperLikeButtonProps> = ({
  postId,
  creatorUsername,
  className = "",
  compact = false,
}) => {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [sent, setSent] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const cost = INTERACTION_CREDITS.super_like; // 5 WC
  const userBalance = profile?.credits_balance ?? 0;

  const handleSuperLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push("/login");
      return;
    }

    if (userBalance < cost) {
      alert(`Super-Like costs ${cost} Weird Credits. Your current balance is ${userBalance} WC. Please top up in your Wallet!`);
      return;
    }

    if (loading || sent) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/earnings/super-like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send super-like");
      }

      setSent(true);

      // Confetti burst for super-like celebration
      confetti({
        particleCount: 50,
        spread: 45,
        origin: { y: 0.7 },
        colors: ["#22D3EE", "#A855F7", "#F59E0B"],
      });

      setTimeout(() => {
        setSent(false);
      }, 4000);
    } catch (err: any) {
      console.error("Super-like error:", err);
      setError(err.message || "Failed to send");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleSuperLike}
        disabled={loading || sent}
        title={sent ? "Super-Liked!" : `Super-Like (+${cost} WC tip to creator)`}
        className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer select-none active:scale-90 ${
          sent
            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
            : "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20"
        } ${className}`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : sent ? (
          <>
            <Check className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-bold">+5 WC</span>
          </>
        ) : (
          <>
            <Gem className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-bold">Tip 5WC</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleSuperLike}
        disabled={loading || sent}
        title={sent ? "Super-Liked!" : `Tip 5 WC Super-Like to @${creatorUsername || "creator"}`}
        className={`group inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer min-h-[44px] justify-center select-none active:scale-95 ${
          sent
            ? "bg-linear-to-r from-cyan-500/25 via-violet-500/25 to-pink-500/25 text-cyan-300 border border-cyan-400/50 shadow-lg shadow-cyan-950/40 font-bold"
            : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 shadow-xs"
        } ${className}`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
        ) : sent ? (
          <>
            <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
            <span>Super-Liked! (+5 WC)</span>
          </>
        ) : (
          <>
            <Gem className="w-4 h-4 text-cyan-400 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
            <span className="font-semibold">Super-Like</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              5 WC
            </span>
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full left-0 mt-1 z-20 px-2.5 py-1 rounded-lg bg-red-500/90 text-white text-[10px] font-mono whitespace-nowrap shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
};
