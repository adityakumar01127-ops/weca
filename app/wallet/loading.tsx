export default function WalletLoading() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      {/* Wallet Balance Hero Card */}
      <div className="p-8 rounded-3xl bg-zinc-200 dark:bg-zinc-800 space-y-4">
        <div className="h-4 w-32 rounded bg-zinc-300 dark:bg-zinc-700" />
        <div className="h-12 w-48 rounded bg-zinc-300 dark:bg-zinc-700" />
        <div className="flex gap-4 pt-4">
          <div className="h-11 w-32 rounded-xl bg-zinc-300 dark:bg-zinc-700" />
          <div className="h-11 w-32 rounded-xl bg-zinc-300 dark:bg-zinc-700" />
        </div>
      </div>

      {/* Transaction History Skeleton */}
      <div className="space-y-3 pt-4">
        <div className="h-6 w-44 rounded bg-zinc-200 dark:bg-zinc-800" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="space-y-1.5">
                <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
            <div className="h-5 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
