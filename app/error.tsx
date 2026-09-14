"use client";

import { useEffect } from "react";
import Link from "next/link";


export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for monitoring (extend with Sentry/LogRocket later)
    console.error("[WICA Error Boundary]", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Error Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        {/* Heading */}
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            An unexpected error occurred. Our team has been notified. You can try
            again or return to the feed.
          </p>
        </div>

        {/* Error Details (dev only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-3 text-left">
            <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-zinc-400 mt-1">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium text-sm transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium text-sm transition-colors"
          >
            Back to Feed
          </Link>

        </div>
      </div>
    </div>
  );
}
