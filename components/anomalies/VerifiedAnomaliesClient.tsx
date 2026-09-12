"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  Sparkles, 
  MapPin, 
  CheckCircle2, 
  X, 
  Eye, 
  Calendar, 
  Camera, 
  Award,
  Layers
} from "lucide-react";
import { getTierColor } from "@/lib/types";

interface Dossier {
  id: string;
  code: string;
  title: string;
  score: number;
  tier: "Legendary Anomaly" | "Reality-Breaking";
  location: string;
  country: string;
  coords: string;
  date_verified: string;
  camera: string;
  image_url: string;
  verdict: string;
  lead_investigator: string;
  consensus_rate: string;
  field_notes: string;
  dimensions: {
    absurdity: number;
    rarity: number;
    craft: number;
    cultural_novelty: number;
    wit: number;
  };
}

const VERIFIED_DOSSIERS: Dossier[] = [
  {
    id: "dos-1",
    code: "ARC-ICE-001",
    title: "Basalt Lava-Fused Rotary Telephone",
    score: 94,
    tier: "Legendary Anomaly",
    location: "Reykjanes Peninsula",
    country: "Iceland",
    coords: "63.8794° N, 22.4398° W",
    date_verified: "February 16, 2026",
    camera: "Sony α7R V • 35mm f/2.8 (Uncompressed RAW)",
    image_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80",
    verdict: "A geological punchline that turns telecommunications into an archaeological riddle.",
    lead_investigator: "Dr. Freja Lindholm (Volcanology Dept)",
    consensus_rate: "98.7%",
    field_notes:
      "Recovered at the edge of a fresh basalt flow. The rotary telephone (circa 1974) was partially submerged in slow-moving pahoehoe lava. The bakelite casing partially calcified with basalt crystals. Fully authentic physical specimen.",
    dimensions: { absurdity: 10, rarity: 10, craft: 8, cultural_novelty: 9, wit: 10 },
  },
  {
    id: "dos-2",
    code: "ARC-NZ-002",
    title: "Inverted Bioluminescent Cave Mycena",
    score: 88,
    tier: "Legendary Anomaly",
    location: "Waitomo Limestone Grotto",
    country: "New Zealand",
    coords: "38.2614° S, 175.1032° E",
    date_verified: "February 28, 2026",
    camera: "Nikon Z8 • 50mm f/1.8 (EXIF verified)",
    image_url: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=80",
    verdict: "Mycology defying gravity with theatrical bioluminescence.",
    lead_investigator: "botanical_glitch",
    consensus_rate: "96.2%",
    field_notes:
      "A rare saprophytic fungal colony growing upside down out of calcium carbonate stalactites inside an active subterranean stream cavern. Emits steady 510nm green bioluminescence. Zero artificial lighting was used.",
    dimensions: { absurdity: 9, rarity: 9, craft: 7, cultural_novelty: 9, wit: 10 },
  },
  {
    id: "dos-3",
    code: "ARC-JPN-003",
    title: "Anti-Bird Spikes Acupuncture Feline",
    score: 82,
    tier: "Reality-Breaking",
    location: "Gion District, Kyoto",
    country: "Japan",
    coords: "35.0037° N, 135.7772° E",
    date_verified: "March 02, 2026",
    camera: "Fujifilm X-T5 • 23mm f/2",
    image_url: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=800&auto=format&fit=crop&q=80",
    verdict: "Feline comfort achieved through deliberate defiance of urban hostility.",
    lead_investigator: "urban_stranger",
    consensus_rate: "94.5%",
    field_notes:
      "Observed on top of an outdoor HVAC unit equipped with stainless steel bird-deterrent spikes. The domestic cat spent 4 hours resting peacefully across the points. Confirmed candid street capture.",
    dimensions: { absurdity: 9, rarity: 8, craft: 6, cultural_novelty: 9, wit: 9 },
  },
  {
    id: "dos-4",
    code: "ARC-CHL-004",
    title: "The Subterranean Void Stairway",
    score: 79,
    tier: "Reality-Breaking",
    location: "Cerro Alegre, Valparaíso",
    country: "Chile",
    coords: "33.0472° S, 71.6127° W",
    date_verified: "March 04, 2026",
    camera: "Leica Q3 • 28mm f/1.7",
    image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80",
    verdict: "An architectural existential crisis cast directly into reinforced concrete.",
    lead_investigator: "urban_stranger",
    consensus_rate: "93.1%",
    field_notes:
      "A set of 12 reinforced concrete stairs descending directly into a solid foundation wall with no doors, hatches, or vents. Architectural survey confirms a mid-century retaining wall renovation mistake.",
    dimensions: { absurdity: 8, rarity: 8, craft: 8, cultural_novelty: 7, wit: 8 },
  },
  {
    id: "dos-5",
    code: "ARC-CHL-005",
    title: "Right-Angled Cumulus Shadow Discontinuity",
    score: 91,
    tier: "Legendary Anomaly",
    location: "San Pedro de Atacama",
    country: "Chile",
    coords: "22.9087° S, 68.1997° W",
    date_verified: "March 06, 2026",
    camera: "Canon EOS R5 • 70-200mm f/4L",
    image_url: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800&auto=format&fit=crop&q=80",
    verdict: "Atmospheric ray-tracing glitch that breaks all soft-shadow physics.",
    lead_investigator: "karen_coincidence",
    consensus_rate: "97.4%",
    field_notes:
      "Cast across the high-altitude salt flat during peak solar noon. An abrupt shear wind gradient created a cloud edge so razor-sharp that its ground shadow appeared as an immaculate 90-degree polygonal box.",
    dimensions: { absurdity: 9, rarity: 10, craft: 7, cultural_novelty: 9, wit: 10 },
  },
  {
    id: "dos-6",
    code: "ARC-FRA-006",
    title: "Double-Faced Conjoined Sunflower Disc",
    score: 84,
    tier: "Reality-Breaking",
    location: "Luberon Valley, Provence",
    country: "France",
    coords: "43.8824° N, 5.2589° E",
    date_verified: "March 10, 2026",
    camera: "Panasonic Lumix S5II • 85mm f/1.8",
    image_url: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=800&auto=format&fit=crop&q=80",
    verdict: "Botanical bifurcation resulting in an uncanny Janus-faced bloom.",
    lead_investigator: "botanical_glitch",
    consensus_rate: "95.8%",
    field_notes:
      "A rare case of floral fasciation (cresting) where the apical meristem expanded perpendicularly, producing two fully formed disc floret faces back-to-back on a single flattened stem.",
    dimensions: { absurdity: 9, rarity: 8, craft: 7, cultural_novelty: 8, wit: 10 },
  },
];

