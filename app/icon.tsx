import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090B",
          borderRadius: "50%",
          border: "1px solid #27272A",
          position: "relative",
        }}
      >
        <svg
          width="30"
          height="30"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="bladeV" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
            <linearGradient id="bladeC" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22D3EE" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="bladeR" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF385C" />
              <stop offset="100%" stopColor="#E11D48" />
            </linearGradient>
            <radialGradient id="bladeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#22D3EE" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#09090B" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Outer Lens Rim */}
          <circle cx="24" cy="24" r="21.5" stroke="#3F3F46" strokeWidth="1.6" strokeDasharray="3.5 1.8" />

          {/* Alignment Notches */}
          <line x1="24" y1="2.5" x2="24" y2="4.5" stroke="#A1A1AA" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="42.5" y1="34.5" x2="40.8" y2="33.5" stroke="#A1A1AA" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="5.5" y1="34.5" x2="7.2" y2="33.5" stroke="#A1A1AA" strokeWidth="1.8" strokeLinecap="round" />

          {/* 3 Chromatic Blades */}
          <path
            d="M 24 5.5 A 18.5 18.5 0 0 1 40 14.8 C 32 17.5, 26 21.5, 23 24.5 C 23.5 20, 23.8 11.5, 24 5.5 Z"
            fill="url(#bladeV)"
          />
          <path
            d="M 40 14.8 A 18.5 18.5 0 0 1 24 42.5 C 23.5 35, 20 29.5, 16 26.5 C 21 24, 31 18.5, 40 14.8 Z"
            fill="url(#bladeR)"
          />
          <path
            d="M 24 42.5 A 18.5 18.5 0 0 1 8 14.8 C 16 17.5, 21.5 21, 24.5 24 C 20.5 28.5, 22.5 36, 24 42.5 Z"
            fill="url(#bladeC)"
          />

          {/* Inner pupil */}
          <circle cx="24" cy="24" r="5" fill="#09090B" stroke="#27272A" strokeWidth="1" />
          
          {/* Singularity Core */}
          <circle cx="24" cy="24" r="3.5" fill="url(#bladeGlow)" />
          <circle cx="24" cy="24" r="1.5" fill="#FFFFFF" />

          {/* Micro Cross Flare Spikes */}
          <line x1="24" y1="19.5" x2="24" y2="28.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.95" />
          <line x1="19.5" y1="24" x2="28.5" y2="24" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.95" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
