import { STATUS_META, cn } from "../lib/format";

export default function JobStatusBadge({ status, size = "sm", pulse = false }) {
  const meta = STATUS_META[status] || STATUS_META.PENDING;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full font-medium",
        meta.badge,
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot, pulse && "animate-pulse")} />
      {meta.label}
    </span>
  );
}