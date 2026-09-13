import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  Plus,
  Layers,
  Clock3,
  LoaderCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Inbox,
  FileText,
  ListChecks,
  Mail,
  AlertTriangle,
} from "lucide-react";
import { useJobs } from "../context/JobsContext";
import StatCard from "../components/StatCard";
import JobStatusBadge from "../components/JobStatusBadge";
import JobProgress, { ProgressLabel } from "../components/JobProgress";
import JobActions from "../components/JobActions";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import { CardSkeleton } from "../components/LoadingSkeleton";
import { timeAgo, formatDuration, jobHash, typeLabel } from "../lib/format";

const TYPE_ICONS = {
  "generate-pdf": FileText,
  default: ListChecks,
  "send-email": Mail,
  fail: AlertTriangle,
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function JobTypeIcon({ type, className }) {
  const Icon = TYPE_ICONS[type] || Layers;
  return <Icon size={15} className={className} />;
}

function ActiveJobRow({ job }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          <JobTypeIcon type={job.type} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {typeLabel(job.type)}
          </p>
          <p className="font-mono text-xs text-slate-400 dark:text-slate-500">
            {jobHash(job.id)} · created {timeAgo(job.created_at)}
          </p>
        </div>
        <JobStatusBadge status={job.status} pulse={job.status !== "COMPLETED"} />
      </div>

      <div>
        <JobProgress status={job.status} />
        <div className="mt-1.5 flex items-center justify-between">
          <ProgressLabel status={job.status} />
          {job.status === "COMPLETED" && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Processed in {formatDuration(job.duration)}
            </span>
          )}
        </div>
      </div>

      <JobActions job={job} showDelete={false} />
    </div>
  );
}

export default function Dashboard() {
  const { jobs, stats, loading, apiError, refresh } = useJobs();
  const { openCreate, openBulk } = useOutletContext();

  const activeJobs = jobs
    .filter((j) => j.status === "PENDING" || j.status === "PROCESSING")
    .slice(0, 4);
  const recentCompleted = jobs
    .filter((j) => j.status === "COMPLETED" || j.status === "FAILED")
    .slice(0, 4);

  const statCards = [
    { label: "Total Jobs", value: stats?.total, icon: Layers, tone: "slate" },
    { label: "Pending", value: stats?.PENDING, icon: Clock3, tone: "amber" },
    { label: "Processing", value: stats?.PROCESSING, icon: LoaderCircle, tone: "sky" },
    { label: "Completed", value: stats?.COMPLETED, icon: CheckCircle2, tone: "emerald" },
    { label: "Failed", value: stats?.FAILED, icon: XCircle, tone: "rose" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {greeting()} 👋
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitor and manage your background jobs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
          >
            <Plus size={16} />
            Create Job
          </button>
          <button
            onClick={openBulk}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Layers size={16} />
            Bulk Job Demo
          </button>
        </div>
      </div>

      {apiError && (
        <ErrorState
          compact
          onRetry={refresh}
        />
      )}

      {loading && !stats ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {statCards.map((c) => (
            <StatCard key={c.label} {...c} hint={c.label === "Total Jobs" ? "All-time" : undefined} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Active Jobs
            </h3>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              View all
              <ArrowRight size={14} />
            </Link>
          </div>
          {!loading && jobs.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No jobs yet"
              description="Create your first background job and watch it move through the queue."
              action={
                <button
                  onClick={openCreate}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                >
                  <Plus size={15} />
                  Create Your First Job
                </button>
              }
            />
          ) : (
            <div className="space-y-3">
              {activeJobs.map((job) => (
                <ActiveJobRow key={job.id} job={job} />
              ))}
              {activeJobs.length === 0 && (
                <EmptyState
                  icon={CheckCircle2}
                  title="Queue is clear"
                  description="No pending or processing jobs right now."
                />
              )}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Recent Activity
            </h3>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              View all
              <ArrowRight size={14} />
            </Link>
          </div>
          {!loading && recentCompleted.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Nothing finished yet"
              description="Completed and failed jobs will appear here."
            />
          ) : (
            <div className="space-y-3">
              {recentCompleted.map((job) => (
                <ActiveJobRow key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}