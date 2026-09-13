import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageSquare, MapPin, Clock, ShieldCheck, Phone, ArrowRight, Send } from "lucide-react";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us & Support — Weca",
  description:
    "Get in touch with the Weca engineering, support, and creator monetization team for payment assistance, partnerships, or anomalies.",
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
  openGraph: {
    title: `Contact Us & Support | ${SITE_NAME}`,
    description:
      "Get in touch with the Weca engineering, support, and creator monetization team for payment assistance, partnerships, or anomalies.",
    url: `${SITE_URL}/contact`,
    siteName: SITE_NAME,
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen w-full min-w-0 bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Contact Us", path: "/contact" },
        ]}
      />
      <div className="max-w-4xl w-full min-w-0 mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        {/* Header */}
        <div className="mb-12 border-b border-zinc-200 dark:border-zinc-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-mono mb-4">
            <Mail className="w-3.5 h-3.5 text-cyan" />
            <span>Official Support & Platform Grievance Desk</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl text-zinc-900 dark:text-white tracking-tight mb-4">
            Contact Weca
          </h1>

          <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg leading-relaxed">
            Have a question regarding your Hunter Pro subscription, Razorpay payment verification, Weird Credits balance, or brand licensing? Our team is here to assist.
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1: Support Email */}
          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center text-cyan mb-4">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-white mb-1">
                Customer Support
              </h3>
              <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                For account issues, billing questions, and Razorpay payment queries.
              </p>
            </div>
            <div>
              <a
                href="mailto:support@weca.world"
                className="font-mono text-xs text-cyan hover:underline font-bold block"
              >
                support@weca.world
              </a>
              <span className="text-[11px] font-mono text-zinc-400">Response within 24 hours</span>
            </div>
          </div>

          {/* Card 2: Partnerships & Licensing */}
          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-violet/10 border border-violet/20 flex items-center justify-center text-violet mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-white mb-1">
                Brand & Licensing
              </h3>
              <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                For creative agencies, studios, and editorial anomaly rights clearance.
              </p>
            </div>
            <div>
              <a
                href="mailto:licensing@weca.world"
                className="font-mono text-xs text-violet hover:underline font-bold block"
              >
                licensing@weca.world
              </a>
              <span className="text-[11px] font-mono text-zinc-400">Commercial inquiries</span>
            </div>
          </div>

          {/* Card 3: Operating Hours */}
          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-white mb-1">
                Operating Schedule
              </h3>
              <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                Platform operations and payment reconciliation windows.
              </p>
            </div>
            <div className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
              <div>Mon – Sat: 09:30 – 19:00 IST</div>
              <div className="text-[11px] text-zinc-400">Automated systems run 24/7/365</div>
            </div>
          </div>
        </div>

        {/* Support Request Form */}
        <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 mb-12">
          <h2 className="font-display font-bold text-2xl text-zinc-900 dark:text-white mb-2">
            Send an Inquiry
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
            Fill out the form below and our customer care team will respond directly to your registered email address.
          </p>

          <ContactForm />
        </div>

        {/* Corporate / Grievance Officer Details */}
        <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 space-y-2 font-mono">
          <div className="font-bold text-zinc-700 dark:text-zinc-300">
            Platform Operator & Grievance Redressal:
          </div>
          <div>Weca Technologies & AI Research Platform</div>
          <div>In accordance with Information Technology Rules & Razorpay Compliance Guidelines</div>
          <div>Official contact: <a href="mailto:support@weca.world" className="text-cyan underline">support@weca.world</a></div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <Link href="/terms" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
            Terms of Service
          </Link>
          <Link href="/cancellation-and-refund" className="text-cyan hover:underline flex items-center gap-1">
            <span>Cancellation & Refund Policy</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