export const VerifiedAnomaliesClient: React.FC = () => {
  const [activeDossier, setActiveDossier] = useState<Dossier | null>(null);

  return (
    <div>
      {/* Dossier Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {VERIFIED_DOSSIERS.map((item) => {
          const tierColors = getTierColor(item.tier);
          return (
            <div
              key={item.id}
              onClick={() => setActiveDossier(item)}
              className="group cursor-pointer rounded-3xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-400 bg-white dark:bg-zinc-900/60 overflow-hidden transition-all hover:shadow-xl flex flex-col relative"
            >
              {/* Gold Archival Seal Badge */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-amber-400 text-[11px] font-mono font-bold border border-amber-400/30 shadow-lg">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>GOLD VERIFIED</span>
              </div>

              {/* Photo */}
              <div className="relative aspect-4/3 bg-zinc-900 overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan" />
                  <span>{item.score} Wica</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 dark:text-zinc-500 mb-1.5">
                    <span>{item.code}</span>
                    <span className={tierColors.text}>{item.tier}</span>
                  </div>

                  <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                    {item.title}
                  </h3>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 italic">
                    &ldquo;{item.verdict}&rdquo;
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400 dark:text-zinc-500">
                  <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
                    <MapPin className="w-3.5 h-3.5 text-violet" />
                    <span>{item.country}</span>
                  </span>

                  <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                    <span>Inspect Dossier</span>
                    <Eye className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Dossier Modal */}
      {activeDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800">
            {/* Close */}
            <button
              onClick={() => setActiveDossier(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="max-h-[85vh] overflow-y-auto">
              {/* Photo Hero with Stamp */}
              <div className="aspect-video relative bg-zinc-950">
                <img
                  src={activeDossier.image_url}
                  alt={activeDossier.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                
                <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-white font-mono text-xs">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-400/40 text-amber-300">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>WICA PERMANENT ARCHIVE • SEAL OF TRUTH</span>
                  </div>
                  <span className="text-zinc-300">{activeDossier.code}</span>
                </div>
              </div>

              {/* Dossier Dossier Details */}
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-400 dark:text-zinc-500 mb-2">
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{activeDossier.tier}</span>
                    <span>•</span>
                    <span>{activeDossier.date_verified}</span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Consensus: {activeDossier.consensus_rate}
                    </span>
                  </div>

                  <h2 className="font-display font-black text-2xl sm:text-3xl text-zinc-900 dark:text-white">
                    {activeDossier.title}
                  </h2>
                </div>

                {/* Score & Dimensions */}
                <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-4">
                  <div className="flex items-baseline justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                    <span className="font-mono text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase">
                      Composite Wica Score
                    </span>
                    <span className="font-display font-black text-2xl text-zinc-900 dark:text-white">
                      {activeDossier.score} / 100
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2 text-center font-mono text-xs">
                    <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                      <div className="font-bold text-violet">{activeDossier.dimensions.absurdity}/10</div>
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500">Absurdity</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                      <div className="font-bold text-cyan">{activeDossier.dimensions.rarity}/10</div>
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500">Rarity</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                      <div className="font-bold text-zinc-700 dark:text-zinc-300">{activeDossier.dimensions.craft}/10</div>
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500">Craft</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                      <div className="font-bold text-magenta">{activeDossier.dimensions.cultural_novelty}/10</div>
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500">Novelty</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                      <div className="font-bold text-amber-500">{activeDossier.dimensions.wit}/10</div>
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500">Wit</div>
                    </div>
                  </div>
                </div>

                {/* Forensic Metadata */}
                <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono p-4 rounded-xl bg-zinc-900 text-zinc-300">
                  <div>
                    <span className="text-zinc-500 block mb-1">Geographic Coordinates:</span>
                    <span className="text-cyan">{activeDossier.coords}</span>
                    <span className="text-zinc-400 block text-[11px] mt-0.5">{activeDossier.location}, {activeDossier.country}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-1">Optical Capture Sensor:</span>
                    <span className="text-white">{activeDossier.camera}</span>
                  </div>
                </div>

                {/* Field Notes */}
                <div>
                  <h4 className="font-mono text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-2">
                    Lead Investigator Field Notes
                  </h4>
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {activeDossier.field_notes}
                    <div className="mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                      Signed: {activeDossier.lead_investigator}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    onClick={() => setActiveDossier(null)}
                    className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-medium text-xs transition-colors cursor-pointer"
                  >
                    Close Dossier
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
