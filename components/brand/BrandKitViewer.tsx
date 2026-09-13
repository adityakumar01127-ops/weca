"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Logo, LogoVariant, LogoColorScheme, WordmarkType } from "./Logo";
import { VerifiedSeal } from "./VerifiedSeal";
import { 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Sliders, 
  ShieldCheck, 
  Layers, 
  Palette, 
  Eye, 
  Code,
  ArrowRight
} from "lucide-react";

export const BrandKitViewer: React.FC = () => {
  // Playground State
  const [variant, setVariant] = useState<LogoVariant>("horizontal");
  const [colorScheme, setColorScheme] = useState<LogoColorScheme>("chromatic");
  const [wordmarkText, setWordmarkText] = useState<WordmarkType>("weca");
  const [tagline, setTagline] = useState<string>("GLOBAL WEIRDNESS INDEX");
  const [size, setSize] = useState<number>(44);
  const [canvasBg, setCanvasBg] = useState<"dark" | "grid" | "light" | "neutral">("dark");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // Copy helper
  const handleCopy = (text: string, type: "code" | "hex") => {
    navigator.clipboard.writeText(text);
    if (type === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedHex(text);
      setTimeout(() => setCopiedHex(null), 2000);
    }
  };

  // Color tokens
  const colorTokens = [
    {
      name: "Neon Cyan",
      role: "Singularity Core & Primary Beacon",
      hex: "#22D3EE",
      rgb: "34, 211, 238",
      accent: "bg-[#22D3EE]",
      textColor: "text-zinc-950",
    },
    {
      name: "Electric Violet",
      role: "Dimensional Distortion Blade 1",
      hex: "#8B5CF6",
      rgb: "139, 92, 246",
      accent: "bg-[#8B5CF6]",
      textColor: "text-white",
    },
    {
      name: "Chromatic Rose",
      role: "High-Anomaly Flare Blade 2",
      hex: "#FF385C",
      rgb: "255, 56, 92",
      accent: "bg-[#FF385C]",
      textColor: "text-white",
    },
    {
      name: "Golden Ledger",
      role: "Archival Verification & Tier 5",
      hex: "#F59E0B",
      rgb: "245, 158, 11",
      accent: "bg-[#F59E0B]",
      textColor: "text-zinc-950",
    },
    {
      name: "Deep Void",
      role: "Platform Canvas & Negative Space",
      hex: "#09090B",
      rgb: "9, 9, 11",
      accent: "bg-[#09090B] border border-zinc-700",
      textColor: "text-white",
    },
    {
      name: "Optical White",
      role: "Singularity Bloom Flare",
      hex: "#FFFFFF",
      rgb: "255, 255, 255",
      accent: "bg-white border border-zinc-300",
      textColor: "text-zinc-950",
    },
  ];

  // SVG Asset Files
  const assetFiles = [
    {
      title: "Chromatic Aperture Emblem",
      filename: "wica-emblem.svg",
      path: "/wica-emblem.svg",
      type: "Vector Emblem (48x48)",
      description: "Interlocking tri-blade chromatic aperture with singularity pupil and calibration notches.",
      bg: "bg-zinc-950",
    },
    {
      title: "Primary Logo (Transparent)",
      filename: "wica-logo.svg",
      path: "/wica-logo.svg",
      type: "Vector Symbol (48x48)",
      description: "Default platform icon asset suitable for avatars, app headers, and responsive touchpoints.",
      bg: "bg-zinc-950",
    },
    {
      title: "Horizontal Lockup (Dark Canvas)",
      filename: "wica-lockup-dark.svg",
      path: "/wica-lockup-dark.svg",
      type: "Vector Lockup (240x48)",
      description: "Complete wordmark and emblem lockup calibrated for dark UI, media kits, and presentations.",
      bg: "bg-zinc-950",
    },
    {
      title: "Horizontal Lockup (Light Canvas)",
      filename: "wica-lockup-light.svg",
      path: "/wica-lockup-light.svg",
      type: "Vector Lockup (240x48)",
      description: "High-contrast dark typography and optimized aperture blades for clean white or paper backgrounds.",
      bg: "bg-zinc-100 border border-zinc-200",
    },
    {
      title: "Golden Ledger Archival Seal",
      filename: "wica-seal-gold.svg",
      path: "/wica-seal-gold.svg",
      type: "Verification Seal (160x160)",
      description: "Official stamp for Tier 5 Certified Anomalies, Golden Ledger certificates, and press releases.",
      bg: "bg-zinc-950",
    },
  ];

  // Generated React snippet for current configuration
  const generatedCode = `<Logo
  size={${size}}
  variant="${variant}"
  colorScheme="${colorScheme}"
  wordmarkText="${wordmarkText}"${tagline ? `\n  tagline="${tagline}"` : ""}
/>`;

  return (
    <div className="space-y-16">
      {/* 1. Interactive Brand Laboratory */}
      <section className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl p-6 lg:p-8 relative overflow-hidden shadow-sm dark:shadow-none">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/10 pb-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan/10 border border-cyan/30 text-cyan text-xs font-mono font-medium mb-2">
              <Sliders className="w-3.5 h-3.5" />
              <span>LIVE LOGO GENERATOR & PLAYGROUND</span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Interactive Brand Engine
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Configure scale, variant geometry, dual wordmark nomenclature, and canvas environments.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto">
            <button
              onClick={() => handleCopy(generatedCode, "code")}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 border border-zinc-300 dark:border-white/10 text-xs font-mono text-zinc-800 dark:text-zinc-200 transition-all active:scale-95"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? "COPIED CODE" : "COPY REACT CODE"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Variant Selector */}
            <div>
              <label className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2.5">
                Lockup Variant
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["horizontal", "stacked", "emblem", "wordmark", "badge"] as LogoVariant[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVariant(v)}
                    className={`px-3 py-2 rounded-xl text-xs font-mono font-medium capitalize border transition-all ${
                      variant === v
                        ? "bg-cyan/15 border-cyan text-cyan shadow-[0_0_12px_rgba(34,211,238,0.25)] font-bold"
                        : "bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-300 dark:hover:border-white/20"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Scheme */}
            <div>
              <label className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2.5">
                Color Scheme
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "chromatic", label: "Signature Chromatic" },
                  { id: "monochrome-dark", label: "Mono Dark" },
                  { id: "monochrome-light", label: "Mono Light" },
                  { id: "gold", label: "Golden Ledger" },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setColorScheme(c.id as LogoColorScheme);
                      if (c.id === "monochrome-light" && canvasBg === "dark") {
                        setCanvasBg("light");
                      }
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-mono font-medium border transition-all text-left ${
                      colorScheme === c.id
                        ? "bg-purple-500/15 border-purple-400 text-purple-700 dark:text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.25)] font-bold"
                        : "bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-300 dark:hover:border-white/20"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Wordmark Nomenclature */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">
                  Wordmark Name
                </label>
                <div className="flex rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-1">
                  <button
                    onClick={() => setWordmarkText("weca")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      wordmarkText === "weca"
                        ? "bg-white dark:bg-zinc-800 text-cyan shadow-sm"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    weca.
                  </button>
                  <button
                    onClick={() => setWordmarkText("wica")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      wordmarkText === "wica"
                        ? "bg-white dark:bg-zinc-800 text-cyan shadow-sm"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    wica.
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">
                  Emblem Size: {size}px
                </label>
                <input
                  type="range"
                  min={20}
                  max={96}
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan mt-2"
                />
              </div>
            </div>

            {/* Tagline input */}
            <div>
              <label className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">
                Sub-Label / Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Optional sub-label text"
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-300 dark:border-white/10 text-xs font-mono text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-cyan"
              />
              <div className="flex gap-2 mt-2">
                {["GLOBAL WEIRDNESS INDEX", "SPECIMEN ARCHIVE", ""].map((preset) => (
                  <button
                    key={preset || "none"}
                    onClick={() => setTagline(preset)}
                    className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-200 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    {preset ? preset.toLowerCase() : "(clear)"}
                  </button>
                ))}
              </div>
            </div>

            {/* Canvas Environment */}
            <div>
              <label className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">
                Canvas Preview Mode
              </label>
              <div className="flex gap-2">
                {[
                  { id: "dark", label: "Void #09090B" },
                  { id: "grid", label: "Radar Grid" },
                  { id: "light", label: "Studio Light" },
                  { id: "neutral", label: "Muted Zinc" },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => setCanvasBg(bg.id as any)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                      canvasBg === bg.id
                        ? "border-cyan dark:border-white/50 bg-cyan/10 dark:bg-white/10 text-cyan dark:text-white font-bold"
                        : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Canvas Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div
              className={`w-full min-h-[360px] rounded-2xl flex flex-col items-center justify-center p-8 transition-all relative overflow-hidden border shadow-inner ${
                canvasBg === "dark"
                  ? "bg-[#09090B] border-zinc-800"
                  : canvasBg === "grid"
                  ? "bg-[#09090B] border-zinc-800 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]"
                  : canvasBg === "light"
                  ? "bg-[#FAFAFA] border-zinc-300"
                  : "bg-zinc-900 border-zinc-700"
              }`}
            >
              {/* Corner Watermarks */}
              <div className="absolute top-4 left-4 font-mono text-[10px] text-zinc-500 dark:text-zinc-600 uppercase tracking-widest pointer-events-none">
                CALIBRATION STAGE // {variant}
              </div>
              <div className="absolute bottom-4 right-4 font-mono text-[10px] text-zinc-500 dark:text-zinc-600 uppercase tracking-widest pointer-events-none">
                {size}PX SCALE
              </div>

              {/* Dynamic Logo Target */}
              <div className="group cursor-pointer p-6">
                <Logo
                  size={size}
                  variant={variant}
                  colorScheme={colorScheme}
                  wordmarkText={wordmarkText}
                  tagline={tagline || undefined}
                  dark={canvasBg !== "light"}
                  interactive={true}
                />
              </div>
            </div>

            {/* Generated Code Preview */}
            <div className="w-full mt-4 bg-[#09090B] border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-300 overflow-x-auto relative">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Code className="w-3 h-3 text-cyan" />
                <span>Component Signature</span>
              </div>
              <pre className="text-cyan font-mono">{generatedCode}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Official Vector Asset Kit (SVG Downloads) */}
      <section className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-xs font-mono font-medium mb-2">
            <Download className="w-3.5 h-3.5" />
            <span>PRODUCTION ARTIFACTS</span>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Official Vector Asset Library
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Standardized, precision-engineered vector SVGs ready for web, mobile, marketing decks, and print merchandise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assetFiles.map((asset) => (
            <div
              key={asset.filename}
              className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-white/20 transition-all group shadow-sm dark:shadow-none"
            >
              <div>
                {/* Visual Thumbnail */}
                <div
                  className={`w-full h-36 rounded-xl ${asset.bg} flex items-center justify-center p-4 border border-zinc-200/50 dark:border-white/5 relative overflow-hidden mb-4 group-hover:scale-[1.01] transition-transform`}
                >
                  <img
                    src={asset.path}
                    alt={asset.title}
                    className="max-h-20 max-w-full object-contain filter drop-shadow-md"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-zinc-300 border border-white/10">
                    SVG
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-semibold text-zinc-900 dark:text-white text-base group-hover:text-cyan transition-colors">
                    {asset.title}
                  </h3>
                  <div className="text-xs font-mono text-zinc-500">{asset.type}</div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">{asset.description}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-white/10 flex items-center justify-between gap-3">
                <span className="text-[11px] font-mono text-zinc-500 truncate">{asset.filename}</span>
                <a
                  href={asset.path}
                  download={asset.filename}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-cyan dark:bg-white/10 dark:hover:bg-cyan text-zinc-800 hover:text-zinc-950 dark:text-white dark:hover:text-zinc-950 text-xs font-mono transition-all active:scale-95 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>DOWNLOAD</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Official Color System */}
      <section className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-medium mb-2">
            <Palette className="w-3.5 h-3.5" />
            <span>SPECTRAL SPECTRUM</span>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Chromatic Color Architecture
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            The mathematical tri-tone spectrum representing distortion wavelengths, event horizons, and archival rarity.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {colorTokens.map((token) => (
            <div
              key={token.hex}
              onClick={() => handleCopy(token.hex, "hex")}
              className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between hover:border-zinc-300 dark:hover:border-white/20 transition-all cursor-pointer group shadow-sm dark:shadow-none"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl shrink-0 ${token.accent} flex items-center justify-center shadow-md`}
                >
                  {copiedHex === token.hex ? (
                    <Check className={`w-5 h-5 ${token.textColor}`} />
                  ) : (
                    <Eye className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${token.textColor}`} />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-white text-sm">{token.name}</div>
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400">{token.role}</div>
                  <div className="text-xs font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">{token.rgb}</div>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-xs font-bold text-cyan group-hover:underline">
                  {copiedHex === token.hex ? "COPIED" : token.hex}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Golden Ledger Archival Seal Showcase */}
      <section className="bg-gradient-to-br from-amber-50 via-amber-100/30 to-white dark:from-amber-950/20 dark:via-zinc-900/60 dark:to-black border border-amber-300 dark:border-amber-500/30 rounded-3xl p-8 lg:p-10 relative overflow-hidden shadow-sm dark:shadow-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs font-mono font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>THE GOLDEN LEDGER VERIFIED SEAL</span>
            </div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Archival Provenance & Verification
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">
              Every verified anomaly cataloged with a Weirdness Index score above 90+ earns the Golden Ledger Stamp.
              Engineered with dual concentric calibration rims, octagram singularity nodes, and archival timestamp coordinates.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-white/80 dark:bg-black/40 border border-amber-300/60 dark:border-amber-500/20 rounded-xl p-3.5 shadow-sm dark:shadow-none">
                <div className="text-xs font-mono text-amber-700 dark:text-amber-400/80 uppercase font-bold">
                  Precision Standard
                </div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-white mt-0.5">Vector Scale Calibration</div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">
                  Pixel-perfect SVG rendering down to 48px or up to billboard resolution.
                </p>
              </div>
              <div className="bg-white/80 dark:bg-black/40 border border-amber-300/60 dark:border-amber-500/20 rounded-xl p-3.5 shadow-sm dark:shadow-none">
                <div className="text-xs font-mono text-amber-700 dark:text-amber-400/80 uppercase font-bold">
                  Archival Verification
                </div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-white mt-0.5">Specimen ID Stamping</div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">
                  Dynamic specimen serial numbering for digital certificates and physical badges.
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-4 items-center">
              <a
                href="/wica-seal-gold.svg"
                download="wica-seal-gold.svg"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs font-mono transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>DOWNLOAD GOLDEN SEAL SVG</span>
              </a>
              <Link
                href="/verified-anomalies"
                className="inline-flex items-center gap-2 text-xs font-mono text-amber-700 dark:text-amber-300 hover:underline transition-colors font-semibold"
              >
                <span>View Verified Anomalies</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6">
            <div className="relative group cursor-pointer">
              <div className="absolute -inset-4 bg-amber-500/20 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
              <VerifiedSeal size={180} specimenId="SPECIMEN #001-A" epoch="EPOCH 2026.4" />
            </div>
            <div className="text-center font-mono text-xs text-amber-700 dark:text-amber-400/60 mt-4">
              Hover to activate archival singularity rotation
            </div>
          </div>
        </div>
      </section>

      {/* 5. Brand Guidelines & Spacing Architecture */}
      <section className="border border-zinc-200 dark:border-white/10 rounded-2xl p-6 lg:p-8 bg-white dark:bg-zinc-900/40 shadow-sm dark:shadow-none">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan" />
          <span>Geometry, Clear Space & Construction Rules</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="space-y-2">
            <div className="font-mono text-zinc-900 dark:text-white font-semibold uppercase tracking-wider">
              1. The Singularity Dot
            </div>
            <p className="leading-relaxed">
              The cyan singularity dot is placed exactly 2px to the right of the wordmark baseline, symbolizing the quantum origin point of all recorded anomalies. It must never be omitted on primary brand presentations.
            </p>
          </div>
          <div className="space-y-2">
            <div className="font-mono text-zinc-900 dark:text-white font-semibold uppercase tracking-wider">
              2. Clear Space Margin
            </div>
            <p className="leading-relaxed">
              Maintain a minimum clear space surrounding the logo equal to 50% of the emblem's diameter (0.5X) to protect optical integrity and legibility across busy layouts.
            </p>
          </div>
          <div className="space-y-2">
            <div className="font-mono text-zinc-900 dark:text-white font-semibold uppercase tracking-wider">
              3. Dual Nomenclature
            </div>
            <p className="leading-relaxed">
              <strong className="text-zinc-900 dark:text-zinc-200 font-bold">weca.</strong> is the official consumer wordmark and codebase identifier. <strong className="text-zinc-900 dark:text-zinc-200 font-bold">Wica</strong> designates the Global Weirdness Index scoring engine and archival institution.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
