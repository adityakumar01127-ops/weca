"use client";

import React, { useState, useEffect, useCallback } from "react";
import { WicaImage, Category, CATEGORIES } from "@/lib/types";
import { PhotoCard } from "./PhotoCard";
import { PhotoDetailModal } from "./PhotoDetailModal";
import { Sparkles, ArrowUpDown, Filter, RefreshCw } from "lucide-react";

interface MasonryFeedProps {
  initialImages?: WicaImage[];
  newlyUploadedImage?: WicaImage | null;
}

export const MasonryFeed: React.FC<MasonryFeedProps> = ({
  initialImages = [],
  newlyUploadedImage,
}) => {
  const [images, setImages] = useState<WicaImage[]>(initialImages);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"score" | "latest">("score");
  const [loading, setLoading] = useState<boolean>(initialImages.length === 0);
  const [selectedImage, setSelectedImage] = useState<WicaImage | null>(null);

  useEffect(() => {
    let ignore = false;

    const params = new URLSearchParams();
    if (selectedCategory !== "All") params.append("category", selectedCategory);
    params.append("sortBy", sortBy);

    fetch(`/api/feed?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore && data.images) {
          setImages(data.images);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch feed:", err);
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedCategory, sortBy]);

  const refreshFeed = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory !== "All") params.append("category", selectedCategory);
    params.append("sortBy", sortBy);

    fetch(`/api/feed?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.images) {
          setImages(data.images);
        }
      })
      .catch((err) => {
        console.error("Failed to refresh feed:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // When an image is freshly uploaded, immediately show it at the top of the feed
  useEffect(() => {
    if (!newlyUploadedImage) return;

    const timer = setTimeout(() => {
      setSelectedCategory("All");
      setImages((prev) => [
        newlyUploadedImage,
        ...prev.filter((img) => img.id !== newlyUploadedImage.id),
      ]);
      const feedHeading = document.getElementById("world-feed-heading");
      if (feedHeading) {
        feedHeading.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [newlyUploadedImage]);

  const handleUpdateLikes = (imageId: string, liked: boolean, count: number) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId
          ? { ...img, user_has_liked: liked, likes_count: count }
          : img
      )
    );
  };

  return (
    <div className="w-full">
      {/* Control Bar: Categories & Sorting */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none -mx-2 px-2 sm:mx-0 sm:px-0">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-4 py-2 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer min-h-[40px] ${
              selectedCategory === "All"
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-semibold shadow-xs"
                : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
            }`}
          >
            All Anomalies
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer min-h-[40px] ${
                selectedCategory === cat
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-semibold shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto text-xs">
          <button
            onClick={() => setSortBy(sortBy === "score" ? "latest" : "score")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 font-mono transition-colors cursor-pointer min-h-[40px]"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
            <span>Sort: {sortBy === "score" ? "Highest Score" : "Most Recent"}</span>
          </button>

          <button
            onClick={refreshFeed}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Refresh feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Feed Content */}
      {loading && images.length === 0 ? (
        <div className="masonry-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="masonry-item rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-pulse"
              style={{ height: `${280 + (i % 3) * 60}px` }}
            />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-20 px-4">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mx-auto mb-3 text-zinc-400 dark:text-zinc-500">
            <Filter className="w-5 h-5" />
          </div>
          <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-white">No anomalies found</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            {selectedCategory !== "All"
              ? `No published photos in "${selectedCategory}" yet. Be the first to upload one!`
              : "No photos scored yet. Be the first to submit a photo to the index!"}
          </p>
        </div>
      ) : (
        <div className="masonry-grid">
          {images.map((image) => (
            <PhotoCard
              key={image.id}
              image={image}
              onOpenDetail={(img) => setSelectedImage(img)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <PhotoDetailModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
        onUpdateLikes={handleUpdateLikes}
      />
    </div>
  );
};
