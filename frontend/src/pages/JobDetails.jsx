import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Layers,
  ListOrdered,
  Cog,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  RotateCcw,
  Trash2,
  Braces,
} from "lucide-react";
import { useJobs } from "../context/JobsContext";
import JobStatusBadge from "../components/JobStatusBadge";
import { JobTypeIcon } from "./Dashboard";
import EmptyState from "../components/EmptyState";
import { fetchJob } from "../services/api";
import { retryJob, deleteJob, downloadUrl } from "../services/api";
import {
  typeLabel,
  jobHash,
  formatClock,
  formatDateTime,
  formatDuration,
  cn,
} from "../lib/format";

function TimelineItem({ icon: Icon, time, title, note, active, done, tone = "slate" }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
            done
              ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800"
          )}
        >
          <Icon size={14} />
        </span>
        {active && <span className="mt-1 w-px flex-1 bg-slate-200 dark:bg-slate-700" />}
      </div>
      <div className={cn("pb-6", !active && "pb-0")}>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{title}</p>
        {note && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{note}</p>}
        <p className="mt-0.5 font-mono text-xs text-slate-400 dark:text-slate-500">{time}</p>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { jobs, health, refresh } = useJobs();
  const [single, setSingle] = useState(null);

  const job = jobs.find((j) => j.id === id) || single;

  useEffect(() => {
    fetchJob(id)
      .then(setSingle)
      .catch(() => setSingle(null));
  }, [id]);

  if (!job) {
    return (
      <EmptyState
        icon={FileText}
        title="Job not found"
        description="This job may have been deleted, or the ID is invalid."
        action={
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            <ArrowLeft size={15} />
            Back to Jobs
          </Link>
        }
      />
    );
  }

  const isPdf = job.type === "generate-pdf";
  const canDownload = isPdf && job.status === "COMPLETED" && job.result?.filePath;

  const timelineSteps = [
    {
      key: "created",
      icon: Layers,
      time: formatClock(job.created_at),
      title: "Job created",
      note: "POST /jobs persisted the job to PostgreSQL and added it to BullMQ",
    },
    {
      key: "queued",
      icon: ListOrdered,
      time: formatClock(job.created_at),
      title: "Added to BullMQ queue",
      note: "Stored in Redis, waiting for a worker",
    },
    {
      key: "started",
      icon: Cog,
      time: job.started_at ? formatClock(job.started_at) : "—",
      title: "Worker started processing",
      note: job.started_at ? "Status changed to PROCESSING" : "Not reached yet",
      done: !!job.started_at,
    },
    {
      key: "result",
      icon: job.status === "FAILED" ? XCircle : CheckCircle2,
      time: job.processed_at ? formatClock(job.processed_at) : "—",
      title: job.status === "FAILED" ? "Processing failed" : "Job completed",
      note:
        job.status === "FAILED"
          ? `Final status FAILED after ${job.attempts || 0} attempt(s)`
          : isPdf
            ? "PDF generated and database updated"
            : "Result stored in PostgreSQL",
      done: !!job.processed_at,
    },
  ];

  async function handleRetry() {
    try {
      await retryJob(job.id);
      refresh();
    } catch (err) {
      window.alert(err?.response?.data?.error || "Failed to retry job");
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this job?")) return;
    try {
      await deleteJob(job.id);
      navigate("/jobs");
    } catch (err) {
      window.alert(err?.response?.data?.error || "Failed to delete job");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <ArrowLeft size={15} />
          Back
        </button>
        <div className="flex min-w-0 items-center gap-3">
          <JobTypeIcon type={job.type} className="text-slate-400" />
          <h2 className="truncate text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {typeLabel(job.type)}
          </h2>
          <span className="font-mono text-sm text-slate-400 dark:text-slate-500">
            {jobHash(job.id)}
          </span>
        </div>
        <div className="ml-auto">
          <JobStatusBadge status={job.status} size="md" pulse={job.status === "PROCESSING"} />
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Created {formatDateTime(job.created_at)} · Updated {formatDateTime(job.updated_at)}
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Timeline
            </h3>
            {timelineSteps.map((step, i) => (
              <TimelineItem
                key={step.key}
                {...step}
                active={i < timelineSteps.length - 1}
                done={!!step.done}
              />
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <Braces size={15} />
              Payload sent to the worker
            </h3>
            <pre className="max-h-72 overflow-auto rounded-lg bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
              {JSON.stringify(job.payload ?? null, null, 2)}
            </pre>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Processing Details
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-5">
              <Detail label="Queue" value="jobs" />
              <Detail
                label="Worker"
                value={health?.components?.worker?.name || "worker-01"}
              />
              <Detail label="Duration" value={formatDuration(job.duration)} />
              <Detail label="Attempts" value={`${job.attempts || 0} / 3`} />
              <Detail
                label="Concurrency"
                value={health?.components?.worker?.concurrency ?? "—"}
              />
              <Detail label="Status" value={job.status} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Result
            </h3>
            {canDownload && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                  <FileText size={18} className="text-red-500" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {job.result.fileName}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Generated {formatDateTime(job.result.generatedAt)}
                    </p>
                  </div>
                </div>
                <a
                  href={downloadUrl(job.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                >
                  <Download size={15} />
                  Download PDF
                </a>
              </div>
            )}
            {job.type === "send-email" && job.status === "COMPLETED" && (
              <div className="space-y-2 text-sm">
                <p className="text-slate-600 dark:text-slate-300">
                  Sent to <span className="font-medium">{job.result?.to}</span> at{" "}
                  {formatDateTime(job.result?.sentAt)}
                </p>
              </div>
            )}
            {!canDownload && job.type !== "send-email" && job.status === "COMPLETED" && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Job completed. No downloadable artifact was produced.
              </p>
            )}
            {job.status !== "COMPLETED" && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No result yet — the job hasn&apos;t finished.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {job.status === "FAILED" && (
              <button
                onClick={handleRetry}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
              >
                <RotateCcw size={15} />
                Retry Job
              </button>
            )}
            {job.status === "PENDING" && (
              <div className="flex-1 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                Waiting in the queue for a worker…
              </div>
            )}
            <button
              onClick={handleDelete}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-rose-500/10"
            >
              <Trash2 size={15} />
              Delete
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}