import {
  Cpu,
  Database,
  Zap,
  Server,
  Layers,
  GitBranch,
  Boxes,
  Activity,
  Wifi,
  XCircle,
  Timer,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useJobs } from "../context/JobsContext";
import QueuePipeline from "../components/QueuePipeline";
import ErrorState from "../components/ErrorState";
import StatCard from "../components/StatCard";
import { formatNumber, formatDuration, cn } from "../lib/format";

function ComponentRow({ icon: Icon, name, status, extra }) {
  const ok = status === "ok";
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            ok
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
          )}
        >
          <Icon size={17} />
        </span>
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">{name}</p>
          {extra && (
            <p className="text-xs text-slate-400 dark:text-slate-500">{extra}</p>
          )}
        </div>
      </div>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
          ok
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
            : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", ok ? "bg-emerald-500" : "bg-rose-500", ok && "animate-pulse")} />
        {ok ? "Connected" : "Down"}
      </span>
    </div>
  );
}

export default function Workers() {
  const { health, stats, apiError, refresh, lastUpdated } = useJobs();
  const [updatedAgo, setUpdatedAgo] = useState("");

  useEffect(() => {
    const tick = () => {
      if (!lastUpdated) return setUpdatedAgo("");
      const s = Math.max(0, Math.round((Date.now() - lastUpdated.getTime()) / 1000));
      setUpdatedAgo(s <= 1 ? "just now" : `${s}s ago`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  const worker = health?.components?.worker;
  const components = [
    { name: "Express API", icon: Server, status: health?.components?.api?.status },
    {
      name: "PostgreSQL",
      icon: Database,
      status: health?.components?.database?.status,
      extra: "Neon",
    },
    {
      name: "Redis",
      icon: Zap,
      status: health?.components?.redis?.status,
      extra: "Upstash",
    },
    {
      name: "BullMQ Worker",
      icon: Cpu,
      status: health?.components?.worker?.status,
      extra: `${worker?.name || "worker-01"} · concurrency ${worker?.concurrency ?? "—"}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Workers
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          The queue processor that executes background jobs
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2.5 text-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Updating live
          </span>
          <span className="text-slate-400 dark:text-slate-500">
            · updated {updatedAgo}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {apiError && <ErrorState compact onRetry={refresh} />}
          <button
            onClick={refresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCw size={13} />
            Refresh now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  health?.status === "ok"
                    ? "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400"
                    : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                )}
              >
                <Cpu size={20} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Queue Processor
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {worker?.name || "worker-01"}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              {health?.status === "ok" ? "Active" : "Checking"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Current active jobs
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                {worker?.active ?? 0}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Concurrency
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                {worker?.concurrency ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Processed this session
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                {formatNumber(worker?.processed ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Failed this session
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                {formatNumber(worker?.failed ?? 0)}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
            <p className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
              <GitBranch size={13} />
              Single-process architecture
            </p>
            <p className="mt-1.5">
              The Express API and BullMQ worker run inside the same Node.js
              process. This worker polls Redis and processes one job at a time
              (up to its concurrency limit). Counters above reflect only jobs
              handled since this instance started.
            </p>
          </div>
        </section>

        <section className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              System Status
            </h3>
            <div className="space-y-2.5">
              {components.map((c) => (
                <ComponentRow key={c.name} {...c} />
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3 dark:border-slate-800">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Queue name
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <Layers size={14} className="text-amber-500" />
                  jobs
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Bottleneck
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <Boxes size={14} className="text-sky-500" />
                  concurrency {worker?.concurrency ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Uptime
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <Activity size={14} className="text-emerald-500" />
                  {formatDuration(health?.uptime)}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="col-span-2 lg:col-span-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Jobs Processed"
              value={stats?.COMPLETED}
              icon={Activity}
              tone="emerald"
            />
            <StatCard
              label="Success Rate"
              value={stats ? `${stats.successRate}%` : "—"}
              icon={Wifi}
              tone="sky"
            />
            <StatCard
              label="Failed Jobs"
              value={stats?.FAILED}
              icon={XCircle}
              tone="rose"
            />
            <StatCard
              label="Avg Processing Time"
              value={stats ? formatDuration(stats.avgDurationSeconds) : "—"}
              icon={Timer}
              tone="slate"
            />
          </div>
        </div>
      </div>

      <QueuePipeline />
    </div>
  );
}