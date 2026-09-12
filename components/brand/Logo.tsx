import React from "react";

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  dark?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 32,
  showWordmark = true,
  className = "",
  dark = true,
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div 
        className="relative flex items-center justify-center shrink-0" 
        style={{ width: size, height: size }}
      >
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 48 48" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 hover:rotate-12"
        >
          {/* Outer Aperture Ring with Shutter Gap */}
          <path 
            d="M 24 4 A 20 20 0 1 1 10 10" 
            stroke={dark ? "#F4F4F5" : "#0E0E10"} 
            strokeWidth="3.2" 
            strokeLinecap="round"
          />
          <circle cx="9" cy="9" r="1.6" fill="#7C5CFC" />
          
          {/* Chromatic Aberration Glitch Cluster */}
          <g style={{ mixBlendMode: dark ? "screen" : "multiply" }}>
            <circle cx="20.5" cy="21.5" r="7.2" fill="#7C5CFC" fillOpacity={dark ? 0.9 : 0.85} />
            <circle cx="27.5" cy="21.5" r="7.2" fill="#FF4D8D" fillOpacity={dark ? 0.85 : 0.85} />
            <circle cx="24" cy="28.5" r="7.2" fill="#22D3EE" fillOpacity={dark ? 0.85 : 0.85} />
          </g>
          
          {/* Core */}
          <circle cx="24" cy="24" r="2.4" fill={dark ? "#FFFFFF" : "#0E0E10"} fillOpacity="0.9" />
        </svg>
      </div>
      {showWordmark && (
        <div className="flex flex-col">
          <span className={`font-display font-extrabold tracking-tight text-xl leading-none ${dark ? "text-white" : "text-ink"}`}>
            weca
          </span>
        </div>
      )}
    </div>
  );
};
