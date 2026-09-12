import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { ContactOptOutForm } from "@/components/privacy/ContactOptOutForm";
import { Users, Lock, ShieldCheck, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Learn More — Understanding Contact Uploads on Wica",
  description: "Learn how Wica handles address book synchronization, non-user privacy, cryptographic hashing, and how to opt out.",
};

export default function LearnMorePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet/10 border border-violet/20 text-violet text-xs font-mono mb-4">
            <Users className="w-3.5 h-3.5" />
            <span>Contact Information Disclosure</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl text-zinc-900 dark:text-white tracking-tight leading-[1.08] mb-6">
            Understanding <span className="underline decoration-violet decoration-wavy underline-offset-8">contact uploads</span> on Wica.
          </h1>

          <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg leading-relaxed">
            During account registration or onboarding, you may notice the disclosure: <em>&ldquo;People who use our service may have uploaded your contact information to Wica.&rdquo;</em> Here is an exact explanation of what that means and how your privacy is protected.
          </p>
        </div>

        {/* What Happens When a Friend Syncs Contacts */}
        <section className="mb-12 space-y-4">
          <h2 className="font-display font-bold text-2xl text-zinc-900 dark:text-white tracking-tight">
            How Contact Synchronization Works
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            When an active Wica user opts to sync their phone contacts, it helps them discover which of their friends are already active anomaly spotters on the platform.
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            To prevent storing plain text telephone numbers or email addresses, our system immediately converts each contact into an irreversible, salted cryptographic hash (SHA-256) on device or in transit.
          </p>
        </section>

        {/* Side-by-side DOs and DONTs */}
        <section className="mb-12 grid sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-800 dark:text-emerald-300 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>What Wica DOES</span>
            </div>
            <ul className="space-y-2 text-xs text-emerald-900 dark:text-emerald-200/90 leading-relaxed">
              <li>• Compares cryptographic hashes to match existing friends.</li>
              <li>• Automatically discards unmatched hashes after temporary matching windows.</li>
              <li>• Gives you complete control to opt out and purge your data.</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-800 dark:text-rose-300 mb-3">
              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>What Wica NEVER Does</span>
            </div>
            <ul className="space-y-2 text-xs text-rose-900 dark:text-rose-200/90 leading-relaxed">
              <li>• We NEVER sell or rent contact lists to data brokers or ad networks.</li>
              <li>• We NEVER send cold spam text messages or marketing emails to non-users.</li>
              <li>• We NEVER store unencrypted address books or plain-text names.</li>
            </ul>
          </div>
        </section>

        {/* Interactive Opt-Out Widget */}
        <section className="mb-16">
          <ContactOptOutForm />
        </section>

        {/* Bottom Navigation */}
        <section className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/privacy"
            className="flex items-center gap-1.5 text-xs font-semibold text-violet hover:underline"
          >
            <span>Read full Privacy Policy</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/terms"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <span>Review Terms of Service</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
