export default function GlobalLoading() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-6 space-y-6 animate-pulse">
      {/* Story bar skeleton */}
      <div className="flex gap-4 overflow-hidden pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="w-12 h-2.5 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>

      {/* Post skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        >
          {/* Post header */}
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex-1 space-y-2">
              <div className="w-28 h-3.5 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="w-20 h-2.5 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="w-6 h-6 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>

          {/* Post image */}
          <div className="w-full aspect-square bg-zinc-200 dark:bg-zinc-800" />

          {/* Post actions */}
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-7 h-7 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="w-7 h-7 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="w-7 h-7 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="w-20 h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="space-y-1.5">
              <div className="w-full h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="w-3/4 h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
