"use client";

import React, { useState, useRef } from "react";
import { X, Image as ImageIcon, Sparkles, Trash2, Check, Upload, Compass } from "lucide-react";
import confetti from "canvas-confetti";
import { WicaImage } from "@/lib/types";
import { StoryItem } from "./StoryViewerModal";

export interface HighlightItem {
  id: string;
  name: string;
  cover_image?: string;
  icon?: string;
  gradient?: string;
  stories: StoryItem[];
}

interface HighlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (highlight: HighlightItem) => void;
  onDelete?: (highlightId: string) => void;
  editingHighlight?: HighlightItem | null;
  userSightings: WicaImage[];
}

const PRESET_GLYPHS = [
  { icon: "🛸", label: "Glitch / UFO" },
  { icon: "⚡", label: "Energy Flux" },
  { icon: "👁️", label: "Cryptid Eye" },
  { icon: "🌌", label: "Deep Cosmos" },
  { icon: "🔬", label: "Lab Signal" },
  { icon: "⛩️", label: "Tokyo Zone" },
  { icon: "🌿", label: "Rare Flora" },
  { icon: "🔮", label: "Occult Artifact" },
  { icon: "💎", label: "Crystalline" },
  { icon: "🧬", label: "Bio-Anomaly" },
  { icon: "🛰️", label: "Orbital Relay" },
  { icon: "🔥", label: "Plasma Core" },
];

const PRESET_GRADIENTS = [
  { id: "violet-cyan", class: "from-violet/80 via-purple-600/70 to-cyan/80", label: "Chromatic" },
  { id: "emerald-teal", class: "from-emerald-500/80 via-teal-600/70 to-cyan/80", label: "Bio-Field" },
  { id: "amber-rose", class: "from-amber-500/80 via-orange-600/70 to-rose-600/80", label: "Solar Flare" },
  { id: "indigo-fuchsia", class: "from-indigo-600/80 via-fuchsia-600/70 to-pink-500/80", label: "Sub-Space" },
  { id: "zinc-dark", class: "from-zinc-800 via-zinc-900 to-zinc-950", label: "Obsidian" },
];

const SUGGESTED_NAMES = [
  "Glitch Finds",
  "Tokyo Night",
  "Rare Nature",
  "Signals",
  "Field Notes",
  "Deep Void",
];

