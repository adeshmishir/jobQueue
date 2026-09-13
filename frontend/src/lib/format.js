export function cn(...args) {
  return args.filter(Boolean).join(" ");
}

export function formatNumber(n) {
  return new Intl.NumberFormat("en-US").format(n ?? 0);
}

export function timeAgo(date) {
  if (!date) return "—";
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return "—";
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s} sec ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
}

export function formatClock(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatDateTime(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) {
    return "—";
  }
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s}s`;
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.round((seconds % 86400) / 3600);
  return `${d}d ${h}h`;
}

export function jobHash(id) {
  return id ? `#${id.slice(0, 5).toUpperCase()}` : "#———";
}

export const STATUS_META = {
  PENDING: {
    label: "Pending",
    dot: "bg-amber-400",
    badge:
      "bg-amber-50 text-amber-700 border border-amber-200/70 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/20",
    bar: "bg-amber-400",
  },
  PROCESSING: {
    label: "Processing",
    dot: "bg-sky-400",
    badge:
      "bg-sky-50 text-sky-700 border border-sky-200/70 dark:bg-sky-400/10 dark:text-sky-300 dark:border-sky-400/20",
    bar: "bg-sky-500",
  },
  COMPLETED: {
    label: "Completed",
    dot: "bg-emerald-400",
    badge:
      "bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-400/10 dark:text-emerald-300 dark:border-emerald-400/20",
    bar: "bg-emerald-500",
  },
  FAILED: {
    label: "Failed",
    dot: "bg-rose-400",
    badge:
      "bg-rose-50 text-rose-700 border border-rose-200/70 dark:bg-rose-400/10 dark:text-rose-300 dark:border-rose-400/20",
    bar: "bg-rose-500",
  },
};

export const JOB_TYPES = {
  "generate-pdf": { label: "Generate PDF Report" },
  default: { label: "Background Job" },
  "send-email": { label: "Send Email" },
  fail: { label: "Simulate Failure" },
};

export function typeLabel(type) {
  return JOB_TYPES[type]?.label || type || "Unknown";
}