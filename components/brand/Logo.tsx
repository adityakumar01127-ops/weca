"use client";

import React, { useId } from "react";

export type LogoVariant = "horizontal" | "stacked" | "emblem" | "wordmark" | "badge";
export type LogoColorScheme = "chromatic" | "monochrome-dark" | "monochrome-light" | "gold";
export type WordmarkType = "weca" | "wica";

export interface LogoProps {
  /** Size of the emblem or base scale reference in pixels. Defaults to 32 */
  size?: number;
  /** Layout variant: horizontal (standard lockup), stacked, emblem-only, wordmark-only, or badge */
  variant?: LogoVariant;
  /** Palette scheme: chromatic (signature violet/rose/cyan), monochrome-dark, monochrome-light, or gold */
  colorScheme?: LogoColorScheme;
  /** Wordmark text: "weca" (default) or "wica" */
  wordmarkText?: WordmarkType;
  /** Optional micro tagline rendered beneath or alongside */
  tagline?: string;
  /** Legacy flag for hiding wordmark (maps to variant="emblem") */
  showWordmark?: boolean;
  /** Legacy flag for theme context (defaults to true) */
  dark?: boolean;
  /** Whether to render the quantum singularity dot in the wordmark */
  showDot?: boolean;
  /** Enable hover spin and micro-scale animations */
  interactive?: boolean;
  /** Extra container className */
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 32,
  variant: propVariant,
  colorScheme: propColorScheme,
  wordmarkText = "weca",
  tagline,
  showWordmark = true,
  dark = true,
  showDot = true,
  interactive = true,
  className = "",
}) => {
  const rawId = useId();
  // Sanitize id for SVG url references
  const id = rawId.replace(/[^a-zA-Z0-9-_]/g, "");

  // Resolve variant and colorScheme with backward-compat defaults
  const variant: LogoVariant = propVariant || (!showWordmark ? "emblem" : "horizontal");
  const colorScheme: LogoColorScheme =
    propColorScheme ||
    (!dark ? "monochrome-light" : "chromatic");

  // Color tokens per colorScheme
  const isGold = colorScheme === "gold";
  const isMonoDark = colorScheme === "monochrome-dark";
  const isMonoLight = colorScheme === "monochrome-light";
  const isChromatic = colorScheme === "chromatic";

  // Gradient IDs
  const blade1Id = `blade1-${id}`;
  const blade2Id = `blade2-${id}`;
  const blade3Id = `blade3-${id}`;
  const coreGlowId = `core-glow-${id}`;
  const coreBloomId = `core-bloom-${id}`;

  // Wordmark typography sizing
  const fontSize = Math.max(15, Math.round(size * 0.68));
  const dotSize = Math.max(3, Math.round(size * 0.13));

  // Render the SVG emblem
  const renderEmblem = (emblemSize: number) => {
    return (
      <div
        className={`relative flex items-center justify-center shrink-0 ${
          interactive
            ? "transition-transform duration-500 ease-out group-hover:rotate-45 group-hover:scale-105"
            : ""
        }`}
        style={{ width: emblemSize, height: emblemSize }}
      >
        <svg
          width={emblemSize}
          height={emblemSize}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Blade 1 Gradient */}
            <linearGradient id={blade1Id} x1="0%" y1="0%" x2="100%" y2="100%">
              {isGold ? (
                <>
                  <stop offset="0%" stopColor="#FDE68A" />
                  <stop offset="100%" stopColor="#D97706" />
                </>
              ) : isMonoLight ? (
                <>
                  <stop offset="0%" stopColor="#27272A" />
                  <stop offset="100%" stopColor="#09090B" />
                </>
              ) : isMonoDark ? (
                <>
                  <stop offset="0%" stopColor="#E4E4E7" />
                  <stop offset="100%" stopColor="#A1A1AA" />
                </>
              ) : (
                /* Chromatic Violet */
                <>
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#6366F1" />
                </>
              )}
            </linearGradient>

            {/* Blade 2 Gradient */}
            <linearGradient id={blade2Id} x1="0%" y1="0%" x2="100%" y2="100%">
              {isGold ? (
                <>
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="100%" stopColor="#B45309" />
                </>
              ) : isMonoLight ? (
                <>
                  <stop offset="0%" stopColor="#52525B" />
                  <stop offset="100%" stopColor="#27272A" />
                </>
              ) : isMonoDark ? (
                <>
                  <stop offset="0%" stopColor="#A1A1AA" />
                  <stop offset="100%" stopColor="#71717A" />
                </>
              ) : (
                /* Chromatic Rose */
                <>
                  <stop offset="0%" stopColor="#FF385C" />
                  <stop offset="100%" stopColor="#E11D48" />
                </>
              )}
            </linearGradient>

            {/* Blade 3 Gradient */}
            <linearGradient id={blade3Id} x1="0%" y1="0%" x2="100%" y2="100%">
              {isGold ? (
                <>
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#78350F" />
                </>
              ) : isMonoLight ? (
                <>
                  <stop offset="0%" stopColor="#71717A" />
                  <stop offset="100%" stopColor="#3F3F46" />
                </>
              ) : isMonoDark ? (
                <>
                  <stop offset="0%" stopColor="#D4D4D8" />
                  <stop offset="100%" stopColor="#52525B" />
                </>
              ) : (
                /* Chromatic Cyan */
                <>
                  <stop offset="0%" stopColor="#22D3EE" />
                  <stop offset="100%" stopColor="#0284C7" />
                </>
              )}
            </linearGradient>

            {/* Singularity Glow */}
            <radialGradient id={coreGlowId} cx="50%" cy="50%" r="50%">
              {isGold ? (
                <>
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="35%" stopColor="#FBBF24" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#78350F" stopOpacity="0" />
                </>
              ) : isMonoLight ? (
                <>
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="60%" stopColor="#A1A1AA" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="35%" stopColor="#22D3EE" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#09090B" stopOpacity="0" />
                </>
              )}
            </radialGradient>

            {/* Optical Bloom Filter */}
            <filter id={coreBloomId} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="0.8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Optical Chassis Ring */}
          <circle
            cx="24"
            cy="24"
            r="22"
            stroke={
              isGold
                ? "#D97706"
                : isMonoLight
                ? "#E4E4E7"
                : dark
                ? "#27272A"
                : "#E4E4E7"
            }
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />

          {/* Tri-Sector Calibration Notches at 0°, 120°, 240° */}
          <line
            x1="24"
            y1="2"
            x2="24"
            y2="4.5"
            stroke={isGold ? "#F59E0B" : isMonoLight ? "#A1A1AA" : "#71717A"}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="43.1"
            y1="35"
            x2="40.9"
            y2="33.7"
            stroke={isGold ? "#F59E0B" : isMonoLight ? "#A1A1AA" : "#71717A"}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="4.9"
            y1="35"
            x2="7.1"
            y2="33.7"
            stroke={isGold ? "#F59E0B" : isMonoLight ? "#A1A1AA" : "#71717A"}
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Three Precision Interlocking Blades */}
          <path
            d="M 24 5.5 A 18.5 18.5 0 0 1 40 14.8 C 32 17.5, 26 21.5, 23 24.5 C 23.5 20, 23.8 11.5, 24 5.5 Z"
            fill={`url(#${blade1Id})`}
          />
          <path
            d="M 40 14.8 A 18.5 18.5 0 0 1 24 42.5 C 23.5 35, 20 29.5, 16 26.5 C 21 24, 31 18.5, 40 14.8 Z"
            fill={`url(#${blade2Id})`}
          />
          <path
            d="M 24 42.5 A 18.5 18.5 0 0 1 8 14.8 C 16 17.5, 21.5 21, 24.5 24 C 20.5 28.5, 22.5 36, 24 42.5 Z"
            fill={`url(#${blade3Id})`}
          />

          {/* Inner Negative Space Pupil */}
          <circle
            cx="24"
            cy="24"
            r="5"
            fill={isMonoLight ? "#FFFFFF" : isGold ? "#18181B" : dark ? "#09090B" : "#FFFFFF"}
            stroke={isGold ? "#92400E" : isMonoLight ? "#D4D4D8" : "#27272A"}
            strokeWidth="1"
          />

          {/* Optical Singularity Core Flare */}
          <circle cx="24" cy="24" r="3.5" fill={`url(#${coreGlowId})`} />
          <circle
            cx="24"
            cy="24"
            r="1.5"
            fill={isGold ? "#FFFBEB" : isMonoLight ? "#09090B" : "#FFFFFF"}
            filter={`url(#${coreBloomId})`}
          />

          {/* Micro Flare Spikes */}
          <line
            x1="24"
            y1="19.5"
            x2="24"
            y2="28.5"
            stroke={isGold ? "#FEF3C7" : isMonoLight ? "#52525B" : "#FFFFFF"}
            strokeWidth="0.75"
            strokeLinecap="round"
            opacity="0.95"
          />
          <line
            x1="19.5"
            y1="24"
            x2="28.5"
            y2="24"
            stroke={isGold ? "#FEF3C7" : isMonoLight ? "#52525B" : "#FFFFFF"}
            strokeWidth="0.75"
            strokeLinecap="round"
            opacity="0.95"
          />
        </svg>
      </div>
    );
  };

  // Render the Wordmark
  const renderWordmark = () => {
    const textColor = isGold
      ? "text-amber-400"
      : isMonoLight
      ? "text-zinc-950"
      : !dark
      ? "text-zinc-950"
      : "text-white";

    const dotBg = isGold
      ? "bg-amber-400"
      : isMonoLight
      ? "bg-zinc-900"
      : "bg-cyan";

    const dotGlow = isGold
      ? "0 0 8px #f59e0b"
      : isMonoLight
      ? "none"
      : "0 0 8px #22d3ee";

    return (
      <div className="flex items-baseline leading-none">
        <span
          className={`font-display font-black tracking-[-0.035em] leading-none ${textColor}`}
          style={{ fontSize }}
        >
          {wordmarkText}
        </span>
        {showDot && (
          <span
            className={`inline-block rounded-full ${dotBg} transition-all duration-300 group-hover:scale-125`}
            style={{
              width: dotSize,
              height: dotSize,
              boxShadow: dotGlow,
              marginLeft: "2px",
              transform: "translateY(-1px)",
            }}
          />
        )}
      </div>
    );
  };

  // Render Tagline
  const renderTagline = () => {
    if (!tagline) return null;
    const tagColor = isGold
      ? "text-amber-500/80"
      : isMonoLight
      ? "text-zinc-500"
      : "text-zinc-400";

    return (
      <span
        className={`text-[9px] font-mono font-bold tracking-[0.18em] uppercase ${tagColor} block mt-0.5 leading-none`}
      >
        {tagline}
      </span>
    );
  };

  // 1. EMBLEM ONLY
  if (variant === "emblem") {
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        {renderEmblem(size)}
      </div>
    );
  }

  // 2. WORDMARK ONLY
  if (variant === "wordmark") {
    return (
      <div className={`inline-flex flex-col select-none ${className}`}>
        {renderWordmark()}
        {renderTagline()}
      </div>
    );
  }

  // 3. STACKED VARIANT
  if (variant === "stacked") {
    return (
      <div className={`inline-flex flex-col items-center text-center gap-2 select-none ${className}`}>
        {renderEmblem(size)}
        <div className="flex flex-col items-center">
          {renderWordmark()}
          {renderTagline()}
        </div>
      </div>
    );
  }

  // 4. BADGE CAPSULE VARIANT
  if (variant === "badge") {
    const badgeBorder = isGold
      ? "border-amber-500/30 bg-amber-950/20 text-amber-200"
      : isMonoLight
      ? "border-zinc-200 bg-zinc-50 text-zinc-900"
      : "border-white/10 bg-zinc-900/60 text-zinc-100 backdrop-blur-md";

    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${badgeBorder} select-none ${className}`}
      >
        {renderEmblem(Math.max(18, Math.round(size * 0.75)))}
        <div className="flex items-center gap-1.5">
          {renderWordmark()}
          {tagline ? (
            <>
              <span className="text-zinc-600 dark:text-zinc-500 text-xs">/</span>
              <span className="text-[10px] font-mono font-semibold tracking-wider opacity-80 uppercase">
                {tagline}
              </span>
            </>
          ) : (
            <span className="text-[9px] font-mono tracking-widest uppercase opacity-60 ml-1">
              ARCHIVE
            </span>
          )}
        </div>
      </div>
    );
  }

  // 5. HORIZONTAL DEFAULT
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {renderEmblem(size)}
      <div className="flex flex-col justify-center">
        {renderWordmark()}
        {renderTagline()}
      </div>
    </div>
  );
};
