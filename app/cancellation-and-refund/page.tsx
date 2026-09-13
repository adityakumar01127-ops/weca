import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { RotateCcw, ShieldCheck, HelpCircle, ArrowRight, Clock, CheckCircle } from "lucide-react";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy — Weca",
  description:
    "Review the Weca Cancellation and Refund Policy for Hunter Pro memberships, Weird Credit purchases, and creator licensing.",
  alternates: {
    canonical: `${SITE_URL}/cancellation-and-refund`,
  },
  openGraph: {
    title: `Cancellation & Refund Policy | ${SITE_NAME}`,
    description:
      "Review the Weca Cancellation and Refund Policy for Hunter Pro memberships, Weird Credit purchases, and creator licensing.",
    url: `${SITE_URL}/cancellation-and-refund`,
    siteName: SITE_NAME,
    type: "website",
  },
};

export default function CancellationAndRefundPage() {
  return (
    <div className="min-h-screen w-full min-w-0 bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Cancellation & Refund Policy", path: "/cancellation-and-refund" },
        ]}
      />
      <div className="max-w-4xl w-full min-w-0 mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        {/* Header */}
        <div className="mb-12 border-b border-zinc-200 dark:border-zinc-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-mono mb-4">
            <RotateCcw className="w-3.5 h-3.5 text-cyan" />
            <span>Updated: January 2026 • Razorpay Standard Compliance</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl text-zinc-900 dark:text-white tracking-tight mb-4">
            Cancellation & Refund Policy
          </h1>

          <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg leading-relaxed">
            At Weca (&ldquo;Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), we are committed to transparent and fair payment practices. This Cancellation and Refund Policy outlines your rights and procedures regarding digital subscriptions, Weird Credit top-ups, and commercial anomaly licensing.
          </p>
        </div>

        {/* Highlight Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold mb-2">
              <CheckCircle className="w-4 h-4" />
              <span>SUBSCRIPTIONS</span>
            </div>
            <h4 className="font-display font-bold text-zinc-900 dark:text-white text-base mb-1">Cancel Anytime</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Hunter Pro memberships can be cancelled anytime with zero hidden penalty. Benefits continue through your billing cycle.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-cyan font-mono text-xs font-bold mb-2">
              <Clock className="w-4 h-4" />
              <span>REFUND TIMELINE</span>
            </div>
            <h4 className="font-display font-bold text-zinc-900 dark:text-white text-base mb-1">5-7 Business Days</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Approved refunds are returned directly to the original payment source (UPI, Credit/Debit Card, Netbanking) via Razorpay.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-violet font-mono text-xs font-bold mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>DISPUTE SUPPORT</span>
            </div>
            <h4 className="font-display font-bold text-zinc-900 dark:text-white text-base mb-1">Human Concierge</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Billing discrepancies or double charges are addressed within 24 business hours by our verified finance operations.
            </p>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-10 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-zinc-900 dark:text-white flex items-center gap-2">
              <span className="font-mono text-xs text-cyan">01.</span>
              <span>Hunter Pro Subscription Cancellations</span>
            </h2>
            <p>
              Users may cancel their Weca Hunter Pro subscription (Monthly or Annual) at any time through their account settings or by submitting a written request to <a href="mailto:support@weca.world" className="text-cyan underline">support@weca.world</a>.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <strong>Immediate Cancellation:</strong> When you cancel, recurring billing is halted immediately. No further automatic charges will occur.
              </li>
              <li>
                <strong>Access Period:</strong> You retain full access to all Pro Hunter features (raw Gemini Vision telemetry, priority queue scoring, 4K asset downloads) until the end of the paid billing period.
              </li>
              <li>
                <strong>No Prorated Subscriptions:</strong> Standard subscription fees are non-refundable once an active billing cycle has commenced, except as stipulated under our 7-Day Money-Back Guarantee.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-zinc-900 dark:text-white flex items-center gap-2">
              <span className="font-mono text-xs text-cyan">02.</span>
              <span>7-Day Initial Satisfaction Guarantee</span>
            </h2>
            <p>
              If you purchase a Hunter Pro subscription for the first time and find that the platform does not meet your anomaly research needs, you are eligible for a full refund within seven (7) calendar days of the initial transaction, provided you have not initiated more than 10 commercial stock image downloads during that window.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-zinc-900 dark:text-white flex items-center gap-2">
              <span className="font-mono text-xs text-cyan">03.</span>
              <span>Weird Credits (WC) Purchases</span>
            </h2>
            <p>
              Weird Credits are digital platform tokens utilized for anomaly submissions, community versus voting boosts, and vision scoring acceleration:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <strong>Unused Balance:</strong> If you accidentally purchase a credit pack (e.g., 500 WC, 1,500 WC, 5,000 WC) and have not spent any portion of the credits, you may request a full refund within 48 hours of purchase.
              </li>
              <li>
                <strong>Partially Spent Credits:</strong> Once any portion of a purchased Weird Credit pack has been consumed (e.g., used to score an image or vote), the pack becomes non-refundable.
              </li>
              <li>
                <strong>Technical Failures:</strong> In the event of a gateway charge where credits were not automatically ledgered to your balance due to network latency, our automated reconciliation engine will credit your account or issue a full refund within 24 hours upon receiving your transaction ID.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-zinc-900 dark:text-white flex items-center gap-2">
              <span className="font-mono text-xs text-cyan">04.</span>
              <span>Refund Processing & Timelines</span>
            </h2>
            <p>
              All refunds are handled securely via our payment gateway partner, Razorpay.
            </p>
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono space-y-2">
              <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1">
                <span>Payment Mode</span>
                <span className="text-zinc-900 dark:text-white font-bold">Expected Refund Turnaround</span>
              </div>
              <div className="flex justify-between">
                <span>UPI (Google Pay, PhonePe, Paytm)</span>
                <span className="text-emerald-500 font-semibold">24 - 48 Hours</span>
              </div>
              <div className="flex justify-between">
                <span>Credit / Debit Cards (Visa, Mastercard, RuPay)</span>
                <span>5 - 7 Business Days</span>
              </div>
              <div className="flex justify-between">
                <span>Netbanking (All Major Indian Banks)</span>
                <span>3 - 5 Business Days</span>
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              * Note: Actual turnaround time depends on the issuing bank&apos;s settlement schedule.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-xl text-zinc-900 dark:text-white flex items-center gap-2">
              <span className="font-mono text-xs text-cyan">05.</span>
              <span>How to Request a Refund</span>
            </h2>
            <p>
              To initiate a refund request, please email our finance team at <a href="mailto:support@weca.world" className="text-cyan underline">support@weca.world</a> with the following details:
            </p>
            <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 text-xs font-mono">
              <ul className="space-y-1">
                <li>• Subject: Refund Request — [Your Registered Email]</li>
                <li>• Razorpay Payment ID (e.g. pay_xxxxxxxxxx)</li>
                <li>• Razorpay Order ID (e.g. order_xxxxxxxxxx)</li>
                <li>• Reason for refund request</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <Link href="/terms" className="text-cyan hover:underline flex items-center gap-1">
            <span>Read Terms of Service</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          <Link href="/contact" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
            Need Help? Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
