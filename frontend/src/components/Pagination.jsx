import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/format";

export default function Pagination({ page, pageCount, onPage, total }) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
      <p className="text-slate-500 dark:text-slate-400">
        {total} job{total === 1 ? "" : "s"}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="px-1 tabular-nums text-slate-600 dark:text-slate-300">
          {page} / {pageCount}
        </span>
        <button
          onClick={() => onPage(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
          className={cn(
            "rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          )}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}