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
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                Upload Photograph
              </h1>
              <p className="text-xs text-zinc-500 font-mono">
                Share a candid moment with the feed
              </p>
            </div>
          </div>

          {rateLimitInfo && (
            <div className="text-right">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
                rateLimitInfo.remaining === 0
                  ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-400"
                  : "bg-zinc-100 border-zinc-200 text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400"
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
              className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 rounded-2xl p-12 text-center cursor-pointer transition-colors space-y-3"
            >
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mx-auto text-zinc-500">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
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
            <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
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
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Caption
            </label>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a brief caption or context for this photo..."
              className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none leading-relaxed"
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Link
              href="/"
              className="px-4 py-2 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={!file || uploading}
              className="px-5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-medium disabled:opacity-40 transition-all flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
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
