"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  RotateCcw,
  Camera,
  Send,
  Sparkles,
  AlertCircle,
  Check,
} from "lucide-react";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptureAndSend: (photoDataUrl: string) => void;
  recipientName?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCaptureAndSend,
  recipientName,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement>(null);

  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Stop camera tracks helper
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Start webcam / device camera
  const startCamera = async (facing: "environment" | "user") => {
    stopStream();
    setIsInitializing(true);
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
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
          setIsInitializing(false);
        };
      }
    } catch (err: any) {
      console.warn("Unable to access camera directly:", err);
      setIsInitializing(false);
      setCameraError(
        "Camera stream unavailable. You can tap below to use your device's native camera."
      );
    }
  };

  useEffect(() => {
    if (isOpen && !capturedPhoto) {
      startCamera(facingMode);
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, facingMode, capturedPhoto]);

  // Click Picture
  const handleSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      if (facingMode === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      setCapturedPhoto(dataUrl);
      stopStream();
    }
  };

  // Flip Camera
  const handleToggleFlip = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
  };

  // Retake Photo
  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  // Send Captured Photo
  const handleSend = () => {
    if (!capturedPhoto || isSending) return;
    setIsSending(true);
    onCaptureAndSend(capturedPhoto);
    setTimeout(() => {
      setIsSending(false);
      setCapturedPhoto(null);
      onClose();
    }, 200);
  };

  // Fallback Native Camera File Capture
  const handleFallbackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setCapturedPhoto(dataUrl);
        stopStream();
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between text-white select-none">
      {/* Hidden Fallback Native Camera Input */}
      <input
        ref={fallbackInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFallbackFileChange}
      />

      {/* ─── Top Controls Bar ─── */}
      <div
        className="relative z-20 px-4 py-3 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent"
        style={{ paddingTop: "max(env(safe-area-inset-top, 12px), 12px)" }}
      >
        <button
          type="button"
          onClick={() => {
            stopStream();
            setCapturedPhoto(null);
            onClose();
          }}
          className="p-2 rounded-full bg-black/50 text-white/90 hover:text-white hover:bg-black/70 backdrop-blur-md transition-colors cursor-pointer"
          title="Close camera"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
          <Camera className="w-3.5 h-3.5 text-violet" />
          <span className="text-xs font-semibold tracking-tight">
            {capturedPhoto
              ? "Preview Photo"
              : recipientName
              ? `Snap for ${recipientName}`
              : "Camera"}
          </span>
        </div>

        {!capturedPhoto && !cameraError ? (
          <button
            type="button"
            onClick={handleToggleFlip}
            className="p-2 rounded-full bg-black/50 text-white/90 hover:text-white hover:bg-black/70 backdrop-blur-md transition-colors cursor-pointer"
            title="Flip camera"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-9" />
        )}
      </div>

      {/* ─── Viewfinder Area ─── */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-zinc-950">
        {capturedPhoto ? (
          /* Captured Photo Preview */
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={capturedPhoto}
              alt="Captured"
              className="w-full h-full object-contain"
            />
            <div className="absolute top-4 left-4 px-2.5 py-1 rounded-md bg-black/60 text-[11px] font-mono text-cyan backdrop-blur-md">
              PHOTO CAPTURED
            </div>
          </div>
        ) : cameraError ? (
          /* Error / Fallback View */
          <div className="px-6 text-center max-w-sm flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 text-amber-400">
              <AlertCircle className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold mb-1">Camera Stream Inactive</p>
            <p className="text-xs text-zinc-400 mb-5 leading-relaxed">{cameraError}</p>
            <button
              type="button"
              onClick={() => fallbackInputRef.current?.click()}
              className="px-5 py-2.5 rounded-full bg-violet text-white text-xs font-bold hover:bg-violet/90 transition-colors shadow-lg cursor-pointer flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>Click Photo with Native Camera</span>
            </button>
          </div>
        ) : (
          /* Live Video Stream */
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                facingMode === "user" ? "-scale-x-100" : ""
              }`}
            />

            {/* Viewfinder Target Corner Accents */}
            <div className="absolute inset-8 sm:inset-16 pointer-events-none border border-white/20 rounded-2xl">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan rounded-tl-sm" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan rounded-tr-sm" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan rounded-bl-sm" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan rounded-br-sm" />
            </div>

            {isInitializing && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-xs font-mono text-zinc-300 animate-pulse">
                  Starting camera optics...
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Bottom Actions Bar ─── */}
      <div
        className="relative z-20 px-6 py-5 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-around"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 24px), 24px)" }}
      >
        {capturedPhoto ? (
          /* Preview Actions: Retake or Send */
          <div className="w-full max-w-sm flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleRetake}
              className="flex-1 py-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-bold text-white transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake</span>
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={isSending}
              className="flex-1 py-3 rounded-full bg-gradient-to-r from-violet to-cyan text-white text-xs font-bold shadow-lg shadow-violet/30 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? "Sending..." : "Send Photo"}</span>
            </button>
          </div>
        ) : (
          /* Live Shutter Controls */
          <div className="w-full max-w-sm flex items-center justify-center relative">
            {/* Native device camera fallback trigger */}
            <button
              type="button"
              onClick={() => fallbackInputRef.current?.click()}
              className="absolute left-0 p-2 rounded-full text-zinc-400 hover:text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer"
              title="Open device camera"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Native</span>
            </button>

            {/* Shutter Button */}
            <button
              type="button"
              onClick={handleSnap}
              disabled={isInitializing || Boolean(cameraError)}
              className="w-18 h-18 rounded-full border-4 border-white p-1 flex items-center justify-center active:scale-90 transition-transform cursor-pointer disabled:opacity-40"
              title="Click photo"
            >
              <div className="w-full h-full rounded-full bg-white transition-colors hover:bg-zinc-200" />
            </button>

            {/* Right spacer to balance */}
            <div className="absolute right-0 w-8" />
          </div>
        )}
      </div>
    </div>
  );
};
