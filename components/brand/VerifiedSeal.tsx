"use client";

import React, { useId } from "react";

export interface VerifiedSealProps {
  /** Size in pixels (default 120) */
  size?: number;
  /** Specimen or Anomaly reference number */
  specimenId?: string;
  /** Ledger timestamp string (e.g. "EPOCH 2026.4") */
  epoch?: string;
  /** Optional interactivity (hover glow / tilt) */
  interactive?: boolean;
  /** Extra class names */
  className?: string;
}

export const VerifiedSeal: React.FC<VerifiedSealProps> = ({
  size = 120,
  specimenId,
  epoch = "ARCHIVE GRADE",
  interactive = true,
  className = "",
}) => {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9-_]/g, "");

  const goldOuter = `goldOuter-${id}`;
  const goldInner = `goldInner-${id}`;
  const goldGlow = `goldGlow-${id}`;
  const curveTop = `curveTop-${id}`;
  const curveBottom = `curveBottom-${id}`;

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none group ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className={`w-full h-full relative flex items-center justify-center ${
          interactive
            ? "transition-all duration-700 ease-out group-hover:scale-105 group-hover:drop-shadow-[0_0_24px_rgba(245,158,11,0.45)]"
            : ""
        }`}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id={goldOuter} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="30%" stopColor="#F59E0B" />
              <stop offset="70%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>

            <linearGradient id={goldInner} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#92400E" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="70%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>

            <radialGradient id={goldGlow} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#09090B" stopOpacity="0" />
            </radialGradient>

            <path id={curveTop} d="M 28 80 A 52 52 0 1 1 132 80" fill="none" />
            <path id={curveBottom} d="M 132 80 A 52 52 0 1 1 28 80" fill="none" />
          </defs>

          {/* Background Ambience */}
          <circle cx="80" cy="80" r="76" fill="#09090B" />
          <circle cx="80" cy="80" r="72" fill={`url(#${goldGlow})`} />

          {/* Outer Serrated Ring */}
          <circle
            cx="80"
            cy="80"
            r="74"
            stroke={`url(#${goldOuter})`}
            strokeWidth="2"
            strokeDasharray="3 3"
          />
          <circle cx="80" cy="80" r="68" stroke={`url(#${goldOuter})`} strokeWidth="1" />

          {/* Concentric Frame */}
          <circle cx="80" cy="80" r="54" stroke={`url(#${goldInner})`} strokeWidth="1.5" />
          <circle
            cx="80"
            cy="80"
            r="48"
            stroke={`url(#${goldOuter})`}
            strokeWidth="0.75"
            strokeDasharray="2 2"
          />

          {/* Archival Inscription Text */}
          <text
            fill="#FDE68A"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', monospace"
            fontSize="7.5"
            fontWeight="800"
            letterSpacing="0.18em"
          >
            <textPath href={`#${curveTop}`} startOffset="50%" textAnchor="middle">
              WECA WEIRDNESS INDEX
            </textPath>
          </text>
          <text
            fill="#FBBF24"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', monospace"
            fontSize="7"
            fontWeight="700"
            letterSpacing="0.22em"
          >
            <textPath href={`#${curveBottom}`} startOffset="50%" textAnchor="middle">
              • {epoch} •
            </textPath>
          </text>

          {/* Cardinal Coordinates Calibration Stars */}
          <polygon
            points="80,12 82,16 86,16 83,19 84,23 80,20 76,23 77,19 74,16 78,16"
            fill="#FDE68A"
          />
          <polygon
            points="80,148 82,144 86,144 83,141 84,137 80,140 76,137 77,141 74,144 78,144"
            fill="#FDE68A"
          />

          {/* Central Sigil Group */}
          <g
            transform="translate(80, 80)"
            className={
              interactive
                ? "transition-transform duration-1000 ease-in-out group-hover:rotate-180"
                : ""
            }
          >
            {/* 8-Point Singularity Star */}
            <polygon
              points="0,-24 5,-7 22,-9 9,3 17,19 2,11 -9,21 -6,6 -23,0 -7,-5"
              fill={`url(#${goldOuter})`}
              opacity="0.35"
            />

            {/* Inner Core */}
            <circle cx="0" cy="0" r="16" fill="#18181B" stroke={`url(#${goldOuter})`} strokeWidth="1.5" />

            {/* Micro Gold Aperture Blades */}
            <path d="M 0 -13 A 13 13 0 0 1 11.2 -6.5 C 5 -4, 2 0, 0 0 Z" fill="#FDE68A" />
            <path d="M 11.2 -6.5 A 13 13 0 0 1 0 13 C -2 6, -4 2, 0 0 Z" fill="#F59E0B" />
            <path d="M 0 13 A 13 13 0 0 1 -11.2 -6.5 C -4 -4, 0 -2, 0 0 Z" fill="#D97706" />

            <circle cx="0" cy="0" r="3.5" fill="#FFFFFF" />
            <circle cx="0" cy="0" r="2" fill="#FDE68A" />
          </g>

          {/* Ribbon Seal Badge */}
          <g transform="translate(0, 70)">
            <rect
              x="36"
              y="0"
              width="88"
              height="20"
              rx="3"
              fill="#09090B"
              stroke={`url(#${goldOuter})`}
              strokeWidth="1.5"
            />
            <text
              x="80"
              y="14"
              fill="#FDE68A"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif"
              fontSize="8.5"
              fontWeight="900"
              letterSpacing="0.14em"
              textAnchor="middle"
            >
              {specimenId ? "VERIFIED" : "VERIFIED"}
            </text>
          </g>
        </svg>
      </div>

      {specimenId && (
        <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400/80 tracking-widest uppercase mt-2 font-bold">
          {specimenId}
        </span>
      )}
    </div>
  );
};
