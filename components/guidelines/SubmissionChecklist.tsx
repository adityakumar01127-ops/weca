"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Sparkles, ArrowRight } from "lucide-react";

export const SubmissionChecklist: React.FC = () => {
  const [checked, setChecked] = useState<{ [key: string]: boolean }>({});

  const items = [
    {
      id: "optical",
      label: "Captured via optical camera sensor (Zero AI generation or digital compositing)",
    },
    {
      id: "candid",
      label: "Candid discovery in the physical world (Not a staged internet prank)",
    },
    {
      id: "context",
      label: "Clear contextual view showing surroundings (Not an ultra-cropped blur)",
    },
    {
      id: "privacy",
      label: "Complies with privacy rules (No unconsenting private faces or license plates)",
    },
    {
      id: "metadata",
      label: "Original photo with intact EXIF timestamp and coordinates",
    },
  ];

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = Object.values(checked).filter(Boolean).length;
  const isReady = completedCount === items.length;

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-zinc-50 border border-zinc-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-mono text-violet font-semibold uppercase tracking-wider block mb-1">
            Pre-Flight Validator
          </span>
          <h3 className="font-display font-bold text-xl text-ink">
            Does Your Anomaly Qualify?
          </h3>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-zinc-500">Readiness:</span>
          <span
            className={`font-bold px-2.5 py-1 rounded-full ${
              isReady
                ? "bg-emerald-100 text-emerald-800"
                : "bg-zinc-200 text-zinc-700"
            }`}
          >
            {completedCount} / {items.length} Checked
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {items.map((item) => {
          const isSelected = !!checked[item.id];
          return (
            <div
              key={item.id}
              onClick={() => toggle(item.id)}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? "bg-violet/5 border-violet/30 text-ink"
                  : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
              }`}
            >
              {isSelected ? (
                <CheckCircle2 className="w-4 h-4 text-violet shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
              )}
              <span className="text-xs leading-relaxed select-none">{item.label}</span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-200">
        <p className="text-xs text-zinc-500">
          {isReady
            ? "Your anomaly meets all 5 baseline standards for the Wica Index!"
            : "Check all 5 criteria to verify submission qualification."}
        </p>

        {isReady && (
          <Link
            href="/"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ink hover:bg-zinc-800 text-white font-semibold text-xs transition-colors shadow-sm animate-fade-in"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan" />
            <span>Upload to World Feed</span>
          </Link>
        )}
      </div>
    </div>
  );
};
