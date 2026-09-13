"use client";

import React, { useState, useMemo } from "react";
import { CATEGORIES, Category, Tier, getTierFromScore, getTierColor } from "@/lib/types";
import { 
  Search, 
  Filter, 
  Sparkles, 
  MapPin, 
  ExternalLink, 
  Eye, 
  Tag, 
  X,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

interface AnomalyDirectoryItem {
  id: string;
  code: string;
  title: string;
  category: Category;
  tier: Tier;
  score: number;
  location: string;
  country: string;
  image_url: string;
  verdict: string;
  submitted_by: string;
  date_logged: string;
  absurdity: number;
  rarity: number;
  craft: number;
  cultural_novelty: number;
  wit: number;
}

const DIRECTORY_DATA: AnomalyDirectoryItem[] = [
  {
    id: "dir-1",
    code: "OBJ-ICE-04",
    title: "Basalt Lava-Fused Rotary Telephone",
    category: "Objects",
    tier: "Legendary Anomaly",
    score: 94,
    location: "Reykjanes Peninsula",
    country: "Iceland",
    image_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80",
    verdict: "A geological punchline that turns telecommunications into an archaeological riddle.",
    submitted_by: "anomaly_hunter",
    date_logged: "2026-02-14",
    absurdity: 10,
    rarity: 10,
    craft: 8,
    cultural_novelty: 9,
    wit: 10,
  },
  {
    id: "dir-2",
    code: "NAT-NZ-12",
    title: "Inverted Bioluminescent Cave Fungi",
    category: "Nature",
    tier: "Legendary Anomaly",
    score: 88,
    location: "Waitomo Caves",
    country: "New Zealand",
    image_url: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=80",
    verdict: "Mycology defying gravity with unapologetic theatrical bioluminescence.",
    submitted_by: "botanical_glitch",
    date_logged: "2026-02-28",
    absurdity: 9,
    rarity: 9,
    craft: 7,
    cultural_novelty: 9,
    wit: 10,
  },
  {
    id: "dir-3",
    code: "ANI-JPN-07",
    title: "Anti-Bird Spikes Acupuncture Cat",
    category: "Animals",
    tier: "Reality-Breaking",
    score: 82,
    location: "Kyoto",
    country: "Japan",
    image_url: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=800&auto=format&fit=crop&q=80",
    verdict: "Feline comfort achieved through deliberate defiance of urban hostility.",
    submitted_by: "urban_stranger",
    date_logged: "2026-03-01",
    absurdity: 9,
    rarity: 8,
    craft: 6,
    cultural_novelty: 9,
    wit: 9,
  },
  {
    id: "dir-4",
    code: "HUM-CHL-23",
    title: "Subterranean Stairway to Blank Concrete",
    category: "Human-Made",
    tier: "Reality-Breaking",
    score: 79,
    location: "Valparaíso",
    country: "Chile",
    image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80",
    verdict: "An architectural existential crisis cast directly into reinforced concrete.",
    submitted_by: "urban_stranger",
    date_logged: "2026-03-03",
    absurdity: 8,
    rarity: 8,
    craft: 8,
    cultural_novelty: 7,
    wit: 8,
  },
  {
    id: "dir-5",
    code: "COI-CHL-02",
    title: "Right-Angled Cloud Shadow Discontinuity",
    category: "Coincidences",
    tier: "Legendary Anomaly",
    score: 91,
    location: "Atacama Plateau",
    country: "Chile",
    image_url: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800&auto=format&fit=crop&q=80",
    verdict: "Atmospheric ray-tracing glitch that breaks all soft-shadow physics.",
    submitted_by: "karen_coincidence",
    date_logged: "2026-03-05",
    absurdity: 9,
    rarity: 10,
    craft: 7,
    cultural_novelty: 9,
    wit: 10,
  },
  {
    id: "dir-6",
    code: "FOO-DEU-19",
    title: "Topologically Perfect Trefoil Knot Pretzel",
    category: "Food",
    tier: "Certified Weird",
    score: 62,
    location: "Munich",
    country: "Germany",
    image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80",
    verdict: "Bavarian dough baking its way directly into non-Euclidean geometry.",
    submitted_by: "curious_traveler",
    date_logged: "2026-03-07",
    absurdity: 6,
    rarity: 7,
    craft: 6,
    cultural_novelty: 6,
    wit: 6,
  },
  {
    id: "dir-7",
    code: "NAT-FRA-11",
    title: "Double-Headed Conjoined Sunflower Disc",
    category: "Nature",
    tier: "Reality-Breaking",
    score: 84,
    location: "Provence",
    country: "France",
    image_url: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=800&auto=format&fit=crop&q=80",
    verdict: "Botanical bifurcation resulting in a delightfully uncanny double-faced bloom.",
    submitted_by: "botanical_glitch",
    date_logged: "2026-03-09",
    absurdity: 9,
    rarity: 8,
    craft: 7,
    cultural_novelty: 8,
    wit: 10,
  },
  {
    id: "dir-8",
    code: "OBJ-NOR-15",
    title: "Tree Growing Cleanly Through Bicycle Frame",
    category: "Objects",
    tier: "Certified Weird",
    score: 58,
    location: "Bergen",
    country: "Norway",
    image_url: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&auto=format&fit=crop&q=80",
    verdict: "Nature slowly consuming metallurgy in an aggressive 30-year embrace.",
    submitted_by: "curious_traveler",
    date_logged: "2026-03-10",
    absurdity: 6,
    rarity: 6,
    craft: 5,
    cultural_novelty: 6,
    wit: 6,
  },
];

export const AnomalyDirectoryClient: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedTier, setSelectedTier] = useState<string>("All");
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyDirectoryItem | null>(null);

  const filteredItems = useMemo(() => {
    return DIRECTORY_DATA.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.verdict.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;

      const matchesTier =
        selectedTier === "All" || item.tier === selectedTier;

      return matchesSearch && matchesCategory && matchesTier;
    });
  }, [searchQuery, selectedCategory, selectedTier]);

  return (
    <div>
      {/* Search & Filter Controls */}
      <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 mb-10 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by code (e.g. OBJ-ICE-04), keyword, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tier Dropdown */}
          <div className="w-full sm:w-auto">
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full sm:w-48 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none focus:border-violet font-mono"
            >
              <option value="All">All Tiers</option>
              <option value="Mildly Odd">Mildly Odd</option>
              <option value="Certified Weird">Certified Weird</option>
              <option value="Reality-Breaking">Reality-Breaking</option>
              <option value="Legendary Anomaly">Legendary Anomaly</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-3 py-1.5 rounded-full font-mono text-xs whitespace-nowrap transition-colors ${
              selectedCategory === "All"
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-sm"
                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            All Categories ({DIRECTORY_DATA.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = DIRECTORY_DATA.filter((i) => i.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full font-mono text-xs whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-violet text-white font-medium"
                    : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {cat} {count > 0 ? `(${count})` : ""}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs font-mono text-zinc-400 dark:text-zinc-500 mb-6 px-1">
        <span>Showing {filteredItems.length} cataloged anomalies</span>
        <span>Standard Taxonomy v1.0</span>
      </div>

      {/* Anomaly Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {filteredItems.map((item) => {
          const tierColors = getTierColor(item.tier);
          return (
            <div
              key={item.id}
              onClick={() => setSelectedAnomaly(item)}
              className="group cursor-pointer rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900/60 overflow-hidden transition-all hover:shadow-md flex flex-col"
            >
              {/* Photo Container */}
              <div className="relative aspect-4/3 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Code Tag */}
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-mono text-white font-semibold">
                  {item.code}
                </div>

                {/* Score Pill */}
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-900 dark:text-white shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan" />
                  <span>{item.score}</span>
                </div>

                {/* Country Pill */}
                <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 text-[10px] font-mono text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-violet" />
                  <span>{item.location}, {item.country}</span>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 dark:text-zinc-500">
                      {item.category}
                    </span>
                    <span className={`text-[10px] font-mono font-bold ${tierColors.text}`}>
                      {item.tier}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-base text-zinc-900 dark:text-white group-hover:text-violet transition-colors line-clamp-1 mb-1">
                    {item.title}
                  </h3>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    &ldquo;{item.verdict}&rdquo;
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>@{item.submitted_by}</span>
                  <span className="text-violet group-hover:underline flex items-center gap-1">
                    <span>Inspect</span>
                    <Eye className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inspect Modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
            {/* Close Button */}
            <button
              onClick={() => setSelectedAnomaly(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="max-h-[85vh] overflow-y-auto">
              <div className="aspect-video relative bg-zinc-900">
                <img
                  src={selectedAnomaly.image_url}
                  alt={selectedAnomaly.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-xs font-mono text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan" />
                  <span>Verified Candid Optical Capture</span>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    <span>{selectedAnomaly.code}</span>
                    <span>•</span>
                    <span>{selectedAnomaly.category}</span>
                    <span>•</span>
                    <span>{selectedAnomaly.date_logged}</span>
                  </div>
                  <h2 className="font-display font-black text-2xl text-zinc-900 dark:text-white">
                    {selectedAnomaly.title}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-violet" />
                    <span>{selectedAnomaly.location}, {selectedAnomaly.country}</span>
                  </p>
                </div>

                {/* Score Breakdown Bars */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-white">
                      Composite Weca Score
                    </span>
                    <span className="font-mono font-bold text-sm text-violet">
                      {selectedAnomaly.score}/100 ({selectedAnomaly.tier})
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-mono">
                    <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                      <div className="font-bold text-violet">{selectedAnomaly.absurdity}/10</div>
                      <div className="text-zinc-500 dark:text-zinc-400">Absurd</div>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                      <div className="font-bold text-cyan">{selectedAnomaly.rarity}/10</div>
                      <div className="text-zinc-500 dark:text-zinc-400">Rarity</div>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                      <div className="font-bold text-zinc-700 dark:text-zinc-300">{selectedAnomaly.craft}/10</div>
                      <div className="text-zinc-500 dark:text-zinc-400">Craft</div>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                      <div className="font-bold text-magenta">{selectedAnomaly.cultural_novelty}/10</div>
                      <div className="text-zinc-500 dark:text-zinc-400">Novelty</div>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                      <div className="font-bold text-amber-500">{selectedAnomaly.wit}/10</div>
                      <div className="text-zinc-500 dark:text-zinc-400">Wit</div>
                    </div>
                  </div>
                </div>

                {/* AI Verdict */}
                <div className="p-4 rounded-xl bg-violet/5 dark:bg-violet/10 border border-violet/20 text-xs text-zinc-800 dark:text-zinc-200 italic">
                  <strong>Gemini Verdict:</strong> &ldquo;{selectedAnomaly.verdict}&rdquo;
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span>Documented by @{selectedAnomaly.submitted_by}</span>
                  <button
                    onClick={() => setSelectedAnomaly(null)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-medium transition-colors cursor-pointer"
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
