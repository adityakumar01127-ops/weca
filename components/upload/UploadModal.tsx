"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Category, CATEGORIES, WicaImage, ScoreBreakdown } from "@/lib/types";
import { ScoreReveal } from "./ScoreReveal";
import { X, UploadCloud, Camera, Image as ImageIcon, Sparkles, AlertCircle } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newImage: WicaImage) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, openAuthModal, updateUserWC } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>("Objects");
  const [caption, setCaption] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Score Reveal state
  const [revealedData, setRevealedData] = useState<{
    image: WicaImage;
    breakdown: ScoreBreakdown;
    heldForReview: boolean;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen && !revealedData) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.type.startsWith("image/")) {
        setError("Please select an image file (JPEG, PNG, WebP)");
        return;
      }
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (!selected.type.startsWith("image/")) {
        setError("Please drop a valid image file");
        return;
      }
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please pick or snap a photo of your strange find");
      return;
    }

    if (!user) {
      openAuthModal();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("category", category);
      formData.append("caption", caption);
      formData.append("country", country);
      formData.append("userId", user.id);
      formData.append("username", user.username);
      if (user.avatar_url) formData.append("avatarUrl", user.avatar_url);

      const res = await fetch("/api/upload-and-score", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to score photo");
      }

      // Update user WC
      updateUserWC(data.scoreBreakdown.composite_score);

      // Trigger Score Reveal View
      setRevealedData({
        image: data.image,
        breakdown: data.scoreBreakdown,
        heldForReview: data.heldForReview,
      });

      onSuccess(data.image);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred while scoring the photo";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishReveal = () => {
    setRevealedData(null);
    setFile(null);
    setPreviewUrl(null);
    setCaption("");
    setCountry("");
    onClose();
  };

  if (revealedData) {
    return (
      <ScoreReveal
        image={revealedData.image}
        breakdown={revealedData.breakdown}
        heldForReview={revealedData.heldForReview}
        previewUrl={previewUrl}
        onFinish={handleFinishReveal}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden p-6 sm:p-7 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-zinc-400 hover:text-ink hover:bg-zinc-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <span className="text-[11px] font-mono uppercase tracking-widest text-violet font-semibold block mb-0.5">
            Submit Real Anomaly
          </span>
          <h2 className="font-display font-bold text-2xl text-ink tracking-tight">
            Score Your Strange Find
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Real photos only. Scored on Absurdity, Rarity, Craft, Cultural Novelty, and Wit.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Dropzone or Preview */}
          {!previewUrl ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-200 hover:border-violet rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-zinc-50/60 group"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-100 group-hover:bg-purple-50 flex items-center justify-center text-zinc-600 group-hover:text-violet transition-colors mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-ink group-hover:text-violet transition-colors">
                Drop your photo here, or click to browse
              </span>
              <span className="text-xs text-zinc-400 mt-1">
                JPEG, PNG, WebP up to 10MB
              </span>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-ink text-xs font-medium transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Take Photo</span>
                </button>
              </div>

              <input
                id="wica-file-input"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-950 flex items-center justify-center max-h-72">
              <img
                src={previewUrl}
                alt="Upload preview"
                className="max-h-72 w-full object-contain"
              />
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                }}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-ink/70 hover:bg-ink text-white backdrop-blur-sm transition-colors"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Category (Required)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    category === cat
                      ? "bg-ink text-white shadow-sm ring-1 ring-ink"
                      : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Caption */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
              Caption (Optional)
            </label>
            <input
              type="text"
              placeholder="What makes this weird? e.g. 'Found in an abandoned rail yard'"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet transition-colors placeholder:text-zinc-400"
            />
          </div>

          {/* Optional Location */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
              Location / Country (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Iceland, Kyoto, Portland"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet transition-colors placeholder:text-zinc-400"
            />
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={!file || loading}
            className="w-full py-3 px-4 rounded-xl bg-ink hover:bg-zinc-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Weirdness Engine is analyzing photo...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan" />
                <span>Upload & Calculate Wica Score</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
