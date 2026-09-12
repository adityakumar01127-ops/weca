"use client";

import React, { useId } from "react";

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  dark?: boolean;
  showDot?: boolean;
  interactive?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 32,
  showWordmark = true,
  className = "",
  dark = true,
  showDot = true,
  interactive = true,
}) => {
  const rawId = useId();
  // Sanitize id for SVG url references
  const id = rawId.replace(/[^a-zA-Z0-9-_]/g, "");

  const bladeViolet = `weca-blade-v-${id}`;
  const bladeCyan = `weca-blade-c-${id}`;
  const bladeRose = `weca-blade-r-${id}`;
  const coreGlow = `weca-core-glow-${id}`;
  const coreBloom = `weca-bloom-${id}`;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Emblem: Chromatic Aperture & Quantum Singularity */}
      <div
        className={`relative flex items-center justify-center shrink-0 ${
          interactive ? "transition-transform duration-500 ease-out group-hover:rotate-45 group-hover:scale-105" : ""
        }`}
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Electric Violet Gradient */}
            <linearGradient id={bladeViolet} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>

            {/* Neon Cyan Gradient */}
            <linearGradient id={bladeCyan} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22D3EE" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>

            {/* Chromatic Rose Gradient */}
            <linearGradient id={bladeRose} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF385C" />
              <stop offset="100%" stopColor="#E11D48" />
            </linearGradient>

            {/* Central Singularity Radial Glow */}
            <radialGradient id={coreGlow} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="35%" stopColor="#22D3EE" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#09090B" stopOpacity="0" />
            </radialGradient>

            {/* Optical Bloom Filter */}
            <filter id={coreBloom} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="0.8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Optical Chassis Ring */}
          <circle
            cx="24"
            cy="24"
            r="22"
            stroke={dark ? "#27272A" : "#E4E4E7"}
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />

          {/* Tri-Sector Calibration Notches at 0°, 120°, 240° */}
          <line
            x1="24"
            y1="2"
            x2="24"
            y2="4.5"
            stroke={dark ? "#71717A" : "#A1A1AA"}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="43.1"
            y1="35"
            x2="40.9"
            y2="33.7"
            stroke={dark ? "#71717A" : "#A1A1AA"}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="4.9"
            y1="35"
            x2="7.1"
            y2="33.7"
            stroke={dark ? "#71717A" : "#A1A1AA"}
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Three Precision Interlocking Chromatic Blades */}
          {/* Blade 1: Electric Violet */}
          <path
            d="M 24 5.5 A 18.5 18.5 0 0 1 40 14.8 C 32 17.5, 26 21.5, 23 24.5 C 23.5 20, 23.8 11.5, 24 5.5 Z"
            fill={`url(#${bladeViolet})`}
          />

          {/* Blade 2: Chromatic Rose */}
          <path
            d="M 40 14.8 A 18.5 18.5 0 0 1 24 42.5 C 23.5 35, 20 29.5, 16 26.5 C 21 24, 31 18.5, 40 14.8 Z"
            fill={`url(#${bladeRose})`}
          />

          {/* Blade 3: Neon Cyan */}
          <path
            d="M 24 42.5 A 18.5 18.5 0 0 1 8 14.8 C 16 17.5, 21.5 21, 24.5 24 C 20.5 28.5, 22.5 36, 24 42.5 Z"
            fill={`url(#${bladeCyan})`}
          />

          {/* Inner Negative Space Pupil */}
          <circle
            cx="24"
            cy="24"
            r="5"
            fill={dark ? "#09090B" : "#FFFFFF"}
            stroke={dark ? "#27272A" : "#E4E4E7"}
            strokeWidth="1"
          />

          {/* Optical Singularity Core Flare */}
          <circle cx="24" cy="24" r="3.5" fill={`url(#${coreGlow})`} />
          <circle cx="24" cy="24" r="1.5" fill="#FFFFFF" filter={`url(#${coreBloom})`} />

          {/* Micro Anamorphic Lens Cross Flare Spikes */}
          <line
            x1="24"
            y1="19.5"
            x2="24"
            y2="28.5"
            stroke="#FFFFFF"
            strokeWidth="0.75"
            strokeLinecap="round"
            opacity="0.95"
          />
          <line
            x1="19.5"
            y1="24"
            x2="28.5"
            y2="24"
            stroke="#FFFFFF"
            strokeWidth="0.75"
            strokeLinecap="round"
            opacity="0.95"
          />
        </svg>
      </div>

      {/* Brand Wordmark with Optical Singularity Dot */}
      {showWordmark && (
        <div className="flex items-baseline leading-none">
          <span
            className={`font-display font-extrabold tracking-[-0.035em] leading-none ${
              dark ? "text-white" : "text-zinc-950"
            }`}
            style={{ fontSize: Math.max(16, Math.round(size * 0.68)) }}
          >
            weca
          </span>
          {showDot && (
            <span
              className="inline-block rounded-full bg-cyan transition-all duration-300 group-hover:shadow-[0_0_12px_#22d3ee] group-hover:scale-125"
              style={{
                width: Math.max(3, Math.round(size * 0.13)),
                height: Math.max(3, Math.round(size * 0.13)),
                boxShadow: "0 0 8px #22d3ee",
                marginLeft: "2px",
                transform: "translateY(-1px)",
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};
