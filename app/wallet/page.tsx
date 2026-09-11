import React from "react";
import type { Metadata } from "next";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { Footer } from "@/components/layout/Footer";
import { WalletView } from "@/components/wallet/WalletView";
import { Wallet, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Weird Credits Wallet & Economy — Rewards Ledger | Wica",
  description: "Track your Weird Credits balance, unlock tier milestones, review immutable credit ledgers, and simulate Stripe Connect cash conversions.",
};

export default function WalletPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-ink">
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Title Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet/10 border border-violet/20 text-violet text-xs font-mono mb-3">
            <Wallet className="w-3.5 h-3.5" />
            <span>Weird Credits & Creator Economy</span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-ink tracking-tight leading-[1.1] mb-3">
            The Rewards Wallet: <span className="underline decoration-violet decoration-wavy underline-offset-6">Earned Candor.</span>
          </h1>

          <p className="text-zinc-600 text-sm sm:text-base max-w-2xl">
            Weird Credits (WC) reward observers for observational serendipity. Earned through verified real-world findings, Versus predictions, and community endorsements.
          </p>
        </div>

        {/* Wallet View Component */}
        <WalletView />
      </main>

      <Footer />
    </div>
  );
}
