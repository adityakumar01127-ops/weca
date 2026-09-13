"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, X, Share, PlusSquare, Sparkles, CheckCircle2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already in standalone PWA mode
    const isApp =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(isApp);
    if (isApp) return;

    // Check if user dismissed recently (last 7 days)
    const lastDismissed = localStorage.getItem("weca_pwa_dismissed");
    if (lastDismissed) {
      const parsedTime = parseInt(lastDismissed, 10);
      if (Date.now() - parsedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }
    setDismissed(false);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Capture Chrome/Android beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsOpen(false);
      }
    } else if (isIos) {
      setIsOpen(true);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    setDismissed(true);
    localStorage.setItem("weca_pwa_dismissed", Date.now().toString());
  };

  if (isStandalone || dismissed) {
    return null;
  }

  // Only render if we have a prompt or on iOS
  if (!deferredPrompt && !isIos) {
    return null;
  }

  return (
    <>
      {/* Floating Mini Action Pill (bottom left) */}
      {!isOpen && (
        <aside
          aria-label="Install Weca Application"
          className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-6 left-4 z-40 animate-slide-up"
        >
          <div className="flex items-center gap-2 p-1.5 pl-3 rounded-full bg-zinc-900/90 dark:bg-zinc-950/90 border border-zinc-700/60 dark:border-zinc-800 backdrop-blur-xl shadow-xl hover:border-violet/60 transition-all">
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 text-xs font-mono font-medium text-zinc-200 hover:text-white cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-violet animate-pulse" />
              <span>Install Weca App</span>
              <Download className="w-3.5 h-3.5 text-cyan" />
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-full text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label="Dismiss installation prompt"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      )}

      {/* Expanded Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 text-white shadow-2xl overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-violet/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-cyan/20 blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-5 right-5 p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800 p-2 shadow-inner flex items-center justify-center overflow-hidden">
                <Image
                  src="/icon-192.png"
                  alt="Weca App Icon"
                  width={44}
                  height={44}
                  className="rounded-xl"
                />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white">
                  Install Weca
                </h3>
                <p className="text-xs font-mono text-zinc-400">
                  Global Weirdness Index • PWA
                </p>
              </div>
            </div>

            {/* Perks */}
            <div className="space-y-2.5 mb-6 text-xs text-zinc-300 font-sans">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                <Sparkles className="w-4 h-4 text-cyan shrink-0" />
                <span>Instant camera HUD & Vision scoring with 0ms launch latency</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                <CheckCircle2 className="w-4 h-4 text-violet shrink-0" />
                <span>Offline archive & local dossier synchronization</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Full-screen standalone interface without browser chrome</span>
              </div>
            </div>

            {/* iOS specific instruction or Chrome install button */}
            {isIos ? (
              <div className="p-4 rounded-2xl bg-zinc-950 border border-violet/30 text-xs text-zinc-300 space-y-3">
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <span>How to install on iOS:</span>
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 text-cyan">
                    <Share className="w-4 h-4" />
                  </div>
                  <span>1. Tap the <strong>Share</strong> button in Safari toolbar.</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 text-violet">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <span>2. Scroll down and select <strong>Add to Home Screen</strong>.</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan to-violet text-white shadow-lg shadow-violet/20 hover:opacity-95 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Install Application</span>
                </button>
                <button
                  onClick={handleDismiss}
                  className="py-3 px-4 rounded-xl text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Maybe Later
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
