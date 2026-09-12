"use client";

import React, { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Camera,
  Upload,
  Sparkles,
  Calendar,
  Clock,
  Save,
  Trash2,
  RefreshCw,
  Check,
  AlertCircle,
  Send,
  FolderOpen,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Category } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { uploadPostPhoto, createPost, checkUploadRateLimit } from "@/lib/supabase/data";

export interface PostDraft {
  id: string;
  image_url: string;
  caption: string;
  category: Category;
  created_at: string;
  scheduled_for?: string | null;
}

export interface ScheduledPostItem {
  id: string;
  image_url: string;
  caption: string;
  category: Category;
  scheduled_for: string;
  created_at: string;
  status: "scheduled" | "published";
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

const VIBE_EMOJIS = ["🔮", "⚡", "👁️", "🛸", "🌌", "🔬", "✨", "❤️", "🔥"];

const emptySubscribe = () => () => {};

const generateUniqueId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const generateFilename = (prefix: string, ext = "jpg") =>
  `${prefix}-${Date.now()}.${ext}`;

const getTwoHoursLaterIso = () =>
  new Date(Date.now() + 7200000).toISOString();

const getDefaultScheduledIsoLocal = () => {
  const d = new Date();
  d.setHours(d.getHours() + 2);
  d.setMinutes(0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
}) => {
  const { user, profile } = useAuth();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Top Level Tab: create editor, drafts manager, scheduled queue
  const [activeTab, setActiveTab] = useState<"create" | "drafts" | "scheduled">("create");

  // Post form state
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState<string>("");
  const [category, setCategory] = useState<Category>("Objects");
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [scheduledDateTime, setScheduledDateTime] = useState<string>(getDefaultScheduledIsoLocal);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Submissions & Drafts state
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Drafts & Scheduled lists loaded from localStorage
  const [drafts, setDrafts] = useState<PostDraft[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("weca_post_drafts");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPostItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("weca_scheduled_posts");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  // Clean up camera on unmount or modal close
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Handle camera streaming
  useEffect(() => {
    if (!isCameraActive) {
      stopCamera();
      return;
    }

    let isMounted = true;
    const startCamera = async () => {
      setCameraError(null);
      stopCamera();
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API not supported in this browser.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: unknown) {
        console.warn("Camera stream error:", err);
        setCameraError(
          "Direct camera feed unavailable. You can use native camera capture or browse files."
        );
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isCameraActive, facingMode, stopCamera]);

  // Keyboard Escape listener
  const handleClose = useCallback(() => {
    stopCamera();
    setIsCameraActive(false);
    onClose();
  }, [stopCamera, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Take photo from active video feed
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flash effect
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    canvas.toBlob((blob) => {
      if (blob) {
        const capturedFile = new File([blob], generateFilename("anomaly-camera"), {
          type: "image/jpeg",
        });
        setFile(capturedFile);
        setPreviewUrl(dataUrl);
        stopCamera();
        setIsCameraActive(false);
        setError(null);
      }
    }, "image/jpeg", 0.92);
  };

  // File selection from dropzone
  const handleFileSelect = (selected: File) => {
    if (!selected.type.startsWith("image/")) {
      setError("Please select an image file (JPEG, PNG, WebP).");
      return;
    }
    setError(null);
    setFile(selected);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(selected);
  };

  // Quick schedule presets
  const applySchedulePreset = (type: "2h" | "tomorrow-am" | "tomorrow-pm" | "friday") => {
    const d = new Date();
    if (type === "2h") {
      d.setHours(d.getHours() + 2);
    } else if (type === "tomorrow-am") {
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
    } else if (type === "tomorrow-pm") {
      d.setDate(d.getDate() + 1);
      d.setHours(20, 0, 0, 0);
    } else if (type === "friday") {
      const day = d.getDay();
      const distance = (5 + 7 - day) % 7 || 7;
      d.setDate(d.getDate() + distance);
      d.setHours(18, 0, 0, 0);
    }
    const isoLocal = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setScheduledDateTime(isoLocal);
    setIsScheduled(true);
  };

  // Save Current Work as Draft
  const handleSaveDraft = () => {
    if (!previewUrl && !caption.trim()) {
      setError("Add a photograph or caption to save as draft.");
      return;
    }
    const newDraft: PostDraft = {
      id: generateUniqueId("draft"),
      image_url:
        previewUrl ||
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=80",
      caption: caption.trim(),
      category: category,
      created_at: new Date().toISOString(),
      scheduled_for: isScheduled ? scheduledDateTime : null,
    };

    const updated = [newDraft, ...drafts];
    setDrafts(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("weca_post_drafts", JSON.stringify(updated));
    }
    showToast("Anomaly draft saved successfully!");
    try {
      confetti({ particleCount: 25, spread: 45, origin: { y: 0.7 }, colors: ["#7C5CFC", "#22D3EE"] });
    } catch {}
  };

  // Resume Draft in Editor
  const handleResumeDraft = (draft: PostDraft) => {
    setActiveDraftId(draft.id);
    setPreviewUrl(draft.image_url);
    setCaption(draft.caption || "");
    setCategory(draft.category || "Objects");
    if (draft.scheduled_for) {
      setIsScheduled(true);
      setScheduledDateTime(draft.scheduled_for);
    } else {
      setIsScheduled(false);
    }
    setActiveTab("create");
    showToast("Draft loaded into studio!");
  };

  // Delete Draft
  const handleDeleteDraft = (draftId: string) => {
    const updated = drafts.filter((d) => d.id !== draftId);
    setDrafts(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("weca_post_drafts", JSON.stringify(updated));
    }
    showToast("Draft deleted.");
  };

  // Cancel Scheduled Post
  const handleCancelScheduled = (postId: string) => {
    const updated = scheduledPosts.filter((s) => s.id !== postId);
    setScheduledPosts(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("weca_scheduled_posts", JSON.stringify(updated));
    }
    showToast("Scheduled release cancelled.");
  };

  // Publish Scheduled Post Immediately
  const handlePublishNowScheduled = async (item: ScheduledPostItem) => {
    handleCancelScheduled(item.id);
    showToast("Publishing anomaly sighting now...");

    const currentUserId = user?.id || profile?.id || "demo-explorer";
    if (user && profile) {
      try {
        const res = await fetch(item.image_url);
        const blob = await res.blob();
        const f = new File([blob], generateFilename("anomaly"), { type: blob.type || "image/jpeg" });
        const publicUrl = await uploadPostPhoto(f, currentUserId);
        await createPost({
          userId: currentUserId,
          imageUrl: publicUrl,
          caption: item.caption || null,
          authorProfile: profile,
        });
      } catch (e) {
        console.error("Error publishing scheduled item to Supabase", e);
      }
    } else {
      const guestPost = {
        id: generateUniqueId("post"),
        user_id: currentUserId,
        storage_path: item.image_url,
        caption: item.caption || "Scheduled anomaly sighting",
        category: item.category,
        wica_score: 95,
        created_at: new Date().toISOString(),
      };
      const existing = JSON.parse(localStorage.getItem("weca_guest_posts") || "[]");
      localStorage.setItem("weca_guest_posts", JSON.stringify([guestPost, ...existing]));
    }

    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } catch {}
    if (onPostCreated) onPostCreated();
  };

  // Main Submit (Publish Now OR Schedule)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl) {
      setError("Please capture or upload an anomaly photograph.");
      return;
    }

    const currentUserId = user?.id || profile?.id || "demo-explorer";

    // 1. If Scheduled Mode: Save to Scheduled Queue
    if (isScheduled) {
      const scheduledItem: ScheduledPostItem = {
        id: generateUniqueId("sched"),
        image_url: previewUrl,
        caption: caption.trim() || "Scheduled anomaly sighting",
        category,
        scheduled_for: scheduledDateTime || getTwoHoursLaterIso(),
        created_at: new Date().toISOString(),
        status: "scheduled",
      };
      const updated = [scheduledItem, ...scheduledPosts];
      setScheduledPosts(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem("weca_scheduled_posts", JSON.stringify(updated));
      }
      if (activeDraftId) {
        handleDeleteDraft(activeDraftId);
        setActiveDraftId(null);
      }
      showToast(`Post scheduled for ${new Date(scheduledItem.scheduled_for).toLocaleString()}`);
      try {
        confetti({
          particleCount: 40,
          spread: 55,
          origin: { y: 0.6 },
          colors: ["#7C5CFC", "#22D3EE", "#10B981"],
        });
      } catch {}
      handleClose();
      return;
    }

    // 2. Direct Immediate Post
    setUploading(true);
    setError(null);

    try {
      let uploadableFile = file;
      if (!uploadableFile && previewUrl) {
        try {
          const res = await fetch(previewUrl);
          const blob = await res.blob();
          uploadableFile = new File([blob], generateFilename("anomaly"), {
            type: blob.type || "image/jpeg",
          });
        } catch (e) {
          console.warn("Could not convert previewUrl to file, continuing with previewUrl", e);
        }
      }

      if (user && profile && uploadableFile) {
        // Authenticated Supabase flow
        const limitCheck = await checkUploadRateLimit(currentUserId);
        if (!limitCheck.allowed) {
          setError(
            `Hourly limit reached (${limitCheck.max}/${limitCheck.max}). Wait before submitting more.`
          );
          setUploading(false);
          return;
        }

        const publicUrl = await uploadPostPhoto(uploadableFile, currentUserId);
        await createPost({
          userId: currentUserId,
          imageUrl: publicUrl,
          caption: caption.trim() || null,
          authorProfile: profile,
        });
      } else {
        // Guest / Demo Mode flow: save in localStorage guest posts
        const guestPost = {
          id: generateUniqueId("post"),
          user_id: currentUserId,
          storage_path: previewUrl,
          caption: caption.trim() || "Anomaly sighting in Sector 9",
          category,
          wica_score: 94,
          created_at: new Date().toISOString(),
        };
        const existing = JSON.parse(localStorage.getItem("weca_guest_posts") || "[]");
        localStorage.setItem("weca_guest_posts", JSON.stringify([guestPost, ...existing]));
      }

      if (activeDraftId) {
        handleDeleteDraft(activeDraftId);
        setActiveDraftId(null);
      }

      showToast("Anomaly posted to community feed!");
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#7C5CFC", "#22D3EE", "#10B981"],
        });
      } catch {}

