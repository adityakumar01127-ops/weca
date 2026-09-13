export default function MessagesLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 animate-pulse">
      <div className="flex h-[75vh] rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Left Sidebar List */}
        <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 p-4 space-y-4">
          <div className="h-6 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-9 w-full rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                <div className="w-11 h-11 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-3 w-36 rounded bg-zinc-200 dark:bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Active Chat Pane */}
        <div className="flex-1 flex flex-col justify-between p-6">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="space-y-1.5">
              <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>

          <div className="space-y-4 flex-1 py-6">
            <div className="h-10 w-48 rounded-2xl bg-zinc-200 dark:bg-zinc-800 mr-auto" />
            <div className="h-10 w-64 rounded-2xl bg-zinc-200 dark:bg-zinc-800 ml-auto" />
            <div className="h-14 w-52 rounded-2xl bg-zinc-200 dark:bg-zinc-800 mr-auto" />
          </div>

          <div className="h-12 w-full rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}
