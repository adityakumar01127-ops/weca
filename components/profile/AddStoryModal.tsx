"use client";

import React, { useState, useRef } from "react";
import { X, Upload, Sparkles, Image as ImageIcon, Check } from "lucide-react";
import confetti from "canvas-confetti";
import { StoryItem } from "./StoryViewerModal";

interface AddStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStory: (newStory: StoryItem) => void;
  availablePhotos?: { id: string; url: string; caption?: string }[];
}

const DEFAULT_CANDIDATES = [
  { id: "cand-1", url: "/anom-1.jpg", caption: "Optical refraction Tokyo" },
  { id: "cand-2", url: "/anom-2.jpg", caption: "Bioluminescent botanical glitch" },
  { id: "cand-3", url: "/anom-3.jpg", caption: "Atmospheric resonance in night sky" },
];

export const AddStoryModal: React.FC<AddStoryModalProps> = ({
  isOpen,
  onClose,
  onAddStory,
  availablePhotos = DEFAULT_CANDIDATES,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(availablePhotos[0]?.url || "/anom-1.jpg");
  const [caption, setCaption] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setSelectedImage(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = () => {
    if (!selectedImage) return;

    const newStory: StoryItem = {
      id: `story-${Date.now()}`,
      image_url: selectedImage,
      caption: caption.trim() || undefined,
      created_at: "Just now",
      wica_score: Math.floor(Math.random() * 10) + 88,
    };

    onAddStory(newStory);
    try {
      confetti({
        particleCount: 30,
        spread: 45,
        origin: { y: 0.4 },
        colors: ["#22D3EE", "#7C5CFC", "#FF4D8D"],
      });
    } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-sm bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-3xl border border-zinc-200 dark:border-zinc-800/90 shadow-2xl p-5 text-zinc-900 dark:text-zinc-100 font-sans space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-900 dark:text-white">
            <Sparkles className="w-3.5 h-3.5 text-cyan" />
            <span>Add to Anomaly Story</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Story Preview Card */}
        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-inner group">
          <img
            src={selectedImage}
            alt="Story preview"
            className="w-full h-full object-cover"
          />

          {/* Upload Button Overlay */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[10px] font-mono text-white hover:bg-black/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
          >
            <Upload className="w-3 h-3 text-cyan" />
            <span>Upload Photo</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Live Caption Overlay Preview */}
          {caption.trim() && (
            <div className="absolute bottom-3 inset-x-3 p-2 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-xs font-mono text-center text-white truncate shadow-lg">
              {caption}
            </div>
          )}
        </div>

        {/* Pick from Sightings Strip */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Or select from recent sightings:
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {availablePhotos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => {
                  setSelectedImage(photo.url);
                  if (photo.caption && !caption) setCaption(photo.caption);
                }}
                className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-transform hover:scale-105 ${
                  selectedImage === photo.url
                    ? "border-cyan ring-2 ring-cyan/30"
                    : "border-zinc-200 dark:border-zinc-800 opacity-70 hover:opacity-100"
                }`}
              >
                <img src={photo.url} alt="thumbnail" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Caption Input */}
        <div className="space-y-1">
          <input
            type="text"
            maxLength={75}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add story caption or sighting coordinates..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 font-mono focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/30 transition-all"
          />
        </div>

        {/* Share Button */}
        <button
          type="button"
          onClick={handlePublish}
          className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold text-xs transition-all active:scale-[0.98] cursor-pointer shadow-md flex items-center justify-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Share to Story</span>
        </button>
      </div>
    </div>
  );
};
