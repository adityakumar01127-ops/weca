"use client";

import React, { useState, useEffect } from "react";
import { 
  Camera, 
  Target, 
  Users, 
  Crown, 
  Swords, 
  Trophy, 
  Eye, 
  Flame, 
  Zap, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  RefreshCw 
} from "lucide-react";
import { AchievementDefinition } from "@/lib/types";

interface AchievementProgress {
  definition: AchievementDefinition;
  unlocked: boolean;
  unlockedAt?: string | null;
  currentValue: number;
  progressPercent: number;
}

export const AchievementsGrid: React.FC = () => {
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/earnings/achievements");
      const data = await res.json();
      if (res.ok && data.success) {
        setAchievements(data.achievements);
      }
    } catch (err) {
      console.error("Failed to load achievements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Camera":
        return <Camera className="w-4 h-4 text-cyan-400" />;
      case "Target":
        return <Target className="w-4 h-4 text-emerald-400" />;
      case "Users":
        return <Users className="w-4 h-4 text-blue-400" />;
      case "Crown":
        return <Crown className="w-4 h-4 text-amber-400" />;
      case "Swords":
        return <Swords className="w-4 h-4 text-violet-400" />;
      case "Trophy":
        return <Trophy className="w-4 h-4 text-yellow-400" />;
      case "Eye":
        return <Eye className="w-4 h-4 text-pink-400" />;
      case "Flame":
        return <Flame className="w-4 h-4 text-orange-400" />;
      case "Zap":
      default:
        return <Zap className="w-4 h-4 text-violet-400" />;
    }
  };

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length || 9;
  const filtered = selectedCategory === "all"
    ? achievements
    : achievements.filter((a) => a.definition.category === selectedCategory);

  const categories = [
    { id: "all", label: "All Milestones" },
    { id: "content", label: "Content" },
    { id: "social", label: "Social & Followers" },
    { id: "battles", label: "Versus Battles" },
    { id: "milestones", label: "Platform Growth" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-400 font-mono text-xs font-bold flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              HUNTER MILESTONES
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-display font-black text-white">
            Prestige Achievements
          </h3>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Unlock trophies across content, followers, battles, and streaks to harvest one-time WC bounties.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-violet-400 font-bold px-3 py-1.5 rounded-xl bg-violet-950/40 border border-violet-800/40">
            {unlockedCount} / {totalCount} Unlocked ({Math.round((unlockedCount / Math.max(1, totalCount)) * 100)}%)
          </span>
          <button
            onClick={fetchAchievements}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            title="Refresh Achievements"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none font-mono text-xs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? "bg-zinc-100 dark:bg-white text-zinc-950 font-bold shadow-xs"
                : "bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid of Achievements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const def = item.definition;
          return (
            <div
              key={def.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                item.unlocked
                  ? "bg-zinc-900/80 border-violet-500/40 shadow-lg shadow-violet-950/20"
                  : "bg-zinc-900/40 border-zinc-800/80 opacity-75 hover:opacity-100 hover:border-zinc-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    item.unlocked ? "bg-zinc-800/90" : "bg-zinc-900"
                  }`}>
                    {getIcon(def.iconName)}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-mono font-bold border border-cyan-500/20">
                    +{def.reward_wc} WC
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-display font-bold text-sm text-white">{def.title}</h4>
                  {item.unlocked ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Lock className="w-3 h-3 text-zinc-500 shrink-0" />
                  )}
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  {def.description}
                </p>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                  <span>
                    {item.unlocked
                      ? "Unlocked"
                      : `${item.currentValue.toLocaleString()} / ${def.threshold.toLocaleString()}`}
                  </span>
                  <span>{item.progressPercent}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.unlocked ? "bg-emerald-400" : "bg-violet-500"
                    }`}
                    style={{ width: `${item.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
