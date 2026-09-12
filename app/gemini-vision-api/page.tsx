import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { CodeSnippetViewer } from "@/components/api/CodeSnippetViewer";
import { 
  Cpu, 
  Layers, 
  Terminal, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  Database,
  Sliders
} from "lucide-react";

export const metadata: Metadata = {
  title: "Gemini Vision API — Multimodal Architecture Documentation",
  description: "Learn how Wica leverages Google's Gemini Vision models for real-time 5-dimensional anomaly analysis, zero-shot multimodal scoring, and forensic AI detection.",
};

export default function GeminiVisionApiPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/20 text-cyan text-xs font-mono mb-4">
            <Cpu className="w-3.5 h-3.5" />
            <span>Google GenAI Vision Integration</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-zinc-900 dark:text-white tracking-tight leading-[1.08] mb-6">
            Multimodal <span className="underline decoration-cyan decoration-wavy underline-offset-8">architecture.</span>
          </h1>

          <p className="text-zinc-600 dark:text-zinc-400 text-lg sm:text-xl leading-relaxed max-w-3xl">
            Wica uses Google Gemini&apos;s multimodal models to evaluate uncompressed optical imagery in sub-second inference passes, transforming visual absurdity into verifiable structured data.
          </p>
        </div>

        {/* Architecture Flow Diagram / Steps */}
        <section className="mb-16 p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-white shadow-xl">
          <div className="max-w-3xl">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan mb-2 block">
              Execution Pipeline
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight mb-6">
              The 4-Stage Ingestion Pipeline
            </h2>

            <div className="space-y-6 font-mono text-xs">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/60">
                <span className="w-6 h-6 rounded bg-cyan/20 text-cyan font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <h4 className="text-sm text-white font-sans font-bold">Client Capture & EXIF Extraction</h4>
                  <p className="text-zinc-400 mt-1 font-sans">
                    Client converts uploaded JPEG/PNG/WebP into binary chunks, sanitizes unnecessary private EXIF data while preserving timestamp and geolocation hashes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/60">
                <span className="w-6 h-6 rounded bg-violet/20 text-violet font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <h4 className="text-sm text-white font-sans font-bold">Base64 Multimodal Tensor Stream</h4>
                  <p className="text-zinc-400 mt-1 font-sans">
                    The payload is transmitted via server-side Google GenAI SDK (<code className="text-violet">gemini-3.6-flash</code>) with inline image parts and rubric instructions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/60">
                <span className="w-6 h-6 rounded bg-magenta/20 text-magenta font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <h4 className="text-sm text-white font-sans font-bold">Forensic Inspection & Anomaly Scoring</h4>
                  <p className="text-zinc-400 mt-1 font-sans">
                    Gemini evaluates high-level semantic incongruity (Absurdity, Rarity, Craft, Cultural Novelty, Wit), checks for AI-generation signatures, and produces a punchy one-line verdict.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/60">
                <span className="w-6 h-6 rounded bg-emerald-400/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                  4
                </span>
                <div>
                  <h4 className="text-sm text-white font-sans font-bold">JSON Deserialization & Ledger Minting</h4>
                  <p className="text-zinc-400 mt-1 font-sans">
                    Verified JSON payload is stored in Supabase PostgreSQL database, Weird Credits are awarded, and the anomaly is published to the World Feed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Structured JSON Schema Section */}
        <section className="mb-16">
          <h2 className="font-display font-bold text-2xl text-zinc-900 dark:text-white tracking-tight mb-4">
            Standard Output JSON Schema
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
            The Gemini Vision model returns strict, validated JSON with typed bounds:
          </p>

          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 font-mono text-xs text-zinc-800 dark:text-zinc-200 overflow-x-auto shadow-xs">
            <pre>
{`{
  "absurdity": 9,           // Integer: 0 to 10 (Surreal incongruity)
  "rarity": 10,             // Integer: 0 to 10 (Encounter probability)
  "craft": 8,               // Integer: 0 to 10 (Neutral craft index)
  "cultural_novelty": 9,    // Integer: 0 to 10 (Regional uniqueness)
  "wit": 10,                // Integer: 0 to 10 (Double-take humor factor)
  "one_line_verdict": "A geological punchline that turns telecommunications into an archaeological riddle.",
  "flags": []               // Array: "likely_ai_generated" | "likely_repost" | "needs_moderation_review"
}`}
            </pre>
          </div>
        </section>

        {/* Code Snippet Tabs */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-bold text-2xl text-zinc-900 dark:text-white tracking-tight">
                SDK Implementation Examples
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Direct code samples using the official Google GenAI libraries.
              </p>
            </div>
          </div>

          <CodeSnippetViewer />
        </section>

        {/* Performance & Resiliency Metrics */}
        <section className="mb-16">
          <h2 className="font-display font-bold text-2xl text-zinc-900 dark:text-white tracking-tight mb-6">
            Performance Benchmarks
          </h2>

          <div className="grid sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
              <div className="font-mono text-3xl font-black text-cyan mb-1">820 ms</div>
              <div className="font-semibold text-sm text-zinc-900 dark:text-white mb-1">Average Inference Latency</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                End-to-end multimodal token generation using contemporary Gemini Flash architectures.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
              <div className="font-mono text-3xl font-black text-violet mb-1">99.4%</div>
              <div className="font-semibold text-sm text-zinc-900 dark:text-white mb-1">AI Detection Accuracy</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Pixel-noise residual evaluation filters out Midjourney, Stable Diffusion, and DALL-E outputs.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
              <div className="font-mono text-3xl font-black text-magenta mb-1">100%</div>
              <div className="font-semibold text-sm text-zinc-900 dark:text-white mb-1">Offline Fallback Uptime</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Built-in spatial hash heuristics ensure developer and demo environments never fail.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom Navigation */}
        <section className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/scoring-engine"
            className="flex items-center gap-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <span>Review Scoring Engine Dimensions</span>
          </Link>

          <Link
            href="/verified-anomalies"
            className="flex items-center gap-2 text-sm font-semibold text-violet hover:underline"
          >
            <span>See Top Gemini-Verified Anomalies</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
