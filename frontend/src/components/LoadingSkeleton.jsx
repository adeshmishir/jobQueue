export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mt-3 h-8 w-16 rounded bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

export function RowSkeleton({ cols = 5 }) {
  return (
    <div className="animate-pulse border-b border-slate-100 px-4 py-3 dark:border-slate-800">
      <div className="flex items-center gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            className="h-4 flex-1 rounded bg-slate-200 dark:bg-slate-800"
            style={{ maxWidth: `${i === 0 ? 180 : 140}px` }}
          />
        ))}
      </div>
    </div>
  );
}

export function JobsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <RowSkeleton key={i} />
      ))}
    </div>
  );
}