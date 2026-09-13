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
  Grid as GridIcon,
  Zap,
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
  initialMode?: "live" | "upload" | "drafts" | "scheduled";
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
  initialMode,
}) => {
  const { user, profile } = useAuth();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Top Level Tab: "live" (Instant Live Camera & Post), "upload" (File Studio), "drafts", "scheduled"
  const [activeTab, setActiveTab] = useState<"live" | "upload" | "drafts" | "scheduled">(
    initialMode || "live"
  );

  // Post form state
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState<string>("");
  const [category, setCategory] = useState<Category>("Objects");
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [scheduledDateTime, setScheduledDateTime] = useState<string>(getDefaultScheduledIsoLocal);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

  // Live Camera state
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [anomalyRating, setAnomalyRating] = useState<number>(94.5);

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
  const simCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  // Clean up camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Handle hardware camera streaming or simulated sensor fallback
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    setIsSimulated(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser environment.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
      }
    } catch (err) {
      console.warn("Hardware camera unavailable, enabling simulated sensor feed:", err);
      setIsSimulated(true);
    }
  }, [facingMode, stopCamera]);

  // Activate camera when modal is open and on live tab without photo preview
  useEffect(() => {
    if (isOpen && activeTab === "live" && !previewUrl) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, previewUrl, startCamera, stopCamera]);

  // Simulated Optical HUD Canvas Loop (runs when webcam hardware is not available)
  useEffect(() => {
    let animId: number;
    if (isSimulated && simCanvasRef.current && isOpen && activeTab === "live" && !previewUrl) {
      const canvas = simCanvasRef.current;
      const ctx = canvas.getContext("2d");
      let frame = 0;

      const render = () => {
        frame++;
        if (!ctx) return;
        const w = (canvas.width = 640);
        const h = (canvas.height = 480);

        // Cybernetic visual space
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, "#05060f");
        grad.addColorStop(0.5, "#0b0e22");
        grad.addColorStop(1, "#070814");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Scanning grid
        ctx.strokeStyle = "rgba(34, 211, 238, 0.12)";
        ctx.lineWidth = 1;
        const step = 40;
        for (let x = 0; x < w; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Pulsing anomaly visual breach
        const cx = w / 2 + Math.sin(frame * 0.035) * 35;
        const cy = h / 2 + Math.cos(frame * 0.025) * 25;
        const radius = 75 + Math.sin(frame * 0.06) * 12;

        const orbGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
        orbGrad.addColorStop(0, "rgba(124, 92, 252, 0.85)");
        orbGrad.addColorStop(0.4, "rgba(34, 211, 238, 0.5)");
        orbGrad.addColorStop(0.8, "rgba(236, 72, 153, 0.2)");
        orbGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        // Crosshairs & Target Box
        ctx.strokeStyle = "#22D3EE";
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - 36, cy - 36, 72, 72);

        // Sweeping scanner line
        const scanY = (frame * 3) % h;
        ctx.fillStyle = "rgba(34, 211, 238, 0.35)";
        ctx.fillRect(0, scanY, w, 2);

        // Optical HUD Text
        ctx.font = "bold 11px monospace";
        ctx.fillStyle = "#22D3EE";
        ctx.fillText("LIVE SENSOR • ANOMALY DETECTED", 18, 28);
        ctx.fillStyle = "#A78BFA";
        ctx.fillText(
          `FLUX: ${(93 + Math.sin(frame * 0.08) * 4).toFixed(1)}% • SECTOR 09`,
          18,
          46
        );

        animId = requestAnimationFrame(render);
      };

      animId = requestAnimationFrame(render);
    }
    return () => cancelAnimationFrame(animId);
  }, [isSimulated, isOpen, activeTab, previewUrl]);

  // Keyboard Escape listener
  const handleClose = useCallback(() => {
    stopCamera();
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

  // Capture Live Photo from hardware camera or optical sensor
  const capturePhoto = () => {
    const canvas = document.createElement("canvas");
    const video = videoRef.current;
    let captured = false;

    // Flash animation
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 220);

    if (!isSimulated && video && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        if (facingMode === "user") {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        captured = true;
      }
    }

    if (!captured && simCanvasRef.current) {
      canvas.width = simCanvasRef.current.width || 640;
      canvas.height = simCanvasRef.current.height || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(simCanvasRef.current, 0, 0);
        captured = true;
      }
    }

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const capturedFile = new File([blob], generateFilename("anomaly-live"), {
            type: "image/jpeg",
          });
          setFile(capturedFile);
          setPreviewUrl(dataUrl);
          setAnomalyRating(Number((89 + Math.random() * 10.2).toFixed(1)));
          stopCamera();
          setError(null);
        }
      },
      "image/jpeg",
      0.92
    );
  };

  // Reset live capture to take another photo
  const handleRetakeLive = () => {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
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
    setActiveTab("upload");
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
  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
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

        {/* Studio Tabs: Live Camera, Upload File, Drafts, Scheduled */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 my-3 shrink-0 text-xs">
          <button
            type="button"
            id="tab-live-camera"
            onClick={() => {
              setPreviewUrl(null);
              setFile(null);
              setActiveTab("live");
            }}
            className={`flex-1 py-1.5 px-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "live"
                ? "bg-violet text-white shadow-sm font-semibold"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping mr-0.5" />
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
          </button>
          <button
            type="button"
            id="tab-upload-file"
            onClick={() => setActiveTab("upload")}
            className={`flex-1 py-1.5 px-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "upload"
                ? "bg-violet text-white shadow-sm font-semibold"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            id="tab-drafts"
            onClick={() => setActiveTab("drafts")}
            className={`flex-1 py-1.5 px-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
            className={`flex-1 py-1.5 px-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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

        {/* ========================================================================= */}
        {/* TAB 1: LIVE CAMERA & 1-TAP POST                                           */}
        {/* ========================================================================= */}
        {activeTab === "live" && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {!previewUrl ? (
              /* Sub-view A: Live Camera Viewfinder & HUD */
              <div className="flex flex-col flex-1 min-h-0 space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-black border border-zinc-800 aspect-[4/3] sm:aspect-video flex items-center justify-center shadow-2xl group select-none">
                  {/* Flash Animation Overlay */}
                  {isFlashing && (
                    <div className="absolute inset-0 bg-white z-50 transition-opacity duration-200 pointer-events-none" />
                  )}

                  {/* Hardware Camera Video Stream */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isSimulated ? "hidden" : "block"} ${
                      facingMode === "user" ? "scale-x-[-1]" : ""
                    }`}
                  />

                  {/* Simulated Anomaly Sensor Canvas (graceful fallback) */}
                  <canvas
                    ref={simCanvasRef}
                    className={`w-full h-full object-cover ${isSimulated ? "block" : "hidden"}`}
                  />

                  {/* Rule-of-Thirds Grid Overlay */}
                  {showGrid && (
                    <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10">
                      <div className="border-r border-b border-white/15" />
                      <div className="border-r border-b border-white/15" />
                      <div className="border-b border-white/15" />
                      <div className="border-r border-b border-white/15" />
                      <div className="border-r border-b border-white/15" />
                      <div className="border-b border-white/15" />
                      <div className="border-r border-b border-white/15" />
                      <div className="border-r border-b border-white/15" />
                      <div />
                    </div>
                  )}

                  {/* Optical Reticle Corner Brackets */}
                  <div className="absolute inset-3 pointer-events-none z-20">
                    <div className="w-6 h-6 border-t-2 border-l-2 border-cyan absolute top-0 left-0" />
                    <div className="w-6 h-6 border-t-2 border-r-2 border-cyan absolute top-0 right-0" />
                    <div className="w-6 h-6 border-b-2 border-l-2 border-cyan absolute bottom-0 left-0" />
                    <div className="w-6 h-6 border-b-2 border-r-2 border-cyan absolute bottom-0 right-0" />
                  </div>

                  {/* Top HUD Controls */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between z-30 pointer-events-auto">
                    {/* Live Status Badge */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[11px] font-mono text-white shadow-md">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      <span className="font-bold text-rose-400">LIVE</span>
                      <span className="text-zinc-300">• OPTICAL SCANNER</span>
                    </div>

                    {/* Camera Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        id="toggle-camera-grid-btn"
                        onClick={() => setShowGrid(!showGrid)}
                        className={`p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
                          showGrid
                            ? "bg-cyan/25 border-cyan text-cyan"
                            : "bg-black/60 border-white/15 text-zinc-400 hover:text-white"
                        }`}
                        title="Toggle Alignment Grid"
                      >
                        <GridIcon className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        id="flip-camera-btn"
                        onClick={() =>
                          setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
                        }
                        className="p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white transition-all active:rotate-180 duration-300 cursor-pointer shadow-md"
                        title="Flip Camera (Front/Back)"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Shutter Controls Bar */}
                  <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-8 z-30 pointer-events-auto">
                    {/* Switch to File Upload */}
                    <button
                      type="button"
                      id="switch-to-upload-btn"
                      onClick={() => setActiveTab("upload")}
                      className="p-3 rounded-full bg-black/60 hover:bg-black/80 text-zinc-300 hover:text-white border border-white/15 backdrop-blur-md transition-all cursor-pointer shadow-md"
                      title="Upload from Device Files"
                    >
                      <Upload className="w-4 h-4 text-cyan" />
                    </button>

                    {/* Big Tactile Shutter Button */}
                    <button
                      type="button"
                      id="live-camera-shutter-btn"
                      onClick={capturePhoto}
                      className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full p-1 bg-gradient-to-tr from-cyan via-violet to-fuchsia-500 shadow-xl shadow-cyan/25 hover:shadow-cyan/50 transition-all active:scale-95 cursor-pointer flex items-center justify-center group"
                      title="Click Live Photo"
                    >
                      <div className="w-full h-full rounded-full bg-white dark:bg-zinc-950 p-1 flex items-center justify-center">
                        <div className="w-full h-full rounded-full bg-white group-hover:bg-zinc-100 dark:bg-white dark:group-hover:bg-zinc-200 transition-colors shadow-inner flex items-center justify-center">
                          <div className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-pulse" />
                        </div>
                      </div>
                    </button>

                    {/* Native Camera Trigger */}
                    <button
                      type="button"
                      id="native-camera-btn"
                      onClick={() => nativeCameraInputRef.current?.click()}
                      className="p-3 rounded-full bg-black/60 hover:bg-black/80 text-zinc-300 hover:text-white border border-white/15 backdrop-blur-md transition-all cursor-pointer shadow-md"
                      title="Device Native Camera"
                    >
                      <Camera className="w-4 h-4 text-violet" />
                    </button>
                  </div>
                </div>

                <p className="text-center text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                  Align optical anomaly within reticle and tap shutter to snap live.
                </p>
              </div>
            ) : (
              /* Sub-view B: Live Capture Review & 1-Tap Post ("Click Live and Post") */
              <div className="flex flex-col flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
                {/* Captured Anomaly Snapshot with Verified Chip */}
                <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-black aspect-video sm:aspect-[16/9] flex items-center justify-center shadow-lg group">
                  <img
                    src={previewUrl}
                    alt="Live Anomaly Capture"
                    className="w-full h-full object-cover"
                  />

                  {/* Anomaly Score Chip */}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-cyan/40 text-cyan text-xs font-mono font-bold flex items-center gap-1.5 shadow-md">
                    <Sparkles className="w-3.5 h-3.5 text-cyan animate-pulse" />
                    <span>Anomaly Detected • {anomalyRating}%</span>
                  </div>

                  {/* Retake Floating Button */}
                  <button
                    type="button"
                    id="retake-live-btn"
                    onClick={handleRetakeLive}
                    className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <RefreshCw className="w-3 h-3 text-zinc-300" />
                    <span>Retake Live</span>
                  </button>
                </div>

                {/* Fast Observation Notes / Caption Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      Observation Notes
                    </label>
                    <span className="text-[10px] font-mono text-zinc-400">{caption.length}/280</span>
                  </div>
                  <input
                    type="text"
                    id="live-post-caption-input"
                    maxLength={280}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Describe the optical anomaly or glitch you spotted live..."
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan transition-all"
                  />

                  {/* Quick Vibe Emojis */}
                  <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto pb-1 scrollbar-none">
                    <span className="text-[10px] text-zinc-500 font-mono shrink-0 mr-1">Vibe:</span>
                    {VIBE_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setCaption((prev) => (prev ? `${prev} ${emoji}` : emoji))}
                        className="p-1 text-xs rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Anomaly Category Pills */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Category</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {(["Objects", "Nature", "Human-Made", "Animals", "Coincidences", "Food"] as Category[]).map(
                      (cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-medium transition-all cursor-pointer ${
                            category === cat
                              ? "bg-cyan text-zinc-950 font-bold shadow-sm border border-cyan"
                              : "bg-zinc-100 dark:bg-zinc-950/70 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-800"
                          }`}
                        >
                          {cat}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* 1-Tap Post Action Bar */}
                <div className="pt-2.5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={handleRetakeLive}
                    className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retake</span>
                  </button>

                  <button
                    type="button"
                    id="quick-post-live-btn"
                    onClick={handleSubmit}
                    disabled={uploading}
                    className="flex-1 py-2.5 px-6 rounded-xl bg-gradient-to-r from-cyan via-violet to-purple-600 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-violet/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Publishing Live Anomaly...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Post Anomaly Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: FILE UPLOAD STUDIO                                                 */}
        {/* ========================================================================= */}
        {activeTab === "upload" && (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            <div className="space-y-4 overflow-y-auto pr-1 py-1 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800 flex-1 min-h-0">
              {/* DROPZONE / PREVIEW */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>Photograph Selection</span>
                  {previewUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setPreviewUrl(null);
                      }}
                      className="text-[11px] text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      Clear photo
                    </button>
                  )}
                </label>

                {previewUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 max-h-64 flex items-center justify-center group">
                    <img
                      src={previewUrl}
                      alt="Anomaly Preview"
                      className="w-full max-h-64 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-white text-xs font-semibold border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-violet" />
                        Change File
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    id="open-file-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-950/70 border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-cyan/60 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/50 transition-all flex flex-col items-center justify-center text-center cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center text-cyan group-hover:scale-110 transition-transform mb-3">
                      <Upload className="w-7 h-7" />
                    </div>
                    <span className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-cyan transition-colors">
                      Select Anomaly File
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      JPEG, PNG, WebP up to 15MB
                    </span>
                  </div>
                )}
              </div>

              {/* CAPTION & QUICK EMOJIS */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Anomaly Notes & Caption
                  </label>
                  <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                    {caption.length}/280
                  </span>
                </div>
                <textarea
                  id="create-post-caption-input"
                  rows={2}
                  maxLength={280}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Describe the visual anomaly or optical glitch..."
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet transition-all resize-none"
                />

                {/* Vibe Emoji Quick Bar */}
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono shrink-0 mr-1">
                    Vibe:
                  </span>
                  {VIBE_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setCaption((prev) => (prev ? `${prev} ${emoji}` : emoji))}
                      className="p-1 text-xs rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* CATEGORY SELECTOR */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Anomaly Classification
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {(["Objects", "Nature", "Human-Made", "Animals", "Coincidences", "Food"] as Category[]).map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-medium transition-all cursor-pointer ${
                          category === cat
                            ? "bg-violet text-white font-semibold shadow-sm border border-violet/50"
                            : "bg-zinc-100 dark:bg-zinc-950/70 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-800"
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
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                      >
                        +2 Hours
                      </button>
                      <button
                        type="button"
                        onClick={() => applySchedulePreset("tomorrow-am")}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                      >
                        Tomorrow 9:00 AM
                      </button>
                      <button
                        type="button"
                        onClick={() => applySchedulePreset("tomorrow-pm")}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                      >
                        Tomorrow 8:00 PM
                      </button>
                      <button
                        type="button"
                        onClick={() => applySchedulePreset("friday")}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                      >
                        Friday Peak
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ACTION FOOTER FOR FILE STUDIO */}
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
                onClick={() => setActiveTab("upload")}
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
                  setActiveTab("upload");
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
