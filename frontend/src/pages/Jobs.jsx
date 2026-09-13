import { useEffect, useMemo, useState } from "react";
import { Search, Inbox, Trash2 } from "lucide-react";
import { useJobs } from "../context/JobsContext";
import JobStatusBadge from "../components/JobStatusBadge";
import JobActions from "../components/JobActions";
import { JobTypeIcon } from "./Dashboard";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { JobsTableSkeleton } from "../components/LoadingSkeleton";
import Pagination from "../components/Pagination";
import { deleteAllJobs } from "../services/api";
import { jobHash, typeLabel, timeAgo, formatDuration, cn } from "../lib/format";

const PAGE_SIZE = 10;

const STATUS_FILTERS = ["All", "PENDING", "PROCESSING", "COMPLETED", "FAILED"];
const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "duration", label: "Duration (fastest)" },
];

const inputClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20";

export default function Jobs() {
  const { jobs, stats, loading, apiError, refresh } = useJobs();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [type, setType] = useState("All");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [query, status, type, sort]);

  const types = useMemo(() => {
    const set = new Set(jobs.map((j) => j.type));
    return ["All", ...set];
  }, [jobs]);

  const filtered = useMemo(() => {
    let list = jobs.filter((job) => {
      if (status !== "All" && job.status !== status) return false;
      if (type !== "All" && job.type !== type) return false;
      if (query) {
        const haystack = `${job.id} ${typeLabel(job.type)} ${JSON.stringify(job.payload || {})}`.toLowerCase();
        if (!haystack.includes(query.toLowerCase())) return false;
      }
      return true;
    });

    const t = (job) => new Date(job.created_at || 0).getTime();
    if (sort === "newest") list.sort((a, b) => t(b) - t(a));
    else if (sort === "oldest") list.sort((a, b) => t(a) - t(b));
    else list.sort((a, b) => (a.duration ?? 1e9) - (b.duration ?? 1e9));
    return list;
  }, [jobs, query, status, type, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  async function handleDeleteAll() {
    if (!window.confirm("Delete all jobs? This also removes them from the queue.")) return;
    try {
      await deleteAllJobs();
      refresh();
    } catch (err) {
      window.alert(err?.response?.data?.error || "Failed to delete jobs");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Jobs
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {(stats?.total ?? jobs.length)} total · track every task through the queue
          </p>
        </div>
        <button
          onClick={handleDeleteAll}
          disabled={jobs.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-40 dark:border-rose-500/30 dark:bg-transparent dark:text-rose-400 dark:hover:bg-rose-500/10"
        >
          <Trash2 size={15} />
          Delete All
        </button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jobs… (id, type, payload)"
            className={cn(inputClass, "w-full pl-9")}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={inputClass}
            aria-label="Filter by type"
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t === "All" ? "All Types" : typeLabel(t)}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={inputClass}
            aria-label="Sort"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              status === s
                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-300"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            )}
          >
            {s === "All" ? "All" : s}
          </button>
        ))}
      </div>

      {apiError && <ErrorState compact onRetry={refresh} />}

      {loading ? (
        <JobsTableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={query || status !== "All" || type !== "All" ? "No matching jobs" : "No jobs yet"}
          description={
            query || status !== "All" || type !== "All"
              ? "Try adjusting your search or filters."
              : "Create your first background job to see it listed here."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
                  <th className="px-4 py-3">Job</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b border-slate-50 transition hover:bg-slate-50/60 dark:border-slate-800/70 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium text-slate-500 dark:text-slate-400">
                        {jobHash(job.id)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                        <JobTypeIcon type={job.type} className="text-slate-400 dark:text-slate-500" />
                        {typeLabel(job.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <JobStatusBadge status={job.status} pulse={job.status !== "COMPLETED"} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                      {timeAgo(job.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm tabular-nums text-slate-500 dark:text-slate-400">
                      {formatDuration(job.duration)}
                    </td>
                    <td className="px-4 py-3">
                      <JobActions job={job} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={safePage}
            pageCount={pageCount}
            onPage={setPage}
            total={filtered.length}
          />
        </div>
      )}
    </div>
  );
}