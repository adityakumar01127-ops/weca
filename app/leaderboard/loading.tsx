export default function LeaderboardLoading() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      {/* Title & Filter Tabs */}
      <div className="text-center space-y-3">
        <div className="h-8 w-56 rounded bg-zinc-200 dark:bg-zinc-800 mx-auto" />
        <div className="h-4 w-72 rounded bg-zinc-200 dark:bg-zinc-800 mx-auto" />
      </div>

      <div className="flex justify-center gap-3">
        <div className="h-9 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-9 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-9 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Top 3 Podium Skeleton */}
      <div className="grid grid-cols-3 gap-3 items-end pt-4 pb-2">
        <div className="h-32 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-44 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-28 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Leaderboard list items */}
      <div className="space-y-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
          >
            <div className="w-6 h-4 rounded bg-zinc-200 dark:bg-zinc-800 shrink-0" />
            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="h-6 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
