import { formatNumber } from "../lib/format";
import { cn } from "../lib/format";

const TONES = {
  slate:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400",
  sky: "bg-sky-100 text-sky-600 dark:bg-sky-400/15 dark:text-sky-400",
  emerald:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400",
  rose: "bg-rose-100 text-rose-600 dark:bg-rose-400/15 dark:text-rose-400",
};

const VALUE_TONES = {
  slate: "text-slate-900 dark:text-white",
  amber: "text-amber-600 dark:text-amber-400",
  sky: "text-sky-600 dark:text-sky-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  rose: "text-rose-600 dark:text-rose-400",
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = "slate",
  hint,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            TONES[tone]
          )}
        >
          <Icon size={18} />
        </span>
      </div>
      <p className={cn("mt-2 text-3xl font-semibold tracking-tight", VALUE_TONES[tone])}>
        {formatNumber(value)}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      )}
    </div>
  );
}