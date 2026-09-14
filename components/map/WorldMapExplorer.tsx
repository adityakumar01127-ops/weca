"use client";

import React, { useState, useMemo } from "react";
import { GEO_ANOMALIES, GeoAnomaly } from "@/lib/communityData";
import { Category, CATEGORIES, Tier, getTierColor } from "@/lib/types";
import { 
  Globe2, 
  MapPin, 
  Compass, 
  Sparkles, 
  Filter, 
  X, 
  ChevronRight, 
  Layers, 
  Eye, 
  ShieldCheck,
  Search
} from "lucide-react";

export const WorldMapExplorer: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activePin, setActivePin] = useState<GeoAnomaly | null>(GEO_ANOMALIES[0]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const regions = ["All", "Europe", "Asia-Pacific", "North America", "Latin America", "Africa"];

  // Filter anomalies based on region, category, search
  const filteredAnomalies = useMemo(() => {
    return GEO_ANOMALIES.filter((a) => {
      const matchRegion = selectedRegion === "All" || a.region === selectedRegion;
      const matchCat = selectedCategory === "All" || a.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === "" ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.country.toLowerCase().includes(searchQuery.toLowerCase());
      return matchRegion && matchCat && matchSearch;
    });
  }, [selectedRegion, selectedCategory, searchQuery]);

  // Convert lat/long to percentage for SVG/CSS container (Equirectangular projection)
  const coordsToPos = (lat: number, lng: number) => {
    // x: -180 to 180 -> 0% to 100%
    const x = ((lng + 180) / 360) * 100;
    // y: 85 to -60 -> 0% to 100% (clipped for standard map view)
    const y = ((85 - lat) / 145) * 100;
    return {
      left: `${Math.max(5, Math.min(95, x))}%`,
      top: `${Math.max(8, Math.min(90, y))}%`,
    };
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Controls & Filter Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-3.5 sm:p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 w-full min-w-0">
        {/* Region Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs min-w-0">
          <span className="text-zinc-500 dark:text-zinc-400 font-mono flex items-center gap-1 mr-1 shrink-0">
            <Compass className="w-3.5 h-3.5 text-violet" />
            <span>Region:</span>
          </span>
          {regions.map((reg) => (
            <button
              key={reg}
              onClick={() => setSelectedRegion(reg)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-mono text-xs transition-all cursor-pointer ${
                selectedRegion === reg
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-sm"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
              }`}
            >
              {reg}
            </button>
          ))}
        </div>

        {/* Category & Search Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto min-w-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-violet"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className="relative flex-1 sm:flex-initial min-w-0">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search coordinates or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-56 pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet"
            />
          </div>
        </div>
      </div>

      {/* Main Interactive Map Viewport */}
      <div className="relative w-full aspect-16/9 min-h-[420px] rounded-3xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-2xl flex flex-col justify-between">
        {/* Background Graticule Grid & Stylized Continents */}
        <svg
          viewBox="0 0 800 450"
          className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.75" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          
          {/* Stylized Simplified Continents Outlines */}
          <g fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            {/* North America */}
            <path d="M 120 70 Q 180 60 220 90 T 260 180 L 190 220 L 140 160 Z" />
            {/* South America */}
            <path d="M 230 250 Q 280 290 260 360 T 220 420 L 210 320 Z" />
            {/* Europe */}
            <path d="M 430 80 Q 480 70 510 110 T 470 160 L 410 140 Z" />
            {/* Africa */}
            <path d="M 420 180 Q 480 180 500 240 T 470 360 L 420 320 L 390 220 Z" />
            {/* Asia */}
            <path d="M 520 80 Q 640 60 760 120 T 730 250 L 590 220 L 530 150 Z" />
            {/* Australia */}
            <path d="M 700 320 Q 770 310 780 370 T 710 400 Z" />
          </g>
        </svg>

        {/* Map Top Telemetry Bar */}
        <div className="relative z-10 p-4 flex items-center justify-between text-white border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan animate-ping" />
            <span className="font-mono text-xs text-zinc-300">
              WECA GLOBAL CARTOGRAPHY ENGINE • {filteredAnomalies.length} LOCATIONS ACTIVE
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-zinc-400">
            <span>Projection: Equirectangular WGS84</span>
            <span>•</span>
            <span>Accuracy: Optical Verified (99.4%)</span>
          </div>
        </div>

        {/* Pins Canvas */}
        <div className="relative flex-1 w-full h-full">
          {filteredAnomalies.map((anom) => {
            const pos = coordsToPos(anom.latitude, anom.longitude);
            const isSelected = activePin?.id === anom.id;
            const tierColor = getTierColor(anom.tier);

            return (
              <div
                key={anom.id}
                style={{ left: pos.left, top: pos.top }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer"
                onClick={() => setActivePin(anom)}
              >
                {/* Ping wave */}
                <div
                  className={`absolute -inset-2 rounded-full opacity-60 animate-ping pointer-events-none ${
                    anom.tier === "Legendary Anomaly"
                      ? "bg-amber-400"
                      : anom.tier === "Reality-Breaking"
                      ? "bg-pink-500"
                      : anom.tier === "Certified Weird"
                      ? "bg-violet"
                      : "bg-cyan"
                  }`}
                />

                {/* Marker Button */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? "ring-4 ring-white scale-125 bg-white text-ink shadow-2xl"
                      : "ring-2 ring-black/80 hover:scale-110 shadow-lg text-white"
                  } ${
                    anom.tier === "Legendary Anomaly"
                      ? "bg-amber-500"
                      : anom.tier === "Reality-Breaking"
                      ? "bg-magenta"
                      : anom.tier === "Certified Weird"
                      ? "bg-violet"
                      : "bg-cyan text-ink"
                  }`}
                >
                  <MapPin className="w-3 h-3 fill-current" />
                </div>

                {/* Hover Quick Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-700 text-[10px] font-mono text-white whitespace-nowrap pointer-events-none z-30 shadow-xl flex items-center gap-1.5">
                  <span className="font-bold">{anom.city}, {anom.country}</span>
                  <span className="text-zinc-400">({anom.wica_score}/100)</span>
                </div>
              </div>
            );
          })}

          {/* Floating Selected Anomaly Inspector Card */}
          {activePin && (
            <div className="absolute bottom-4 right-4 z-30 max-w-sm w-full p-4 rounded-2xl bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-mono text-cyan border border-zinc-700">
                    {activePin.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-violet/20 text-[10px] font-mono text-violet border border-violet/40">
                    {activePin.tier}
                  </span>
                </div>
                <button
                  onClick={() => setActivePin(null)}
                  className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800"
                  aria-label="Close inspector"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Photo & Details */}
              <div className="flex gap-3 mb-3">
                <img
                  src={activePin.image_url}
                  alt={activePin.title}
                  className="w-20 h-20 rounded-xl object-cover bg-zinc-800 shrink-0 border border-zinc-700"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-display font-bold text-sm text-white line-clamp-1">
                    {activePin.title}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono mt-0.5">
                    <MapPin className="w-3 h-3 text-red-400" />
                    <span>{activePin.city}, {activePin.country}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-mono text-xs font-bold text-cyan">
                      Score: {activePin.wica_score}/100
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">By @{activePin.hunter}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-zinc-300 italic bg-zinc-800/60 p-2.5 rounded-lg border border-zinc-700/60 line-clamp-2">
                &ldquo;{activePin.verdict}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Map Bottom Coordinates Bar */}
        <div className="relative z-10 px-4 py-2 bg-zinc-950/80 border-t border-zinc-800 text-[11px] font-mono text-zinc-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>Rarest Pin: Reykjavik (Score 94)</span>
            <span>•</span>
            <span>Equator Meridian: 0.0000° N, 0.0000° E</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Legendary
            <span className="w-2 h-2 rounded-full bg-pink-500" /> Reality-Breaking
            <span className="w-2 h-2 rounded-full bg-violet" /> Certified Weird
            <span className="w-2 h-2 rounded-full bg-cyan" /> Mildly Odd
          </div>
        </div>
      </div>

      {/* Grid of Anomalies in Selected Region */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-xl text-zinc-900 dark:text-white tracking-tight">
            Anomalies in {selectedRegion === "All" ? "Every Hemisphere" : selectedRegion} ({filteredAnomalies.length})
          </h3>
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">Sorted by Weca Score</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAnomalies.map((anom) => {
            const tierColor = getTierColor(anom.tier);
            const isSelected = activePin?.id === anom.id;

            return (
              <div
                key={anom.id}
                onClick={() => setActivePin(anom)}
                className={`group cursor-pointer rounded-2xl border transition-all overflow-hidden bg-white dark:bg-zinc-900/60 p-3 flex flex-col justify-between ${
                  isSelected
                    ? "border-violet ring-2 ring-violet/20 shadow-md"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm"
                }`}
              >
                <div>
                  <div className="relative aspect-4/3 rounded-xl overflow-hidden mb-2.5 bg-zinc-100 dark:bg-zinc-800">
                    <img
                      src={anom.image_url}
                      alt={anom.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-sm text-[10px] font-mono text-white">
                      {anom.country}
                    </span>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/90 backdrop-blur-sm text-[11px] font-mono text-cyan font-bold">
                      {anom.wica_score}
                    </span>
                  </div>

                  <h4 className="font-display font-bold text-xs text-zinc-900 dark:text-white line-clamp-1 mb-1">
                    {anom.title}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mb-2">
                    <MapPin className="w-3 h-3 text-zinc-400" />
                    <span>{anom.city}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10px] font-mono">
                  <span className={`${tierColor.text} font-semibold`}>{anom.tier}</span>
                  <span className="text-zinc-400 dark:text-zinc-500">@{anom.hunter}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
