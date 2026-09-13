"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Check, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Layers, 
  Eye, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  Briefcase,
  Download,
  Flame,
  Star
} from "lucide-react";

export const ProView: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "What is 'Stock Weirdness' licensing?",
      a: "Weca provides a commercial clearinghouse for real, candid, un-staged anomalies. Creative studios, advertising agencies, and editorial publications can legally license verified real-world curiosities directly from the original spotters, with 70% of royalty revenues going directly to the creator via Stripe Connect."
    },
    {
      q: "Can I cancel my Hunter Pro subscription anytime?",
      a: "Yes. Hunter Pro can be cancelled at any time from your account dashboard with zero lock-in or cancellation penalties. Your pro privileges remain active until the end of your billing cycle."
    },
    {
      q: "Does Hunter Pro influence my AI Weirdness Score?",
      a: "Absolutely not. The Gemini Vision Weirdness Engine scores purely on 5 objective dimensions of the subject matter. Paying for Pro gives you deeper tensor analytics and priority queue processing, but does not manipulate or inflate scores."
    },
    {
      q: "How does the creator royalty split work?",
      a: "When a Brand or Studio licenses one of your approved findings through our marketplace, you receive 70% of the licensing fee directly into your Stripe Connect account within 48 hours."
    }
  ];

  return (
    <div className="w-full space-y-12">
      {/* Billing Switcher */}
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="flex items-center gap-3 p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              billingCycle === "monthly"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle("annual")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              billingCycle === "annual"
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <span>Annual Billing</span>
            <span className="px-2 py-0.5 rounded-full bg-cyan text-zinc-950 text-[10px] font-bold">
              SAVE 20%
            </span>
          </button>
        </div>
        <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
          All plans include optical verification & zero generative AI guarantee.
        </p>
      </div>

      {/* 3 Tier Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FREE OBSERVER */}
        <div className="p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-mono font-bold">
                Observer
              </span>
            </div>
            <h3 className="font-display font-black text-2xl text-zinc-900 dark:text-white mb-2">Free</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
              For everyday curious observers browsing the global archive and submitting local findings.
            </p>

            <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-4xl font-black font-display text-zinc-900 dark:text-white">$0</span>
              <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">/forever</span>
            </div>

            <ul className="space-y-3 text-xs font-mono text-zinc-600 dark:text-zinc-300 mb-8">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Unlimited World Feed & Map browsing</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Submit photos for 5-D Gemini Vision scoring</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Vote in daily Versus battles (+5 WC)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Standard resolution downloads</span>
              </li>
            </ul>
          </div>

          <Link
            href="/"
            className="w-full py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800/50 font-mono text-xs font-bold text-center block transition-all"
          >
            Start Exploring Free
          </Link>
        </div>

        {/* HUNTER PRO (HIGHLIGHTED) */}
        <div className="p-8 rounded-3xl border-2 border-violet bg-white dark:bg-zinc-900 relative flex flex-col justify-between shadow-xl scale-102">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-violet text-white text-[11px] font-mono font-bold tracking-wide shadow-md flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            <span>MOST POPULAR</span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <span className="px-3 py-1 rounded-full bg-violet/10 text-violet text-xs font-mono font-bold">
                Hunter Pro
              </span>
            </div>
            <h3 className="font-display font-black text-2xl text-zinc-900 dark:text-white mb-2">Pro Hunter</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
              For dedicated anomaly hunters, naturalists, and researchers demanding raw vision intelligence.
            </p>

            <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-4xl font-black font-display text-zinc-900 dark:text-white">
                {billingCycle === "annual" ? "$7" : "$9"}
              </span>
              <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
                /month {billingCycle === "annual" ? "(billed annually)" : ""}
              </span>
            </div>

            <ul className="space-y-3 text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-8">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-violet shrink-0" />
                <span>Full raw Gemini Vision tensor telemetry breakdown</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-violet shrink-0" />
                <span>Priority scoring queue (under 400ms latency)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-violet shrink-0" />
                <span>4K uncompressed original downloads</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-violet shrink-0" />
                <span>Ad-free global browsing</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-violet shrink-0" />
                <span>2x Versus battle vote weighting</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-violet shrink-0" />
                <span>Exclusive verified Pro Hunter profile aura</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => alert("Weca Pro Stripe checkout demonstration initialized!")}
            className="w-full py-3.5 px-4 rounded-xl bg-violet hover:bg-violet/90 text-white font-mono text-xs font-bold text-center block transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Upgrade to Pro
          </button>
        </div>

        {/* BRAND & STUDIO */}
        <div className="p-8 rounded-3xl border border-zinc-800 bg-zinc-950 text-white flex flex-col justify-between hover:border-zinc-700 transition-all shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-cyan/20 text-cyan border border-cyan/40 text-xs font-mono font-bold">
                Commercial
              </span>
            </div>
            <h3 className="font-display font-black text-2xl text-white mb-2">Brand & Studio</h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              Commercial licensing of real-world curiosities for advertising campaigns, editorial, and films.
            </p>

            <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-zinc-800">
              <span className="text-4xl font-black font-display text-white">
                {billingCycle === "annual" ? "$39" : "$49"}
              </span>
              <span className="text-xs font-mono text-zinc-500">
                /month {billingCycle === "annual" ? "(billed annually)" : ""}
              </span>
            </div>

            <ul className="space-y-3 text-xs font-mono text-zinc-300 mb-8">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-cyan shrink-0" />
                <span>Commercial usage rights for all licensed anomalies</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-cyan shrink-0" />
                <span>Direct Stripe Connect creator royalty pipeline</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-cyan shrink-0" />
                <span>Sponsor a weekly featured Versus showdown</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-cyan shrink-0" />
                <span>Dedicated anomaly research concierge</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => alert("Brand partnership team contacted: team@weca.world")}
            className="w-full py-3 px-4 rounded-xl bg-cyan hover:bg-cyan/90 text-zinc-950 font-mono text-xs font-bold text-center block transition-all active:scale-95 cursor-pointer"
          >
            Contact Brand Licensing
          </button>
        </div>
      </div>

      {/* STOCK WEIRDNESS SHOWCASE */}
      <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800">
        <div className="max-w-3xl mb-6">
          <div className="flex items-center gap-2 text-violet font-mono text-xs font-bold uppercase tracking-wider mb-2">
            <Briefcase className="w-4 h-4" />
            <span>The Stock Weirdness Marketplace</span>
          </div>
          <h3 className="font-display font-bold text-2xl text-zinc-900 dark:text-white mb-2">
            The World&apos;s Only Real-World Surrealism Marketplace
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Brands tired of generic stock imagery and synthetic AI hallucination turn to Weca&apos;s catalog of 14,000+ verified candid photographs for campaigns that stop the scroll with authentic wonder.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <img
              src="https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=80"
              alt="Lava Phone"
              className="w-full aspect-square rounded-xl object-cover mb-2"
            />
            <div className="text-[11px] font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate">Basalt Lava Phone</div>
            <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">Editorial & Ad Rights</div>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <img
              src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80"
              alt="Limestone Fungi"
              className="w-full aspect-square rounded-xl object-cover mb-2"
            />
            <div className="text-[11px] font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate">Inverted Fungi</div>
            <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">Nature Series Rights</div>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <img
              src="https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=500&auto=format&fit=crop&q=80"
              alt="Albino Crow"
              className="w-full aspect-square rounded-xl object-cover mb-2"
            />
            <div className="text-[11px] font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate">Albino Crow</div>
            <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">Album Art Rights</div>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <img
              src="https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80"
              alt="Square Melon"
              className="w-full aspect-square rounded-xl object-cover mb-2"
            />
            <div className="text-[11px] font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate">Cubic Melon</div>
            <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">Culinary Campaign</div>
          </div>
        </div>
      </div>

      {/* FAQ SECTION */}
      <div className="max-w-3xl mx-auto space-y-4 pt-4">
        <h3 className="font-display font-bold text-2xl text-zinc-900 dark:text-white text-center mb-6">
          Frequently Asked Questions
        </h3>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 flex items-center justify-between text-left font-display font-bold text-sm text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                  )}
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed border-t border-zinc-100 dark:border-zinc-800">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
