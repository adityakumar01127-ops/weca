import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
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
          position: "relative",
        }}
      >
        <svg
          width="144"
          height="144"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="appleBladeV" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
            <linearGradient id="appleBladeC" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22D3EE" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="appleBladeR" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF385C" />
              <stop offset="100%" stopColor="#E11D48" />
            </linearGradient>
          </defs>

          {/* Outer Chassis */}
          <circle cx="24" cy="24" r="22" stroke="#27272A" strokeWidth="1.5" />

          {/* Tri-Sector Calibration Notches */}
          <line x1="24" y1="2" x2="24" y2="4.5" stroke="#71717A" strokeWidth="1.5" />
          <line x1="43.1" y1="35" x2="40.9" y2="33.7" stroke="#71717A" strokeWidth="1.5" />
          <line x1="4.9" y1="35" x2="7.1" y2="33.7" stroke="#71717A" strokeWidth="1.5" />

          {/* 3 Chromatic Blades */}
          <path
            d="M 24 5.5 A 18.5 18.5 0 0 1 40 14.8 C 32 17.5, 26 21.5, 23 24.5 C 23.5 20, 23.8 11.5, 24 5.5 Z"
            fill="url(#appleBladeV)"
          />
          <path
            d="M 40 14.8 A 18.5 18.5 0 0 1 24 42.5 C 23.5 35, 20 29.5, 16 26.5 C 21 24, 31 18.5, 40 14.8 Z"
            fill="url(#appleBladeR)"
          />
          <path
            d="M 24 42.5 A 18.5 18.5 0 0 1 8 14.8 C 16 17.5, 21.5 21, 24.5 24 C 20.5 28.5, 22.5 36, 24 42.5 Z"
            fill="url(#appleBladeC)"
          />

          {/* Inner pupil */}
          <circle cx="24" cy="24" r="5" fill="#09090B" stroke="#27272A" strokeWidth="1" />
          {/* Singularity Core */}
          <circle cx="24" cy="24" r="3" fill="#22D3EE" />
          <circle cx="24" cy="24" r="1.2" fill="#FFFFFF" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
