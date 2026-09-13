import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const alt = "Weca — The Global Weirdness Index";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          backgroundImage:
            "radial-gradient(circle at 50% 35%, rgba(124, 92, 252, 0.25), transparent 50%), radial-gradient(circle at 75% 65%, rgba(34, 211, 238, 0.18), transparent 45%), radial-gradient(circle at 25% 65%, rgba(255, 77, 141, 0.15), transparent 45%)",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* Subtle grid accent overlay */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 50,
            right: 50,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 14,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#a1a1aa",
            fontFamily: "monospace",
          }}
        >
          <span>WECA PROTOCOL v2.0</span>
          <span>GEMINI VISION 5-D TELEMETRY</span>
        </div>

        {/* Center Emblem: Chromatic Aperture Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
          }}
        >
          <svg
            width="96"
            height="96"
            viewBox="0 0 48 48"
            fill="none"
          >
            {/* Outer Ring */}
            <circle
              cx="24"
              cy="24"
              r="22"
              stroke="#3f3f46"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
            {/* Violet Blade */}
            <path
              d="M 24 6 A 18 18 0 0 1 39.5 15 C 32 17.5, 26 21.5, 23 24.5 C 23.5 20, 23.8 11.5, 24 6 Z"
              fill="#8B5CF6"
            />
            {/* Rose Blade */}
            <path
              d="M 39.5 15 A 18 18 0 0 1 24 42 C 23.5 35, 20 29.5, 16 26.5 C 21 24, 31 18.5, 39.5 15 Z"
              fill="#FF385C"
            />
            {/* Cyan Blade */}
            <path
              d="M 24 42 A 18 18 0 0 1 8.5 15 C 16 17.5, 21.5 21, 24.5 24 C 20.5 28.5, 22.5 36, 24 42 Z"
              fill="#22D3EE"
            />
            {/* Core Pupil */}
            <circle cx="24" cy="24" r="5" fill="#09090B" stroke="#27272A" strokeWidth="1.5" />
            <circle cx="24" cy="24" r="2.5" fill="#FFFFFF" />
          </svg>
        </div>

        {/* Brand Wordmark with Singularity Dot */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontSize: 76,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: "#ffffff",
              lineHeight: 1,
            }}
          >
            weca
          </span>
          <span
            style={{
              display: "flex",
              width: 14,
              height: 14,
              borderRadius: "50%",
              backgroundColor: "#22d3ee",
              marginLeft: 8,
              boxShadow: "0 0 20px #22d3ee",
            }}
          />
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#e4e4e7",
            letterSpacing: "-0.02em",
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          The Global Weirdness Index
        </div>

        {/* Subtitle Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 24px",
            borderRadius: 9999,
            backgroundColor: "rgba(24, 24, 27, 0.8)",
            border: "1px solid rgba(63, 63, 70, 0.6)",
            fontSize: 18,
            color: "#a1a1aa",
            letterSpacing: "-0.01em",
          }}
        >
          <span>Real-World Candid Anomalies</span>
          <span style={{ margin: "0 12px", color: "#71717a" }}>•</span>
          <span style={{ color: "#c084fc" }}>Multimodal AI Scoring</span>
          <span style={{ margin: "0 12px", color: "#71717a" }}>•</span>
          <span style={{ color: "#22d3ee" }}>Weird Credits</span>
        </div>

        {/* Bottom Footer Telemetry */}
        <div
          style={{
            position: "absolute",
            bottom: 35,
            left: 50,
            right: 50,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 14,
            color: "#71717a",
            fontFamily: "monospace",
          }}
        >
          <span>weca-kappa.vercel.app</span>
          <span>THE ANTIDOTE TO SYNTHETIC SLOP</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