export const HighlightModal: React.FC<HighlightModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingHighlight,
  userSightings,
}) => {
  const [name, setName] = useState("");
  const [coverType, setCoverType] = useState<"glyph" | "image">("glyph");
  const [selectedGlyph, setSelectedGlyph] = useState("🛸");
  const [selectedGradient, setSelectedGradient] = useState(PRESET_GRADIENTS[0].class);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [selectedSightingIds, setSelectedSightingIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevEditingHighlight, setPrevEditingHighlight] = useState(editingHighlight);

  if (isOpen !== prevIsOpen || editingHighlight !== prevEditingHighlight) {
    setPrevIsOpen(isOpen);
    setPrevEditingHighlight(editingHighlight);
    if (isOpen) {
      if (editingHighlight) {
        setName(editingHighlight.name || "");
        if (editingHighlight.cover_image && !editingHighlight.icon) {
          setCoverType("image");
          setCoverImageUrl(editingHighlight.cover_image);
        } else {
          setCoverType("glyph");
          setSelectedGlyph(editingHighlight.icon || "🛸");
          setSelectedGradient(editingHighlight.gradient || PRESET_GRADIENTS[0].class);
          setCoverImageUrl(editingHighlight.cover_image || "");
        }
        setSelectedSightingIds(editingHighlight.stories?.map((s) => s.id) || []);
      } else {
        setName("");
        setCoverType("glyph");
        setSelectedGlyph("🛸");
        setSelectedGradient(PRESET_GRADIENTS[0].class);
        setCoverImageUrl("");
        setSelectedSightingIds(userSightings.slice(0, 2).map((s) => s.id));
      }
    }
  }

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCoverImageUrl(result);
        setCoverType("image");
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSightingSelection = (id: string) => {
    setSelectedSightingIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    const trimmedName = name.trim() || "Expedition";
    
    // Assemble stories for this highlight
    let highlightStories: StoryItem[] = [];
    if (selectedSightingIds.length > 0) {
      highlightStories = userSightings
        .filter((s) => selectedSightingIds.includes(s.id))
        .map((s) => ({
          id: s.id,
          image_url: s.storage_path,
          caption: s.caption || trimmedName,
          created_at: s.created_at,
          wica_score: s.wica_score,
        }));
    }

    // If no sightings were picked, provide at least one default slide
    if (highlightStories.length === 0) {
      highlightStories = [
        {
          id: `slide-${Date.now()}`,
          image_url:
            coverType === "image" && coverImageUrl
              ? coverImageUrl
              : "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80",
          caption: `${trimmedName} expedition findings`,
          created_at: new Date().toISOString(),
          wica_score: 92,
        },
      ];
    }

    const highlightItem: HighlightItem = {
      id: editingHighlight?.id || `hl-${Date.now()}`,
      name: trimmedName,
      cover_image: coverType === "image" ? coverImageUrl : undefined,
      icon: coverType === "glyph" ? selectedGlyph : undefined,
      gradient: coverType === "glyph" ? selectedGradient : undefined,
      stories: highlightStories,
    };

    onSave(highlightItem);
    try {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.6 },
        colors: ["#7C5CFC", "#22D3EE", "#10B981"],
      });
    } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-zinc-100 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Glow Effects */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-violet/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-cyan/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-violet/10 text-violet border border-violet/20">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {editingHighlight ? "Edit Expedition Highlight" : "New Expedition Highlight"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="space-y-5 overflow-y-auto pr-1 py-4 scrollbar-thin scrollbar-thumb-zinc-800">
          {/* Live Preview Circle */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-violet via-cyan to-purple-500 shadow-lg shadow-violet/25 flex items-center justify-center">
                <div className="w-full h-full rounded-full overflow-hidden bg-zinc-950 flex items-center justify-center">
                  {coverType === "glyph" ? (
                    <div
                      className={`w-full h-full bg-gradient-to-br ${selectedGradient} flex items-center justify-center text-3xl select-none`}
                    >
                      {selectedGlyph}
                    </div>
                  ) : coverImageUrl ? (
                    <img
                      src={coverImageUrl}
                      alt="Highlight cover"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-500">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-violet text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md border border-zinc-900">
                Preview
              </div>
            </div>
            <span className="text-xs font-semibold text-zinc-200 mt-2 truncate max-w-[120px]">
              {name.trim() || "Collection"}
            </span>
          </div>

          {/* Highlight Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-300">Highlight Title</label>
              <span className="text-[10px] font-mono text-zinc-500">{name.length}/15</span>
            </div>
            <input
              id="highlight-title-input"
              type="text"
              maxLength={15}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Glitch Finds, Tokyo Night..."
              className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet transition-all"
            />
            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SUGGESTED_NAMES.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setName(sug)}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50 transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Cover Style Selector Tabs */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">Cover Icon & Style</label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800 mb-3">
              <button
                type="button"
                id="cover-tab-glyph"
                onClick={() => setCoverType("glyph")}
                className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                  coverType === "glyph"
                    ? "bg-violet text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Anomaly Glyphs
              </button>
              <button
                type="button"
                id="cover-tab-image"
                onClick={() => setCoverType("image")}
                className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                  coverType === "image"
                    ? "bg-violet text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Photo / Sightings
              </button>
            </div>

            {coverType === "glyph" ? (
              <div className="space-y-3 p-3 bg-zinc-950/60 rounded-2xl border border-zinc-800/80">
                {/* Glyph Picker */}
                <div>
                  <span className="text-[11px] text-zinc-400 mb-2 block">Choose Anomaly Glyph:</span>
                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_GLYPHS.map((item) => (
                      <button
                        key={item.icon}
                        type="button"
                        onClick={() => setSelectedGlyph(item.icon)}
                        title={item.label}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                          selectedGlyph === item.icon
                            ? "bg-violet/25 border-2 border-violet scale-105 text-white"
                            : "bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 text-zinc-300"
                        }`}
                      >
                        {item.icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gradient Picker */}
                <div>
                  <span className="text-[11px] text-zinc-400 mb-1.5 block">Backdrop Aura:</span>
                  <div className="flex items-center gap-2">
                    {PRESET_GRADIENTS.map((grad) => (
                      <button
                        key={grad.id}
                        type="button"
                        onClick={() => setSelectedGradient(grad.class)}
                        title={grad.label}
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${grad.class} transition-all ${
                          selectedGradient === grad.class
                            ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110"
                            : "opacity-70 hover:opacity-100"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 p-3 bg-zinc-950/60 rounded-2xl border border-zinc-800/80">
                {/* Upload or Pick Sightings */}
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs text-white flex items-center justify-center gap-2 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-cyan" />
                    Upload Image
                  </button>
                </div>

                {/* Sighting Gallery Selector */}
                {userSightings.length > 0 && (
                  <div>
                    <span className="text-[11px] text-zinc-400 mb-1.5 block">
                      Or pick from verified sightings:
                    </span>
                    <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto pr-1">
                      {userSightings.map((sighting) => {
                        const isChosen = coverImageUrl === sighting.storage_path;
                        return (
                          <div
                            key={sighting.id}
                            onClick={() => setCoverImageUrl(sighting.storage_path)}
                            className={`aspect-square rounded-xl overflow-hidden border cursor-pointer relative group transition-all ${
                              isChosen
                                ? "border-violet ring-2 ring-violet"
                                : "border-zinc-800 hover:border-zinc-600"
                            }`}
                          >
                            <img
                              src={sighting.storage_path}
                              alt={sighting.caption || "Sighting"}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            {isChosen && (
                              <div className="absolute inset-0 bg-violet/40 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white drop-shadow" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stories / Sightings Checklist */}
          {userSightings.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Include Sightings in Story Reel
                </label>
                <span className="text-[10px] font-mono text-zinc-500">
                  {selectedSightingIds.length} selected
                </span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {userSightings.map((s) => {
                  const isChecked = selectedSightingIds.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleSightingSelection(s.id)}
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? "bg-violet/10 border-violet/50 text-white"
                          : "bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <img
                          src={s.storage_path}
                          alt="Thumbnail"
                          className="w-8 h-8 rounded-lg object-cover shrink-0 border border-zinc-800"
                        />
                        <span className="truncate max-w-[200px]">
                          {s.caption || s.category}
                        </span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                          isChecked ? "bg-violet border-violet text-white" : "border-zinc-700 bg-zinc-900"
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-3 shrink-0">
          {editingHighlight && onDelete ? (
            <button
              type="button"
              id="highlight-delete-btn"
              onClick={() => {
                onDelete(editingHighlight.id);
                onClose();
              }}
              className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              id="highlight-save-btn"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet to-purple-600 hover:from-violet/90 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-violet/25 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {editingHighlight ? "Save Changes" : "Create Highlight"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
