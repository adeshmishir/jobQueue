import { cn } from "../lib/format";

export default function JobProgress({ status }) {
  if (status === "COMPLETED") {
    return (
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-500/15">
        <div className="h-full w-full rounded-full bg-emerald-500" />
      </div>
    );
  }

  if (status === "FAILED") {
    return (
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-rose-100 dark:bg-rose-500/15">
        <div className="h-full w-full rounded-full bg-rose-500" />
      </div>
    );
  }

  if (status === "PROCESSING") {
    return (
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full w-full origin-left animate-[progress-sweep_1.4s_ease-in-out_infinite] rounded-full bg-sky-500 [animation-timing-function:cubic-bezier(.65,.815,.735,.395)]" />
      </div>
    );
  }

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-amber-100 dark:bg-amber-500/15">
      <div className="h-full w-[12%] rounded-full bg-amber-400" />
    </div>
  );
}

export function ProgressLabel({ status }) {
  if (status === "COMPLETED") return <span className="text-xs text-emerald-600 dark:text-emerald-400">Done</span>;
  if (status === "FAILED") return <span className="text-xs text-rose-600 dark:text-rose-400">Failed</span>;
  if (status === "PROCESSING") return <span className="text-xs text-sky-600 dark:text-sky-400">Processing…</span>;
  return <span className="text-xs text-amber-600 dark:text-amber-400">Waiting in queue</span>;
}