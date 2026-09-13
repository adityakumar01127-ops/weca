"use client";

import React, { useState, useEffect } from "react";
import { WicaImage } from "@/lib/types";
import { X, Sparkles, Check, Loader2, AlertCircle } from "lucide-react";
import { getSafeImageUrl } from "@/lib/utils/image";

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: WicaImage | null;
  onSave: (imageId: string, newCaption: string) => Promise<void> | void;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({
  isOpen,
  onClose,
  image,
  onSave,
}) => {
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (image) {
      setCaption(image.caption || "");
      setError(null);
    }
  }, [image]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, saving]);

  if (!isOpen || !image) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onSave(image.id, caption.trim());
      onClose();
    } catch (err) {
      console.error("Failed to save post caption:", err);
      setError("Failed to update post caption. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const imageUrl = getSafeImageUrl(image.storage_path);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Edit Anomaly Post
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Image preview & info */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
            <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-200 dark:bg-zinc-800">
              <img
                src={imageUrl}
                alt="Post preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                {image.category || "Anomaly"}
              </div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
                Score: {image.wica_score || 0}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {new Date(image.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>

          {/* Caption input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Describe this curious anomaly..."
              rows={4}
              maxLength={500}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none transition-all"
            />
            <div className="flex justify-between items-center text-xs text-zinc-400">
              <span>Tell the community what makes this weird</span>
              <span>{caption.length} / 500</span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/20 disabled:opacity-50 transition-all"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
