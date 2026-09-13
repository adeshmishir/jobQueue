import { Activity, CheckCircle2, XCircle, Timer, Info } from "lucide-react";
import { useJobs } from "../context/JobsContext";
import StatCard from "../components/StatCard";
import WeeklyChart from "../components/WeeklyChart";
import ErrorState from "../components/ErrorState";
import { CardSkeleton } from "../components/LoadingSkeleton";
import { formatNumber, formatDuration } from "../lib/format";

const STATUS_SEGMENTS = [
  { status: "PROCESSING", label: "Processing", color: "bg-sky-500" },
  { status: "PENDING", label: "Pending", color: "bg-amber-400" },
  { status: "COMPLETED", label: "Completed", color: "bg-emerald-500" },
  { status: "FAILED", label: "Failed", color: "bg-rose-500" },
];

export default function Analytics() {
  const { stats, loading, apiError, refresh } = useJobs();

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const total =
    (stats?.total ?? 0);
  const segments = STATUS_SEGMENTS.map((s) => ({
    ...s,
    count: stats?.[s.status] ?? 0,
    pct: total ? Math.round(((stats?.[s.status] ?? 0) / total) * 100) : 0,
  }));
  const active =
    (stats?.PENDING ?? 0) + (stats?.PROCESSING ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Analytics
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Real metrics computed from the jobs stored in PostgreSQL
        </p>
      </div>

      {apiError && <ErrorState compact onRetry={refresh} />}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Jobs Processed"
          value={stats?.COMPLETED}
          icon={CheckCircle2}
          tone="emerald"
          hint="Total completed"
        />
        <StatCard
          label="Success Rate"
          value={stats ? `${stats.successRate}%` : "0%"}
          icon={Activity}
          tone="sky"
          hint="Completed ÷ finished"
        />
        <StatCard
          label="Failed Jobs"
          value={stats?.FAILED}
          icon={XCircle}
          tone="rose"
          hint="Permanently failed"
        />
        <StatCard
          label="Avg Processing Time"
          value={stats ? formatDuration(stats.avgDurationSeconds) : "—"}
          icon={Timer}
          tone="slate"
          hint="From queued to finished"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Jobs processed per day
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Last 7 days · emerald = completed, rose = failed
            </p>
          </div>
          <WeeklyChart data={stats?.last7Days} />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
            Current queue state
          </h3>
          <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="flex h-full w-full">
              {segments.map((s) =>
                s.pct > 0 ? (
                  <div
                    key={s.status}
                    className={s.color}
                    style={{ width: `${s.pct}%` }}
                    title={`${s.label}: ${s.count}`}
                  />
                ) : null
              )}
            </div>
          </div>
          <div className="space-y-2.5">
            {segments.map((s) => (
              <div key={s.status} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                  {s.label}
                </span>
                <span className="font-medium tabular-nums text-slate-900 dark:text-white">
                  {formatNumber(s.count)}
                  <span className="ml-1.5 text-xs text-slate-400">({s.pct}%)</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-3 flex items-center gap-1.5 text-base font-semibold text-slate-900 dark:text-white">
            <Info size={15} className="text-slate-400" />
            How these numbers are computed
          </h3>
          <ul className="space-y-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            <li>
              Counts come from <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">GET /jobs/stats</code> — a
              live GROUP BY on the <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">jobs</code> table.
            </li>
            <li>
              Duration is measured from <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">created_at</code> to{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">processed_at</code>, stored by the worker.
            </li>
            <li>
              The chart sums completed/failed jobs for each of the last 7 days.
            </li>
            <li>
              Nothing here is hardcoded — {formatNumber(total)} jobs across {active}{" "}
              active in the queue right now.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}