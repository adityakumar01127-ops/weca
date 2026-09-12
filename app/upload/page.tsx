"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { uploadPostPhoto, createPost, checkUploadRateLimit } from "@/lib/supabase/data";
import { Upload, X, ArrowLeft, Image as ImageIcon, ShieldAlert, Sparkles } from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ allowed: boolean; remaining: number; max: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const currentUserId = user?.id || profile?.id;
    if (currentUserId) {
      checkUploadRateLimit(currentUserId).then((res) => {
        setRateLimitInfo({ allowed: res.allowed, remaining: res.remaining, max: res.max });
      });
    }
  }, [user?.id, profile?.id]);

  const handleFileSelect = (selected: File) => {
    if (!selected.type.startsWith("image/")) {
      setError("Please select an image file (JPEG, PNG, WebP).");
      return;
    }
    setError(null);
    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a photograph to upload.");
      return;
    }

    const currentUserId = user?.id || profile?.id;
    if (!currentUserId) return;

    setUploading(true);
    setError(null);

    try {
      // 0. Verify hourly upload rate limit
      const limitCheck = await checkUploadRateLimit(currentUserId);
      if (!limitCheck.allowed) {
        setError(
          `Hourly upload limit reached (${limitCheck.max}/${limitCheck.max}). Please wait before uploading more photos to preserve AI quota.`
        );
        setUploading(false);
        return;
      }

      // 1. Upload to Supabase Storage bucket 'posts'
      const publicUrl = await uploadPostPhoto(file, currentUserId);

      // 2. Insert into 'posts' table (triggers asynchronous AI scoring)
      await createPost({
        userId: currentUserId,
        imageUrl: publicUrl,
        caption: caption.trim() || null,
        authorProfile: profile,
      });

      // 3. Return to home feed where Realtime will show the score appear live
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
      setUploading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between pb-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg border border-zinc-800 hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight leading-[1.1]">
                Upload Photograph
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 font-mono mt-0.5">
                Share a candid anomaly moment with the community
              </p>
            </div>
          </div>

          {rateLimitInfo && (
            <div className="text-right">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
                rateLimitInfo.remaining === 0
                  ? "bg-rose-950/40 border-rose-800/60 text-rose-400"
                  : "bg-zinc-800/80 border-zinc-700/60 text-zinc-300"
              }`}>
                {rateLimitInfo.remaining === 0 ? (
                  <ShieldAlert className="w-3 h-3 text-rose-500" />
                ) : (
                  <Sparkles className="w-3 h-3 text-amber-500" />
                )}
                <span>{rateLimitInfo.remaining}/{rateLimitInfo.max} uploads left</span>
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dropzone */}
          {!previewUrl ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 rounded-2xl p-12 text-center cursor-pointer transition-colors space-y-3"
            >
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-200">
                  Click to select or drag and drop photo
                </p>
                <p className="text-[11px] text-zinc-400 mt-1 font-mono">
                  PNG, JPG, or WebP up to 10MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
              <img
                src={previewUrl}
                alt="Upload preview"
                className="w-full max-h-[480px] object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                }}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 hover:bg-black text-white transition-colors"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Caption Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Caption
            </label>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a brief caption or context for this photo..."
              className="w-full p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 resize-none leading-relaxed"
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <Link
              href="/"
              className="px-4 py-2 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={!file || uploading}
              className="px-5 py-2 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold disabled:opacity-40 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-zinc-900/40 border-t-zinc-900 rounded-full animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Post to Feed</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