      if (onPostCreated) onPostCreated();
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to publish post.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 dark:bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 rounded-t-[32px] sm:rounded-3xl p-4 sm:p-7 text-zinc-900 dark:text-zinc-100 shadow-2xl relative flex flex-col max-h-[94vh] sm:max-h-[92vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 duration-300">
        {/* Mobile Drag Indicator Handle */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto mb-2.5 sm:hidden shrink-0" />

        {/* Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-violet/15 dark:bg-violet/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-cyan/10 dark:bg-cyan/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800/80 shrink-0 gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet/20 to-cyan/20 border border-violet/30 flex items-center justify-center text-violet shadow-md shadow-violet/10">
              <Sparkles className="w-5 h-5 text-cyan" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Create Anomaly Sighting</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet/15 text-violet border border-violet/30">
                  Studio
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                Capture, document, or schedule anomaly reports
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-create-post-modal-btn"
            onClick={handleClose}
            className="p-2.5 rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Tabs: Create Sighting, Drafts, Scheduled */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 my-3 shrink-0 text-xs">
          <button
            type="button"
            id="tab-create-sighting"
            onClick={() => setActiveTab("create")}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "create"
                ? "bg-violet text-white shadow-sm font-semibold"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Sighting</span>
          </button>
          <button
            type="button"
            id="tab-drafts"
            onClick={() => setActiveTab("drafts")}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "drafts"
                ? "bg-violet text-white shadow-sm font-semibold"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Drafts</span>
            {drafts.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {drafts.length}
              </span>
            )}
          </button>
          <button
            type="button"
            id="tab-scheduled"
            onClick={() => setActiveTab("scheduled")}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "scheduled"
                ? "bg-violet text-white shadow-sm font-semibold"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Scheduled</span>
            {scheduledPosts.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {scheduledPosts.length}
              </span>
            )}
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-2.5 mb-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-2.5 mb-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: CREATE SIGHTING FORM */}
        {activeTab === "create" && (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            <div className="space-y-4 overflow-y-auto pr-1 py-1 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800 flex-1 min-h-0">
              {/* SOURCE SELECTOR: LIVE CAMERA VS FILE UPLOAD */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Anomaly Photograph</span>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPreviewUrl(null);
                      setIsCameraActive(false);
                    }}
                    className="text-[11px] text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 transition-colors"
                  >
                    Clear photo
                  </button>
                )}
              </label>

              {/* View 1: Active Live Camera Viewfinder */}
              {isCameraActive ? (
                <div className="relative rounded-2xl overflow-hidden bg-black border border-zinc-800 aspect-video flex items-center justify-center shadow-lg">
                  {/* Flash Overlay */}
                  {isFlashing && (
                    <div className="absolute inset-0 bg-white z-30 transition-opacity duration-200" />
                  )}

                  {/* Video Stream Element */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Camera Viewfinder Crosshairs */}
                  <div className="absolute inset-4 pointer-events-none border border-white/20 rounded-xl flex items-center justify-center">
                    <div className="w-8 h-8 border-t-2 border-l-2 border-cyan absolute top-2 left-2" />
                    <div className="w-8 h-8 border-t-2 border-r-2 border-cyan absolute top-2 right-2" />
                    <div className="w-8 h-8 border-b-2 border-l-2 border-cyan absolute bottom-2 left-2" />
                    <div className="w-8 h-8 border-b-2 border-r-2 border-cyan absolute bottom-2 right-2" />
                    <div className="text-[10px] font-mono text-cyan/70 bg-black/50 px-2 py-0.5 rounded-full">
                      OPTICAL RETICLE ACTIVE
                    </div>
                  </div>

                  {/* Camera Controls Bar */}
                  <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-6 z-20">
                    <button
                      type="button"
                      onClick={() =>
                        setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
                      }
                      className="p-2.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white border border-zinc-700 transition-all cursor-pointer shadow-md"
                      title="Flip Camera"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>

                    {/* Big Shutter Button */}
                    <button
                      type="button"
                      id="camera-shutter-btn"
                      onClick={capturePhoto}
                      className="w-14 h-14 rounded-full bg-white hover:bg-zinc-200 p-1 transition-all active:scale-90 shadow-xl cursor-pointer flex items-center justify-center group"
                      title="Capture Anomaly Photo"
                    >
                      <div className="w-full h-full rounded-full border-2 border-black bg-white group-hover:scale-95 transition-transform" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCameraActive(false)}
                      className="p-2.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 transition-all cursor-pointer shadow-md"
                      title="Exit Camera"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {cameraError && (
                    <div className="absolute inset-0 bg-black/90 p-4 flex flex-col items-center justify-center text-center gap-2 text-xs text-zinc-300 z-40">
                      <AlertCircle className="w-6 h-6 text-amber-400" />
                      <span>{cameraError}</span>
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => nativeCameraInputRef.current?.click()}
                          className="px-3 py-1.5 bg-violet hover:bg-violet/90 text-white rounded-lg text-xs font-semibold"
                        >
                          Native Camera
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsCameraActive(false)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs"
                        >
                          Use File Upload
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : previewUrl ? (
                /* View 2: Image Preview */
                <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 max-h-64 flex items-center justify-center group">
                  <img
                    src={previewUrl}
                    alt="Anomaly Preview"
                    className="w-full max-h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCameraActive(true)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-white text-xs font-semibold border border-zinc-700 flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5 text-cyan" />
                      Retake
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-white text-xs font-semibold border border-zinc-700 flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-violet" />
                      Change File
                    </button>
                  </div>
                </div>
              ) : (
                /* View 3: Source Choice (Camera vs Upload) */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Camera Button */}
                  <div
                    id="open-live-camera-btn"
                    onClick={() => setIsCameraActive(true)}
                    className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950/70 border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-violet/60 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/50 transition-all flex flex-col items-center justify-center text-center cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-violet/10 border border-violet/20 flex items-center justify-center text-violet group-hover:scale-110 transition-transform mb-2.5">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-violet transition-colors">
                      Open Camera
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Snap live anomaly photo
                    </span>
                  </div>

                  {/* Dropzone File Upload */}
                  <div
                    id="open-file-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950/70 border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-cyan/60 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/50 transition-all flex flex-col items-center justify-center text-center cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center text-cyan group-hover:scale-110 transition-transform mb-2.5">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-cyan transition-colors">
                      Browse Files
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      JPEG, PNG, WebP up to 15MB
                    </span>
                  </div>
                </div>
              )}

              {/* Hidden File Inputs */}
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
              <input
                ref={nativeCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
            </div>

            {/* CAPTION & QUICK EMOJIS */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Anomaly Notes & Caption
                </label>
                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{caption.length}/280</span>
              </div>
              <textarea
                id="create-post-caption-input"
                rows={2}
                maxLength={280}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Describe the strange visual occurrence or optical glitch..."
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet transition-all resize-none"
              />

              {/* Vibe Emoji Quick Bar */}
              <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono shrink-0 mr-1">Vibe:</span>
                {VIBE_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setCaption((prev) => (prev ? `${prev} ${emoji}` : emoji))}
                    className="p-1 text-xs rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* CATEGORY SELECTOR */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Anomaly Classification</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {(["Objects", "Nature", "Human-Made", "Animals", "Coincidences", "Food"] as Category[]).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-medium transition-all ${
                        category === cat
                          ? "bg-violet text-white font-semibold shadow-sm border border-violet/50"
                          : "bg-zinc-100 dark:bg-zinc-950/70 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* SCHEDULE POSTING PANEL */}
            <div className="p-3.5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan" />
                  <div>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-white block">
                      Scheduled Release
                    </span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                      Queue anomaly report for future community drop
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="schedule-toggle-input"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-200 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan" />
                </label>
              </div>

              {isScheduled && (
                <div className="space-y-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800/60 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <input
                      id="schedule-datetime-picker"
                      type="datetime-local"
                      value={scheduledDateTime}
                      onChange={(e) => setScheduledDateTime(e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-200 font-mono focus:outline-none focus:border-cyan"
                    />
                    <span className="text-[11px] text-cyan font-mono font-semibold">
                      Will publish automatically
                    </span>
                  </div>

                  {/* Schedule Quick Presets */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => applySchedulePreset("2h")}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                    >
                      +2 Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => applySchedulePreset("tomorrow-am")}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                    >
                      Tomorrow 9:00 AM
                    </button>
                    <button
                      type="button"
                      onClick={() => applySchedulePreset("tomorrow-pm")}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                    >
                      Tomorrow 8:00 PM
                    </button>
                    <button
                      type="button"
                      onClick={() => applySchedulePreset("friday")}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                    >
                      Friday Peak
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

            {/* ACTION FOOTER */}
            <div className="pt-3 pb-safe sm:pb-0 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between gap-2.5 shrink-0">
              <button
                type="button"
                id="save-draft-btn"
                onClick={handleSaveDraft}
                className="px-3.5 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900 border border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
              >
                <Save className="w-3.5 h-3.5 text-zinc-400" />
                <span>Save Draft</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 text-xs font-semibold transition-colors cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  id="submit-post-btn"
                  disabled={uploading || !previewUrl}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-40 min-h-[44px] ${
                    isScheduled
                      ? "bg-gradient-to-r from-cyan to-blue-600 hover:from-cyan/90 text-zinc-950 shadow-cyan/20"
                      : "bg-gradient-to-r from-violet to-purple-600 hover:from-violet/90 text-white shadow-violet/25"
                  }`}
                >
                  {uploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : isScheduled ? (
                    <>

                      <Calendar className="w-3.5 h-3.5" />
                      <span>Schedule Anomaly</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Publish Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: DRAFTS MANAGER */}
        {activeTab === "drafts" && (
          <div className="space-y-3 overflow-y-auto pr-1 py-2 flex-1 min-h-0 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-300">
                Saved Anomaly Drafts ({drafts.length})
              </span>
              <button
                type="button"
                onClick={() => setActiveTab("create")}
                className="text-xs text-violet hover:underline font-semibold"
              >
                + Create New
              </button>
            </div>

            {drafts.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-zinc-500 space-y-2">
                <FolderOpen className="w-8 h-8 mx-auto text-zinc-400 dark:text-zinc-600" />
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-400">No saved drafts</p>
                <p className="text-[11px] text-zinc-500">
                  When capturing anomalies, click &ldquo;Save Draft&rdquo; to resume anytime.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {drafts.map((d) => (
                  <div
                    key={d.id}
                    className="p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={d.image_url}
                        alt="Draft"
                        className="w-12 h-12 rounded-lg object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                          {d.caption || "Untitled Draft"}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500">
                          {d.category} • {new Date(d.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleResumeDraft(d)}
                        className="px-3 py-1.5 rounded-lg bg-violet/15 hover:bg-violet/25 text-violet border border-violet/30 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Resume
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDraft(d.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Delete Draft"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SCHEDULED POSTS QUEUE */}
        {activeTab === "scheduled" && (
          <div className="space-y-3 overflow-y-auto pr-1 py-2 flex-1 min-h-0 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-300">
                Scheduled Anomaly Drops ({scheduledPosts.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsScheduled(true);
                  setActiveTab("create");
                }}
                className="text-xs text-cyan hover:underline font-semibold"
              >
                + Schedule Sighting
              </button>
            </div>

            {scheduledPosts.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-zinc-500 space-y-2">
                <Calendar className="w-8 h-8 mx-auto text-zinc-400 dark:text-zinc-600" />
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-400">No scheduled anomaly releases</p>
                <p className="text-[11px] text-zinc-500">
                  Toggle &ldquo;Scheduled Release&rdquo; in the editor to queue future sightings.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {scheduledPosts.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={s.image_url}
                        alt="Scheduled"
                        className="w-12 h-12 rounded-lg object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                          {s.caption}
                        </div>
                        <div className="text-[10px] font-mono text-cyan flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>Drops: {new Date(s.scheduled_for).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePublishNowScheduled(s)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Publish Now
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelScheduled(s.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Cancel Schedule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
