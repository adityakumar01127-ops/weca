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
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${
              selectedCategory === "All"
                ? "bg-ink text-white font-semibold shadow-xs"
                : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
            }`}
          >
            All Anomalies
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${
                selectedCategory === cat
                  ? "bg-ink text-white font-semibold shadow-xs"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 bg-white text-zinc-700 font-mono transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <span>Sort: {sortBy === "score" ? "Highest Wica Score" : "Most Recent"}</span>
          </button>

          <button
            onClick={refreshFeed}
            className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-500 hover:text-ink transition-colors"
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
              className="masonry-item rounded-2xl bg-zinc-100 border border-zinc-200 overflow-hidden animate-pulse"
              style={{ height: `${280 + (i % 3) * 60}px` }}
            />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-20 px-4">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-3 text-zinc-400">
            <Filter className="w-5 h-5" />
          </div>
          <h3 className="font-display font-bold text-lg text-ink">No anomalies found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
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
