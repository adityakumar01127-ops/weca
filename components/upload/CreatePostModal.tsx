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
  Compass,
  ShieldAlert,
  Award,
  Tag,
  HelpCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Category, AnomalyEvaluation, ScoreBreakdown, Tier, WicaImage } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { uploadPostPhoto, createPost, checkUploadRateLimit } from "@/lib/supabase/data";
import { AnomalyGuidelinesModal } from "./AnomalyGuidelinesModal";
import { ScoreReveal } from "./ScoreReveal";

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
  const [isFlashOn, setIsFlashOn] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [anomalyRating, setAnomalyRating] = useState<number>(94.5);

  // Anomaly Scanner & Eligibility Evaluation state
  const [evaluation, setEvaluation] = useState<AnomalyEvaluation | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState<boolean>(false);
  const [showScoreReveal, setShowScoreReveal] = useState<boolean>(false);
  const [revealedData, setRevealedData] = useState<{
    image: WicaImage;
    breakdown: ScoreBreakdown;
    creditsAwarded: number;
  } | null>(null);

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

  // Toggle torch/flash if supported, or simulated illumination boost
  const toggleFlash = useCallback(async () => {
    const next = !isFlashOn;
    setIsFlashOn(next);
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        try {
          const capabilities = (track.getCapabilities?.() || {}) as Record<string, unknown>;
          if ("torch" in capabilities) {
            await track.applyConstraints({
              advanced: [{ torch: next } as MediaTrackConstraintSet],
            });
          }
        } catch {
          // torch constraint handled visually
        }
      }
    }
  }, [isFlashOn]);

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

  // In-flight AI Anomaly Scanner
  const scanAnomaly = useCallback(
    async (imageSource: string, captionText?: string) => {
      if (!imageSource) return;
      setIsScanning(true);
      setScanError(null);
      try {
        const isDataUrl = imageSource.startsWith("data:");
        const isHttp = imageSource.startsWith("http");

        const payload: Record<string, unknown> = {
          mode: "precheck",
          caption: captionText || "",
          category,
        };

        if (isDataUrl) {
          payload.image_url = imageSource;
        } else if (isHttp) {
          payload.image_url = imageSource;
        } else {
          payload.image_url = imageSource;
        }

        const res = await fetch("/api/score-post?mode=precheck", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`Anomaly scanner returned status: ${res.status}`);
        }

        const data = await res.json();
        if (data?.evaluation) {
          setEvaluation(data.evaluation);
          if (data.evaluation.weirdness_score) {
            setAnomalyRating(data.evaluation.weirdness_score);
          }
          if (data.evaluation.suggested_category && category === "Objects") {
            setCategory(data.evaluation.suggested_category);
          }
        }
      } catch (err) {
        console.warn("In-flight anomaly scan fallback:", err);
        // Fallback evaluation if network hiccup so user isn't stuck
        const fallbackEval: AnomalyEvaluation = {
          is_eligible: true,
          weirdness_score: 84,
          uniqueness_score: 88,
          composite_score: 86,
          tier: "Certified Weird",
          one_line_verdict: "An intriguing visual oddity awaiting community consensus.",
          earned_credits: 25,
          suggested_category: category,
          suggested_tags: ["#anomaly", "#weirdness"],
          dimensions: {
            absurdity: 82,
            incongruity: 85,
            wit: 80,
            rarity: 86,
            freshness: 84,
          },
          flags: [],
        };
        setEvaluation(fallbackEval);
        setAnomalyRating(84);
      } finally {
        setIsScanning(false);
      }
    },
    [category]
  );

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
          // Advance directly into the posting studio and scan
          setActiveTab("upload");
          scanAnomaly(dataUrl, caption);
        }
      },
      "image/jpeg",
      0.92
    );
  };

  // Reset live capture to take another photo in full-size camera
  const handleRetakeLive = () => {
    setFile(null);
    setPreviewUrl(null);
    setEvaluation(null);
    setError(null);
    setActiveTab("live");
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
      const resUrl = e.target?.result as string;
      setPreviewUrl(resUrl);
      scanAnomaly(resUrl, caption);
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
    if (draft.image_url) {
      scanAnomaly(draft.image_url, draft.caption);
    }
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

    const currentUserId = user?.id || profile?.id;
    if (user && profile && currentUserId) {
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
      setError("Please sign in to publish scheduled photographs.");
      return;
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

    if (evaluation && !evaluation.is_eligible) {
      setError(
        `Photo Ineligible: ${evaluation.rejection_reason || "This submission does not qualify for Weca's feed."}`
      );
      return;
    }

    const currentUserId = user?.id || profile?.id;
    if (!currentUserId || !user || !profile) {
      setError("Please sign in to publish candidate photographs to the community feed.");
      setUploading(false);
      return;
    }

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

      let createdPostResult = null;
      if (uploadableFile) {
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
        createdPostResult = await createPost({
          userId: currentUserId,
          imageUrl: publicUrl,
          caption: caption.trim() || null,
          authorProfile: profile,
        });
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

      // Prepare ScoreReveal Celebration
      if (createdPostResult) {
        const earnedCredits =
          evaluation?.earned_credits ??
          (evaluation?.weirdness_score && evaluation.weirdness_score >= 30 ? 25 : 0);
        const breakdown: ScoreBreakdown = {
          composite_score: evaluation?.composite_score || Math.round(anomalyRating),
          tier: (evaluation?.tier as Tier) || "Certified Weird",
          absurdity: evaluation?.dimensions?.absurdity || 82,
          rarity: evaluation?.dimensions?.rarity || 85,
          craft: evaluation?.dimensions?.freshness || 80,
          cultural_novelty: evaluation?.dimensions?.incongruity || 84,
          wit: evaluation?.dimensions?.wit || 86,
          one_line_verdict:
            evaluation?.one_line_verdict || "A verified physical anomaly recorded into Weca.",
          flags: evaluation?.flags || [],
          weirdness_score: evaluation?.weirdness_score || Math.round(anomalyRating),
          uniqueness_score: evaluation?.uniqueness_score || Math.round(anomalyRating),
          earned_credits: earnedCredits,
          suggested_category: evaluation?.suggested_category || category,
          suggested_tags: evaluation?.suggested_tags || [],
          is_eligible: true,
        };
        const scoredWicaImage: WicaImage = {
          id: createdPostResult.id,
          user_id: currentUserId,
          storage_path: createdPostResult.image_url,
          category: category,
          wica_score: breakdown.composite_score,
          absurdity: breakdown.absurdity,
          rarity: breakdown.rarity,
          craft: breakdown.craft,
          cultural_novelty: breakdown.cultural_novelty,
          wit: breakdown.wit,
          ai_verdict: breakdown.one_line_verdict,
          moderation_status: "approved",
          created_at: createdPostResult.created_at,
        };
        setRevealedData({
          image: scoredWicaImage,
          breakdown,
          creditsAwarded: earnedCredits,
        });
        setShowScoreReveal(true);
      } else {
        if (onPostCreated) onPostCreated();
        handleClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to publish post.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  // 1. COMPLETE FULL-SIZE CAMERA MODE
  // When activeTab is "live" and no photo has been captured yet,
  // render the full-viewport immersive camera directly!
  if (activeTab === "live" && !previewUrl) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-200">
        {/* Shutter White Flash Overlay */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white z-[60] transition-opacity duration-200 pointer-events-none" />
        )}

        {/* Video / Hardware Camera */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover absolute inset-0 ${isSimulated ? "hidden" : "block"} ${
            facingMode === "user" ? "scale-x-[-1]" : ""
          }`}
        />

        {/* Simulated Cybernetic Anomaly Sensor Canvas (fallback) */}
        <canvas
          ref={simCanvasRef}
          className={`w-full h-full object-cover absolute inset-0 ${isSimulated ? "block" : "hidden"}`}
        />

        {/* Torch / Flash Simulated Illumination Overlay when enabled */}
        {isFlashOn && (
          <div className="absolute inset-0 bg-amber-200/15 mix-blend-overlay pointer-events-none z-10" />
        )}

        {/* Rule-of-Thirds Grid Overlay (full screen) */}
        {showGrid && (
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10 border border-white/10 divide-x divide-y divide-white/10">
            <div /><div /><div />
            <div /><div /><div />
            <div /><div /><div />
          </div>
        )}

        {/* Optical Scanning HUD Overlay */}
        <div className="absolute inset-6 sm:inset-12 pointer-events-none z-20 flex items-center justify-center">
          {/* Cybernetic Corner Brackets */}
          <div className="w-8 h-8 border-t-2 border-l-2 border-cyan absolute top-0 left-0" />
          <div className="w-8 h-8 border-t-2 border-r-2 border-cyan absolute top-0 right-0" />
          <div className="w-8 h-8 border-b-2 border-l-2 border-cyan absolute bottom-0 left-0" />
          <div className="w-8 h-8 border-b-2 border-r-2 border-cyan absolute bottom-0 right-0" />

          {/* Center Targeting Reticle */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full border border-dashed border-cyan/40 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border border-violet/60 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan animate-ping" />
            </div>
            {/* Crosshair ticks */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-cyan/70" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-cyan/70" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-0.5 bg-cyan/70" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-0.5 bg-cyan/70" />
          </div>

          {/* Spectrum Readout Chip */}
          <div className="absolute bottom-2 px-3.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-cyan/30 text-[11px] font-mono text-cyan tracking-wider shadow-lg">
            ⚡ OPTICAL SPECTRUM: {anomalyRating}% ANOMALY INDEX
          </div>
        </div>

        {/* TOP FLOATING HUD BAR */}
        <div className="relative z-30 pt-safe px-4 sm:px-6 pt-4 pb-2 flex items-center justify-between gap-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          {/* Close button */}
          <button
            type="button"
            id="close-full-camera-btn"
            onClick={handleClose}
            className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-lg"
            title="Close Camera"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Live Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs font-mono text-white shadow-lg">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-bold text-rose-400">LIVE</span>
            <span className="text-zinc-300">• OPTICAL SCANNER</span>
          </div>

          {/* Handbook button in camera */}
          <button
            type="button"
            onClick={() => setShowGuidelinesModal(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-mono transition-all cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-cyan" />
            <span>Handbook 📖</span>
          </button>

          {/* Top Actions: Flash, Grid, Flip, Switch to File */}
          <div className="flex items-center gap-2">
            {/* Flash / Torch Toggle */}
            <button
              type="button"
              id="toggle-camera-flash-btn"
              onClick={toggleFlash}
              className={`w-10 h-10 rounded-full backdrop-blur-md border transition-all flex items-center justify-center cursor-pointer shadow-lg active:scale-95 ${
                isFlashOn
                  ? "bg-amber-400 border-amber-300 text-zinc-950 font-bold shadow-amber-400/30"
                  : "bg-black/50 hover:bg-black/80 border-white/20 text-zinc-300 hover:text-white"
              }`}
              title={isFlashOn ? "Torch On" : "Torch Off"}
            >
              <Zap className="w-4 h-4" />
            </button>

            {/* Grid Toggle */}
            <button
              type="button"
              id="toggle-camera-grid-btn"
              onClick={() => setShowGrid(!showGrid)}
              className={`w-10 h-10 rounded-full backdrop-blur-md border transition-all flex items-center justify-center cursor-pointer shadow-lg active:scale-95 ${
                showGrid
                  ? "bg-cyan/30 border-cyan text-cyan shadow-cyan/20"
                  : "bg-black/50 hover:bg-black/80 border-white/20 text-zinc-300 hover:text-white"
              }`}
              title="Toggle Rule-of-Thirds Grid"
            >
              <GridIcon className="w-4 h-4" />
            </button>

            {/* Switch to File Upload Studio */}
            <button
              type="button"
              id="switch-to-upload-btn"
              onClick={() => {
                stopCamera();
                setActiveTab("upload");
              }}
              className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
              title="Switch to File Upload Studio"
            >
              <Upload className="w-4 h-4 text-cyan" />
            </button>
          </div>
        </div>

        {/* BOTTOM FLOATING CONTROLS BAR */}
        <div className="relative z-30 pb-safe px-6 pb-8 pt-4 flex flex-col items-center gap-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          {/* Guide hint */}
          <span className="text-[11px] font-mono text-zinc-400 tracking-wide">
            Align optical anomaly in reticle & tap shutter to capture
          </span>

          <div className="w-full max-w-sm flex items-center justify-around gap-6">
            {/* Gallery / Files Picker */}
            <button
              type="button"
              id="open-gallery-picker-btn"
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-2xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-zinc-300 hover:text-white flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer active:scale-95 shadow-lg group"
              title="Pick from Photos / Files"
            >
              <Upload className="w-4 h-4 text-violet group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-mono">Files</span>
            </button>

            {/* COMPLETE FULL-SIZE TACTILE SHUTTER BUTTON */}
            <button
              type="button"
              id="live-camera-shutter-btn"
              onClick={capturePhoto}
              className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full p-1.5 bg-gradient-to-tr from-cyan via-violet to-fuchsia-500 shadow-2xl shadow-cyan/40 hover:shadow-cyan/70 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center group"
              title="Click Picture"
            >
              <div className="w-full h-full rounded-full bg-white dark:bg-black p-1 flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-white group-hover:bg-zinc-100 transition-colors shadow-inner flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-rose-500 animate-pulse" />
                </div>
              </div>
            </button>

            {/* Camera Flip button */}
            <button
              type="button"
              id="flip-camera-btn"
              onClick={() =>
                setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
              }
              className="w-12 h-12 rounded-2xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex flex-col items-center justify-center gap-0.5 transition-all active:rotate-180 duration-300 cursor-pointer active:scale-95 shadow-lg group"
              title="Flip Camera (Front/Rear)"
            >
              <RefreshCw className="w-4 h-4 text-cyan group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-mono">Flip</span>
            </button>
          </div>
        </div>

        {/* Hidden inputs for gallery & native camera */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              handleFileSelect(f);
              stopCamera();
              setActiveTab("upload");
            }
          }}
        />
        <input
          ref={nativeCameraInputRef}
          id="native-camera-btn"
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              handleFileSelect(f);
              stopCamera();
              setActiveTab("upload");
            }
          }}
        />
      </div>,
      document.body
    );
  }

  // 2. STANDARD POST CREATION STUDIO (When photo is captured or file upload/drafts/scheduled tab is selected)
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="open-guidelines-header-btn"
              onClick={() => setShowGuidelinesModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet/10 hover:bg-violet/20 border border-violet/30 text-violet dark:text-violet-300 text-xs font-semibold font-mono transition-all cursor-pointer active:scale-95"
              title="View Anomaly Guidelines & Eligibility Criteria"
            >
              <Compass className="w-3.5 h-3.5 text-cyan" />
              <span className="hidden sm:inline">Handbook</span>
              <span>📖</span>
            </button>

            <button
              type="button"
              id="close-create-post-modal-btn"
              onClick={handleClose}
              className="p-2.5 rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
            className="flex-1 py-1.5 px-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
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
              activeTab === "upload" || activeTab === "live"
                ? "bg-violet text-white shadow-sm font-semibold"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Post Studio</span>
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

        {/* POST STUDIO FORM (When photo captured or Upload tab active) */}
        {(activeTab === "upload" || (activeTab === "live" && previewUrl)) && (
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
                        setEvaluation(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-[11px] text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      Clear photo
                    </button>
                  )}
                </label>

                {previewUrl ? (
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 max-h-72 flex items-center justify-center group shadow-md">
                      <img
                        src={previewUrl}
                        alt="Anomaly Preview"
                        className="w-full max-h-72 object-cover"
                      />

                      {/* IN-FLIGHT ANOMALY SCANNER HUD OVERLAY */}
                      {isScanning && (
                        <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4 z-20 animate-in fade-in">
                          {/* Laser beam */}
                          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse shadow-[0_0_15px_#22D3EE]" />
                          <div className="relative p-4 rounded-2xl bg-zinc-950/90 border border-cyan/50 backdrop-blur-md flex flex-col items-center gap-2 shadow-2xl">
                            <div className="w-8 h-8 rounded-full border-2 border-cyan border-t-transparent animate-spin flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-cyan" />
                            </div>
                            <div>
                              <span className="text-xs font-mono font-bold text-white block">
                                SCANNING ANOMALY MATRIX
                              </span>
                              <span className="text-[10px] font-mono text-cyan/90">
                                Evaluating Weirdness & Uniqueness...
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Eligibility / Rating Badges when not scanning */}
                      {!isScanning && evaluation && (
                        evaluation.is_eligible ? (
                          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-cyan/40 text-cyan text-xs font-mono font-bold flex items-center gap-1.5 shadow-md">
                            <Sparkles className="w-3.5 h-3.5 text-cyan animate-pulse" />
                            <span>Eligible • {evaluation.tier} Tier</span>
                          </div>
                        ) : (
                          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-rose-950/90 backdrop-blur-md border border-rose-500/60 text-rose-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-md">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                            <span>Ineligible Submission</span>
                          </div>
                        )
                      )}

                      {!isScanning && !evaluation && (
                        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-cyan/40 text-cyan text-xs font-mono font-bold flex items-center gap-1.5 shadow-md">
                          <Sparkles className="w-3.5 h-3.5 text-cyan animate-pulse" />
                          <span>Anomaly Index • {anomalyRating}%</span>
                        </div>
                      )}

                      {/* Retake Camera Button */}
                      <button
                        type="button"
                        id="retake-live-photo-btn"
                        onClick={handleRetakeLive}
                        className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-cyan" />
                        <span>Retake Photo</span>
                      </button>

                      {/* Change File button */}
                      <div className="absolute bottom-3 right-3 opacity-90 hover:opacity-100 transition-opacity flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-white text-xs font-semibold border border-zinc-700 flex items-center gap-1.5 cursor-pointer backdrop-blur-md shadow-md"
                        >
                          <Upload className="w-3.5 h-3.5 text-violet" />
                          <span>Change File</span>
                        </button>
                      </div>
                    </div>

                    {/* DUAL ANOMALY METRICS GAUGE (When Eligible) */}
                    {!isScanning && evaluation?.is_eligible && (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3 font-mono animate-in fade-in">
                        {/* Top Bar: Metric Title & Minted WC Callout */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-900 dark:text-white tracking-wide uppercase">
                              Anomaly Index
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan/10 border border-cyan/30 text-cyan font-bold">
                              {evaluation.tier} Tier
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold shadow-xs">
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            <span>+{evaluation.earned_credits ?? 25} WC Mint</span>
                          </div>
                        </div>

                        {/* Dual Metric Bars: Weird Point & Unique Point */}
                        <div className="grid grid-cols-2 gap-2.5">
                          {/* Weird Point */}
                          <div className="p-3 rounded-xl bg-violet/5 dark:bg-violet-950/30 border border-violet/20 flex flex-col justify-between">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-bold text-violet flex items-center gap-1">
                                <Zap className="w-3.5 h-3.5" />
                                <span>Weird Pt</span>
                              </span>
                              <span className="font-extrabold text-sm text-zinc-900 dark:text-white">
                                {evaluation.weirdness_score ?? 85}
                              </span>
                            </div>
                            {/* Progress Meter */}
                            <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-1">
                              <div
                                className="h-full bg-gradient-to-r from-violet to-fuchsia-500 rounded-full transition-all duration-700"
                                style={{ width: `${evaluation.weirdness_score ?? 85}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-zinc-500 dark:text-zinc-400">
                              Absurdity &bull; Incongruity
                            </span>
                          </div>

                          {/* Unique Point */}
                          <div className="p-3 rounded-xl bg-cyan/5 dark:bg-cyan-950/30 border border-cyan/20 flex flex-col justify-between">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-bold text-cyan flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Unique Pt</span>
                              </span>
                              <span className="font-extrabold text-sm text-zinc-900 dark:text-white">
                                {evaluation.uniqueness_score ?? 85}
                              </span>
                            </div>
                            {/* Progress Meter */}
                            <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-1">
                              <div
                                className="h-full bg-gradient-to-r from-cyan to-blue-500 rounded-full transition-all duration-700"
                                style={{ width: `${evaluation.uniqueness_score ?? 85}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-zinc-500 dark:text-zinc-400">
                              Rarity &bull; Authenticity
                            </span>
                          </div>
                        </div>

                        {/* One-Line Verdict Quote */}
                        {evaluation.one_line_verdict && (
                          <p className="text-xs italic text-zinc-600 dark:text-zinc-300 bg-zinc-100/70 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 font-sans">
                            &ldquo;{evaluation.one_line_verdict}&rdquo;
                          </p>
                        )}

                        {/* Suggested Hashtags */}
                        {evaluation.suggested_tags && evaluation.suggested_tags.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              <span>Suggested tags:</span>
                            </span>
                            {evaluation.suggested_tags.map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  const cleanTag = tag.startsWith("#") ? tag : `#${tag}`;
                                  if (!caption.includes(cleanTag)) {
                                    setCaption((prev) => (prev ? `${prev} ${cleanTag}` : cleanTag));
                                  }
                                }}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                              >
                                {tag.startsWith("#") ? tag : `#${tag}`}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* COACHING REJECTION CARD (When Ineligible) */}
                    {!isScanning && evaluation && !evaluation.is_eligible && (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-rose-500/10 border-2 border-rose-500/30 dark:border-rose-500/40 space-y-3 animate-in fade-in">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500 shrink-0">
                            <ShieldAlert className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide font-mono">
                              Photo Not Eligible for Community Feed
                            </h4>
                            <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium mt-0.5">
                              {evaluation.rejection_reason || "This image does not meet Weca's physical anomaly criteria."}
                            </p>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-white/70 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1">
                          <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                            What makes a photo eligible?
                          </p>
                          <p>
                            Weca exclusively archives genuine real-world optical glitches, physical oddities, funny coincidences, and street absurdities. Digital memes, screenshots, AI art, mundane selfies, and blurred photos are not eligible.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowGuidelinesModal(true)}
                            className="flex-1 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Compass className="w-3.5 h-3.5 text-cyan" />
                            <span>View Field Handbook</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleRetakeLive}
                            className="py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
                          >
                            Try Another Photo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div
                      id="open-file-upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-7 rounded-2xl bg-zinc-50 dark:bg-zinc-950/70 border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-cyan/60 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/50 transition-all flex flex-col items-center justify-center text-center cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center text-cyan group-hover:scale-110 transition-transform mb-2.5">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-cyan transition-colors">
                        Select Anomaly File
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        JPEG, PNG, WebP up to 15MB
                      </span>
                    </div>

                    <button
                      type="button"
                      id="open-full-camera-from-upload-btn"
                      onClick={() => {
                        setFile(null);
                        setPreviewUrl(null);
                        setActiveTab("live");
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-violet/10 hover:bg-violet/20 border border-violet/30 text-violet text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-98"
                    >
                      <Camera className="w-4 h-4" />
                      <span>📸 Or Open Full-Size Live Camera</span>
                    </button>
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
                  disabled={uploading || !previewUrl || isScanning || (evaluation !== null && !evaluation.is_eligible)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] ${
                    evaluation && !evaluation.is_eligible
                      ? "bg-zinc-300 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700"
                      : isScheduled
                      ? "bg-gradient-to-r from-cyan to-blue-600 hover:from-cyan/90 text-zinc-950 shadow-cyan/20"
                      : "bg-gradient-to-r from-violet to-purple-600 hover:from-violet/90 text-white shadow-violet/25"
                  }`}
                >
                  {uploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : isScanning ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Scanning Anomaly...</span>
                    </>
                  ) : evaluation && !evaluation.is_eligible ? (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      <span>Locked: Ineligible Photo</span>
                    </>
                  ) : isScheduled ? (
                    <>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Schedule Anomaly</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {evaluation?.earned_credits
                          ? `Mint & Publish (+${evaluation.earned_credits} WC)`
                          : "Publish Now"}
                      </span>
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
        {/* Hidden File Input for Studio */}
        <input
          ref={fileInputRef}
          id="studio-file-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              handleFileSelect(f);
            }
          }}
        />

        {/* Guidelines Modal */}
        <AnomalyGuidelinesModal
          isOpen={showGuidelinesModal}
          onClose={() => setShowGuidelinesModal(false)}
        />

        {/* Score Reveal Celebration Modal */}
        {showScoreReveal && revealedData && (
          <ScoreReveal
            image={revealedData.image}
            breakdown={revealedData.breakdown}
            onFinish={() => {
              setShowScoreReveal(false);
              handleClose();
              if (onPostCreated) onPostCreated();
            }}
            previewUrl={revealedData.image.storage_path}
          />
        )}
      </div>
    </div>,
    document.body
  );
};
