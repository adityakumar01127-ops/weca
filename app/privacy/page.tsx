import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Lock, Eye, FileText, ArrowRight, UserCheck } from "lucide-react";

import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Privacy Policy — Data Protection & Security",
  description:
    "Read the Weca Privacy Policy: understand how we process photos, AI vision inference data, contact uploads, and protect your digital privacy rights.",
  alternates: {
    canonical: `${SITE_URL}/privacy`,
  },
  openGraph: {
    title: `Privacy Policy — Data Autonomy & Transparency | ${SITE_NAME}`,
    description:
      "Read the Weca Privacy Policy: understand how we process photos, AI vision inference data, and protect your privacy rights.",
    url: `${SITE_URL}/privacy`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Privacy Policy — Data Autonomy & Transparency | ${SITE_NAME}`,
    description:
      "Read the Weca Privacy Policy: understand how we process photos, AI vision inference data, and protect your privacy rights.",
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Privacy Policy", path: "/privacy" },
        ]}
      />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
        {/* Header */}
        <div className="mb-12 border-b border-zinc-200 dark:border-zinc-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-mono mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-violet" />
            <span>Effective Date: January 1, 2026</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl text-zinc-900 dark:text-white tracking-tight mb-4">
            Weca Privacy Policy
          </h1>

          <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg leading-relaxed">
            Your privacy and digital autonomy are paramount. This policy outlines how Weca (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the Platform&rdquo;) collects, processes, and protects your information when you interact with our service.
          </p>
        </div>

        {/* Legal Body */}
        <div className="space-y-10 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-zinc-900 dark:text-white">
              1. Information We Collect
            </h2>
            <p>We collect information in three primary categories:</p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-600 dark:text-zinc-400">
              <li>
                <strong>Account Information:</strong> When you register, we collect your email address, username, encrypted password hashes, and optional avatar image.
              </li>
              <li>
                <strong>User Content & Photographic Media:</strong> Photos, captions, category tags, and optional geographic locations you upload to be scored on the Weca index.
              </li>
              <li>
                <strong>Contact Information:</strong> If you choose to sync your contacts or invite friends, we process phone numbers and email addresses using one-way cryptographic hashing (SHA-256). We never store unhashed address book contents.
              </li>
              <li>
                <strong>Technical Telemetry:</strong> IP addresses, browser user-agents, and access timestamps collected automatically for rate-limiting and bot prevention.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-zinc-900 dark:text-white">
              2. How AI & Gemini Vision Processes Your Images
            </h2>
            <p>
              When you submit an image for scoring, the raw media buffer is transmitted via secure encrypted channels to Google Gemini Vision APIs.
            </p>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-xs space-y-2 text-zinc-600 dark:text-zinc-400 font-mono">
              <p>• Visual inference is strictly ephemeral for score calculation.</p>
              <p>• Your personal photos are NOT used to train third-party advertising or commercial marketing models.</p>
              <p>• Evaluated dimensions (Absurdity, Rarity, Craft, Cultural Novelty, Wit) become public metadata attached to the submission.</p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-zinc-900 dark:text-white">
              3. Contact Uploads & Non-User Protection
            </h2>
            <p>
              Weca enables users to discover friends who are already active anomaly spotters. If an active user uploads their address book, our servers generate irreversibly salted hashes to detect matching accounts.
            </p>
            <p>
              If your contact information was uploaded by a friend and you do not hold a Weca account, your raw identity is never revealed. You may permanently suppress your phone number or email from our matching system at any time using our{" "}
              <Link href="/learn-more" className="text-violet hover:underline font-semibold">
                Contact Opt-Out Tool
              </Link>.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-zinc-900 dark:text-white">
              4. Data Sharing & Third-Party Processors
            </h2>
            <p>We do not sell, rent, or trade your personal data. We disclose information only under the following limited circumstances:</p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-600 dark:text-zinc-400">
              <li>
                <strong>Cloud Infrastructure:</strong> High-security cloud hosts including Supabase (PostgreSQL database with Row-Level Security) and Vercel (Edge delivery).
              </li>
              <li>
                <strong>Public Platform Display:</strong> Approved anomalies, usernames, and scores are publicly viewable on the World Feed.
              </li>
              <li>
                <strong>Legal Compliance:</strong> If compelled by valid court order or lawful governmental subpoena.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-zinc-900 dark:text-white">
              5. Your Global Privacy Rights (GDPR & CCPA)
            </h2>
            <p>Regardless of your geographic jurisdiction, Weca affords you complete control over your digital footprint:</p>
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
                <h4 className="font-bold text-zinc-900 dark:text-white mb-1">Right to Access & Portability</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Request a full machine-readable JSON export of all your submitted anomalies, scores, and profile activity.</p>
              </div>
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
                <h4 className="font-bold text-zinc-900 dark:text-white mb-1">Right to Erasure (Be Forgotten)</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Permanently delete your account, images, comments, and profile record with one click.</p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-zinc-900 dark:text-white">
              6. Security Standards
            </h2>
            <p>
              All traffic between your browser and Weca is encrypted using TLS 1.3. Database storage utilizes hardened Row-Level Security (RLS) policies ensuring no user can read or modify another user&apos;s private credentials.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <h2 className="font-display font-bold text-xl text-zinc-900 dark:text-white">
              7. Contact Our Data Protection Officer
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              For privacy requests, GDPR inquiries, or data deletion petitions, email our Data Protection team at:
            </p>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-xs text-zinc-900 dark:text-zinc-100 inline-block">
              privacy@weca.io • Subject: Privacy Request
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <section className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/terms"
            className="flex items-center gap-1.5 text-xs font-semibold text-violet hover:underline"
          >
            <span>Read Terms of Service</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/learn-more"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <span>Learn More about Contact Uploads</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
