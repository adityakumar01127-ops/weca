import React from "react";
import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { WalletView } from "@/components/wallet/WalletView";
import { Wallet } from "lucide-react";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Weird Credits Wallet & Economy — Rewards Ledger",
  description:
    "Track your Weird Credits balance, unlock tier milestones, review immutable credit ledgers, and manage creator cash conversions.",
  alternates: {
    canonical: `${SITE_URL}/wallet`,
  },
  openGraph: {
    title: `Weird Credits Wallet & Economy — Rewards Ledger | ${SITE_NAME}`,
    description:
      "Track your Weird Credits balance, unlock tier milestones, and review immutable credit ledgers.",
    url: `${SITE_URL}/wallet`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Weird Credits Wallet & Economy — Rewards Ledger | ${SITE_NAME}`,
    description:
      "Track your Weird Credits balance, unlock tier milestones, and review immutable credit ledgers.",
  },
};

export default function WalletPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-violet/20 transition-colors duration-200">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Weird Credits Wallet", path: "/wallet" },
        ]}
      />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Title Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet/10 border border-violet/20 text-violet text-xs font-mono mb-3">
            <Wallet className="w-3.5 h-3.5" />
            <span>Weird Credits & Creator Economy</span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-zinc-900 dark:text-white tracking-tight leading-[1.1] mb-3">
            The Rewards Wallet: <span className="underline decoration-violet decoration-wavy underline-offset-6">Earned Candor.</span>
          </h1>

          <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base max-w-2xl">
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
