import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Scale, FileText, ArrowRight, ShieldCheck } from "lucide-react";

import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Terms of Service — Platform Agreement",
  description:
    "Read the Weca Terms of Service: user photo ownership, licensing, Weird Credit rules, acceptable use, and platform disclaimers.",
  alternates: {
    canonical: `${SITE_URL}/terms`,
  },
  openGraph: {
    title: `Terms of Service — Platform Agreement | ${SITE_NAME}`,
    description:
      "Read the Weca Terms of Service: user photo ownership, licensing, Weird Credit rules, acceptable use, and platform disclaimers.",
    url: `${SITE_URL}/terms`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Terms of Service — Platform Agreement | ${SITE_NAME}`,
    description:
      "Read the Weca Terms of Service: user photo ownership, licensing, Weird Credit rules, acceptable use, and platform disclaimers.",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Terms of Service", path: "/terms" },
        ]}
      />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
        {/* Header */}
        <div className="mb-12 border-b border-zinc-200 dark:border-zinc-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-mono mb-4">
            <Scale className="w-3.5 h-3.5 text-cyan" />
            <span>Effective Date: January 1, 2026</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl text-zinc-900 dark:text-white tracking-tight mb-4">
            Weca Terms of Service
          </h1>

          <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg leading-relaxed">
            Welcome to Weca. These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of Weca&apos;s website, mobile applications, and AI vision scoring services.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-10 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-zinc-900 dark:text-white">
              1. Acceptance & Eligibility
            </h2>
            <p>
              By accessing Weca or creating an account, you enter into a legally binding agreement with Weca Inc. You must be at least 13 years of age (or the minimum age of digital consent in your jurisdiction) to use the platform.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-zinc-900 dark:text-white">
              2. Your Content & Intellectual Property Ownership
            </h2>
            <p className="font-semibold text-zinc-900 dark:text-white">
              You own your photos. Weca does not claim ownership over the images you capture.
            </p>
            <p>
              By uploading media to Weca, you grant Weca a worldwide, non-exclusive, royalty-free, transferable license to store, process, display, analyze with AI models, and catalog your submissions on the public World Feed and anomaly directory.
            </p>
            <p>
              You represent and warrant that you hold all necessary rights, permissions, or copyright to any media you submit, and that your uploads do not infringe upon any third party&apos;s intellectual property or privacy rights.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-zinc-900 dark:text-white">
              3. Acceptable Use & Banned Conduct
            </h2>
            <p>You agree not to engage in any of the following prohibited behaviors:</p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-600 dark:text-zinc-400">
              <li>
                <strong>Synthetic Deception:</strong> Uploading AI-generated, deepfaked, or heavily Photoshopped imagery disguised as candid physical occurrences.
              </li>
              <li>
                <strong>Trespassing & Dangerous Acts:</strong> Breaking local laws, trespassing on private or sacred grounds, or endangering wildlife to photograph an anomaly.
              </li>
              <li>
                <strong>Sybil Manipulation:</strong> Creating fraudulent accounts to manipulate scores, farm Weird Credits, or spam comments.
              </li>
              <li>
                <strong>Unauthorized Scraping:</strong> Automated extraction of platform imagery without explicit written consent.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-zinc-900 dark:text-white">
              4. Weird Credits (WC) & Virtual Items
            </h2>
            <p>
              Weird Credits (WC) are virtual platform recognition points awarded for discovering anomalies. Weird Credits:
            </p>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-xs font-mono space-y-1 text-zinc-600 dark:text-zinc-400">
              <p>• Have no cash, monetary, or fiat value.</p>
              <p>• Cannot be sold, transferred, or exchanged for real currency.</p>
              <p>• May be revoked or recalibrated at Weca&apos;s sole discretion in cases of fraudulent submissions.</p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-zinc-900 dark:text-white">
              5. Disclaimer of Warranties & AI Verdicts
            </h2>
            <p>
              Weca is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis. While our Gemini Vision engine analyzes anomalies rigorously, AI verdicts, rarity scores, and classifications are intended for entertainment, curiosity, and cultural indexing.
            </p>
            <p>
              Weca makes no representations regarding the definitive scientific, geological, or historical authenticity of user-submitted anomalies.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-zinc-900 dark:text-white">
              6. Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by applicable law, Weca Inc., its officers, and affiliates shall not be liable for any indirect, incidental, punitive, or consequential damages arising out of your use of the platform.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <h2 className="font-display font-bold text-xl text-zinc-900 dark:text-white">
              7. Legal Contact
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              If you have questions regarding these terms, contact our legal counsel at:
            </p>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-xs text-zinc-900 dark:text-zinc-100 inline-block">
              legal@weca.app • Subject: Terms Inquiry
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <section className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/privacy"
            className="flex items-center gap-1.5 text-xs font-semibold text-violet hover:underline"
          >
            <span>Read Privacy Policy</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/community-guidelines"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <span>Review Community Guidelines</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
