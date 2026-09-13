import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  ListChecks,
  Mail,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Layers,
} from "lucide-react";
import Modal from "./Modal";
import JobStatusBadge from "./JobStatusBadge";
import { createJob } from "../services/api";
import { useJobs } from "../context/JobsContext";
import { cn } from "../lib/format";

const TASKS = [
  {
    id: "generate-pdf",
    icon: FileText,
    title: "Generate PDF Report",
    desc: "Create a downloadable PDF report",
    primary: true,
  },
  {
    id: "default",
    icon: ListChecks,
    title: "Background Job",
    desc: "Queue a simulated background task",
  },
  {
    id: "send-email",
    icon: Mail,
    title: "Send Email",
    desc: "Deliver an email through the worker",
  },
  {
    id: "fail",
    icon: AlertTriangle,
    title: "Simulate Failure",
    desc: "Demonstrate BullMQ retries & failures",
  },
];

const PRIORITIES = {
  normal: { label: "Normal", hint: "Default ordering" },
  high: { label: "Urgent", hint: "Processed first" },
  low: { label: "Low", hint: "Processed last" },
};

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500">
          {hint}
        </span>
      )}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20";

export default function CreateJobModal({ open, onClose }) {
  const navigate = useNavigate();
  const { refresh } = useJobs();

  const [task, setTask] = useState(null);
  const [priority, setPriority] = useState("normal");
  const [fields, setFields] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    if (open) {
      setTask(null);
      setFields({});
      setPriority("normal");
      setSubmitting(false);
      setError(null);
      setCreated(null);
    }
  }, [open]);

  const selectedTask = useMemo(
    () => TASKS.find((t) => t.id === task),
    [task]
  );

  const set = (key) => (e) =>
    setFields((f) => ({ ...f, [key]: e.target.value }));

  const valid = useMemo(() => {
    if (!selectedTask) return false;
    if (selectedTask.id === "send-email") {
      return fields.to && fields.subject && fields.text;
    }
    if (selectedTask.id === "generate-pdf") {
      const title = (fields.title || "Q3 Financial Analysis").trim();
      const rows = Number(fields.rows || 5000);
      return Boolean(title) && rows >= 1;
    }
    return true;
  }, [selectedTask, fields]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedTask || !valid || submitting) return;

    let payload;
    if (selectedTask.id === "generate-pdf") {
      const rows = Math.max(1, Number(fields.rows) || 1);
      const lines = Array.from(
        { length: rows },
        (_, i) => `Row ${i + 1} · sample record value ${i + 1}`
      );
      const content = [
        fields.notes ? `Notes: ${fields.notes}` : null,
        ...lines,
      ]
        .filter(Boolean)
        .join("\n");
      payload = { title: fields.title, content };
    } else if (selectedTask.id === "send-email") {
      payload = {
        to: fields.to?.trim(),
        subject: fields.subject?.trim(),
        text: fields.text,
      };
    } else if (selectedTask.id === "fail") {
      payload = { message: fields.message || "Intentional failure request" };
    } else {
      payload = {
        name: fields.name?.trim() || "Background job",
        description: fields.description?.trim(),
      };
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await createJob(selectedTask.id, payload, priority);
      setCreated(res.jobId);
      refresh();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to create job");
    } finally {
      setSubmitting(false);
    }
  }

  const secondary = "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800";
  const primary = "bg-indigo-600 text-white hover:bg-indigo-500";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create New Job"
      subtitle="Send a task into the BullMQ queue"
      wide
    >
      {created ? (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <CheckCircle2 size={28} />
          </span>
          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
            Job added to queue
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Your job has been queued successfully and will be processed by the
            worker.
          </p>
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-700 dark:bg-slate-800/60">
            <Layers size={16} className="text-slate-400" />
            <span className="font-mono text-sm text-slate-700 dark:text-slate-200">
              #{created.slice(0, 8).toUpperCase()}
            </span>
            <JobStatusBadge status="PENDING" pulse />
          </div>
          <div className="mt-6 flex w-full max-w-xs gap-3">
            <button
              onClick={() => navigate(`/jobs/${created}`)}
              className={cn("flex-1 rounded-lg px-4 py-2 text-sm font-medium", primary)}
            >
              View Job
            </button>
            <button
              onClick={() => setCreated(null)}
              className={cn("flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-700", secondary)}
            >
              Create Another
            </button>
          </div>
        </div>
      ) : !selectedTask ? (
        <div className="space-y-3">
          {TASKS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTask(t.id)}
                className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/5"
              >
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
                    t.primary
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
                  )}
                >
                  <Icon size={20} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t.title}
                  </p>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                    {t.desc}
                  </p>
                </div>
                {t.primary && (
                  <span className="ml-auto shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                    Recommended
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTask(null)}
              className={cn("rounded-lg p-1.5", secondary)}
              aria-label="Back to task selection"
            >
              <ArrowLeft size={18} />
            </button>
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                selectedTask.primary
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
              )}
            >
              <selectedTask.icon size={16} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {selectedTask.title}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedTask.desc}
              </p>
            </div>
          </div>

          {selectedTask.id === "generate-pdf" && (
            <>
              <Field label="Report Name">
                <input
                  className={inputClass}
                  value={fields.title || "Q3 Financial Analysis"}
                  onChange={set("title")}
                  placeholder="Q3 Financial Analysis"
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Number of Data Rows" hint="More rows = larger PDF">
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    className={inputClass}
                    value={fields.rows || 5000}
                    onChange={set("rows")}
                  />
                </Field>
                <Field label="Priority">
                  <select
                    className={inputClass}
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    {Object.entries(PRIORITIES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label} — {v.hint}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Summary / notes" hint="Optional text appended to the report">
                <textarea
                  rows={2}
                  className={inputClass}
                  value={fields.notes || ""}
                  onChange={set("notes")}
                  placeholder="Optional summary line"
                />
              </Field>
            </>
          )}

          {selectedTask.id === "default" && (
            <div className="grid grid-cols-1 gap-4">
              <Field label="Job Name">
                <input
                  className={inputClass}
                  value={fields.name || ""}
                  onChange={set("name")}
                  placeholder="e.g. Rebuild search index"
                />
              </Field>
              <Field label="Notes" hint="Stored in the job payload and saved to PostgreSQL">
                <textarea
                  rows={2}
                  className={inputClass}
                  value={fields.description || ""}
                  onChange={set("description")}
                  placeholder="What should this background task do?"
                />
              </Field>
              <Field label="Priority">
                <select
                  className={inputClass}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  {Object.entries(PRIORITIES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label} — {v.hint}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          {selectedTask.id === "send-email" && (
            <>
              <Field label="Recipient">
                <input
                  type="email"
                  className={inputClass}
                  value={fields.to || ""}
                  onChange={set("to")}
                  placeholder="recipient@example.com"
                />
              </Field>
              <Field label="Subject">
                <input
                  className={inputClass}
                  value={fields.subject || ""}
                  onChange={set("subject")}
                  placeholder="Email subject"
                />
              </Field>
              <Field label="Message">
                <textarea
                  rows={3}
                  className={inputClass}
                  value={fields.text || ""}
                  onChange={set("text")}
                  placeholder="Write the email body"
                />
              </Field>
            </>
          )}

          {selectedTask.id === "fail" && (
            <>
              <Field label="Message" hint="The worker runs this job, then intentionally throws to trigger BullMQ retries">
                <input
                  className={inputClass}
                  value={fields.message || ""}
                  onChange={set("message")}
                  placeholder="Message carried by the failing job"
                />
              </Field>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                This job will fail after BullMQ&apos;s default retries (3 attempts
                with a 3s backoff), leaving a FAILED record in PostgreSQL — great
                for demonstrating failure handling and retries.
              </div>
            </>
          )}

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className={cn("rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-700", secondary)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!valid || submitting}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
                primary
              )}
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              Add to Queue
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}