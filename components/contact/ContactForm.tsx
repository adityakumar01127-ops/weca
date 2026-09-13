"use client";

import React, { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("billing");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
        <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-white">
          Message Received!
        </h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
          Thank you, <strong className="text-zinc-900 dark:text-white">{fullName}</strong>. A confirmation has been logged for <strong className="text-zinc-900 dark:text-white">{email}</strong>. Our support concierge will reply within 24 business hours.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setMessage("");
          }}
          className="mt-2 text-xs font-mono text-cyan hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Full Name
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono focus:outline-hidden focus:border-cyan"
          />
        </div>
        <div>
          <label className="block text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono focus:outline-hidden focus:border-cyan"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
          Subject / Inquiry Type
        </label>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono focus:outline-hidden focus:border-cyan"
        >
          <option value="billing">Payment & Billing (Razorpay / Order Issue)</option>
          <option value="subscription">Hunter Pro Subscription</option>
          <option value="credits">Weird Credits & Payouts</option>
          <option value="commercial">Stock Weirdness Commercial Licensing</option>
          <option value="other">General Feedback / Inquiries</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
          Message / Details (Include Payment ID if applicable)
        </label>
        <textarea
          rows={4}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Please describe your question or issue in detail..."
          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono focus:outline-hidden focus:border-cyan"
        />
      </div>

      <button
        type="submit"
        className="py-3 px-6 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-mono text-xs font-bold transition-all hover:bg-zinc-800 dark:hover:bg-zinc-100 flex items-center gap-2 cursor-pointer active:scale-98"
      >
        <Send className="w-3.5 h-3.5" />
        <span>Submit Message</span>
      </button>
    </form>
  );
}
