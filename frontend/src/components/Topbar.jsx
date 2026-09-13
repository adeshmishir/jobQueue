import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu, Plus } from "lucide-react";
import { useJobs } from "../context/JobsContext";
import { cn } from "../lib/format";

const TITLES = {
  "/": "Dashboard",
  "/jobs": "Jobs",
  "/workers": "Workers",
  "/analytics": "Analytics",
};

function statusPill(text, tone, pulse) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        tone
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", pulse && "animate-pulse")} />
      {text}
    </span>
  );
}

function SystemStatus() {
  const { health, apiError } = useJobs();

  if (apiError) {
    return statusPill(
      "API Unavailable",
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
      false
    );
  }
  if (!health) {
    return statusPill(
      "Checking…",
      "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
      true
    );
  }
  if (health.status === "ok") {
    return statusPill(
      "System Operational",
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
      true
    );
  }
  return statusPill(
    "System Degraded",
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
    true
  );
}

export default function Topbar({ onMenu, onCreate }) {
  const { pathname } = useLocation();
  const [title, setTitle] = useState("Dashboard");

  useEffect(() => {
    if (pathname.startsWith("/jobs/")) setTitle("Job Details");
    else setTitle(TITLES[pathname] || "JobQueue");
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 dark:border-slate-800 dark:bg-slate-900/90">
      <button
        onClick={onMenu}
        className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <h1 className="text-base font-semibold text-slate-900 dark:text-white">
        {title}
      </h1>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <SystemStatus />

        <button
          onClick={onCreate}
          className="hidden items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 sm:inline-flex"
        >
          <Plus size={16} />
          Create Job
        </button>

        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
          AM
        </span>
      </div>
    </header>
  );
}