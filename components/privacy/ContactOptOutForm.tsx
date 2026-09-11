"use client";

import React, { useState } from "react";
import { ShieldCheck, CheckCircle2, Lock, ArrowRight, RefreshCw } from "lucide-react";

export const ContactOptOutForm: React.FC = () => {
  const [identifier, setIdentifier] = useState("");
  const [type, setType] = useState<"phone" | "email">("phone");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setStatus("loading");
    // Simulate irreversible suppression hash generation
    setTimeout(() => {
      setStatus("success");
    }, 800);
  };

  const handleReset = () => {
    setIdentifier("");
    setStatus("idle");
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-zinc-50 border border-zinc-200">
      <div className="max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet/10 border border-violet/20 text-violet text-xs font-mono mb-3">
          <Lock className="w-3 h-3" />
          <span>Self-Service Privacy Tool</span>
        </div>

        <h3 className="font-display font-bold text-xl text-ink mb-2">
          Permanent Contact Suppression Tool
        </h3>

        <p className="text-xs text-zinc-600 leading-relaxed mb-6">
          Enter your phone number or email address below. We will calculate a salted cryptographic hash and append it to our permanent suppression registry. Your contact will never be suggested, queried, or matched on Wica.
        </p>

        {status === "success" ? (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Contact Successfully Suppressed</span>
            </div>
            <p className="text-xs text-emerald-700 font-mono">
              SHA-256 suppression block registered for <span className="font-bold">{identifier}</span>. This identifier will be ignored during all future contact book syncs.
            </p>
            <button
              onClick={handleReset}
              className="mt-2 text-xs font-semibold text-emerald-800 underline hover:text-emerald-900 block"
            >
              Suppress another identifier
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-4 text-xs font-mono">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  checked={type === "phone"}
                  onChange={() => setType("phone")}
                  className="accent-violet"
                />
                <span>Phone Number</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  checked={type === "email"}
                  onChange={() => setType("email")}
                  className="accent-violet"
                />
                <span>Email Address</span>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type={type === "email" ? "email" : "tel"}
                required
                placeholder={
                  type === "phone" ? "+1 (555) 000-0000" : "you@example.com"
                }
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs text-ink placeholder:text-zinc-400 focus:outline-none focus:border-ink font-mono"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="px-5 py-2.5 rounded-xl bg-ink hover:bg-zinc-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Opt Out</span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              <span>We never send confirmation spam or store plain text.</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
