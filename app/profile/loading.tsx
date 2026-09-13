export default function ProfileLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8 animate-pulse">
      {/* Profile Header Skeleton */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
        <div className="flex-1 space-y-4 text-center md:text-left w-full">
          <div className="space-y-2">
            <div className="h-6 w-44 rounded bg-zinc-200 dark:bg-zinc-800 mx-auto md:mx-0" />
            <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800 mx-auto md:mx-0" />
          </div>
          <div className="h-4 w-full max-w-md rounded bg-zinc-200 dark:bg-zinc-800 mx-auto md:mx-0" />
          <div className="flex justify-center md:justify-start gap-6 pt-2">
            <div className="h-8 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-8 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-8 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
      </div>

      {/* Grid Posts Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-xl bg-zinc-200 dark:bg-zinc-800"
          />
        ))}
      </div>
    </div>
  );
}
