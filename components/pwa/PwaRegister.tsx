"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";

export function PwaRegister() {
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            // Check for updates
            registration.addEventListener("updatefound", () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.addEventListener("statechange", () => {
                  if (
                    installingWorker.state === "installed" &&
                    navigator.serviceWorker.controller
                  ) {
                    console.log("[Weca PWA] New update ready.");
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.warn("[Weca PWA] Service worker registration failed:", error);
          });
      });
    }

    // 2. Connectivity Listeners
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  return (
    <>
      {/* Offline Banner */}
      {isOffline && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full bg-zinc-900/95 dark:bg-zinc-950/95 border border-red-500/40 text-white shadow-2xl backdrop-blur-md animate-slide-up"
        >
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping absolute" />
            <span className="w-2 h-2 rounded-full bg-red-500 relative" />
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <WifiOff className="w-3.5 h-3.5 text-red-400" />
            <span className="text-zinc-200">Radar Offline • Serving Cached Data</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Retry Connection"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </aside>
      )}

      {/* Reconnected Toast */}
      {showReconnected && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 shadow-2xl backdrop-blur-md animate-fade-in"
        >
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-mono font-medium">Radar Reconnected • Telemetry Active</span>
        </aside>
      )}
    </>
  );
}
