import { useNavigate } from "react-router-dom";
import { Eye, Download, RotateCcw, Trash2 } from "lucide-react";
import { useJobs } from "../context/JobsContext";
import { retryJob, deleteJob, downloadUrl } from "../services/api";
import { cn } from "../lib/format";

const base =
  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition border";

export default function JobActions({ job, showDelete = true, size = "sm" }) {
  const navigate = useNavigate();
  const { refresh } = useJobs();

  const canDownload =
    job.status === "COMPLETED" &&
    job.type === "generate-pdf" &&
    job.result?.filePath;

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
      refresh();
    } catch (err) {
      window.alert(err?.response?.data?.error || "Failed to delete job");
    }
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      {canDownload && (
        <a
          href={downloadUrl(job.id)}
          className={cn(
            base,
            "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
          )}
          title="Download PDF"
        >
          <Download size={13} />
          {size === "sm" ? "PDF" : "Download"}
        </a>
      )}

      <button
        onClick={() => navigate(`/jobs/${job.id}`)}
        className={cn(
          base,
          "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        )}
        title="View details"
      >
        <Eye size={13} />
        View
      </button>

      {job.status === "FAILED" && (
        <button
          onClick={handleRetry}
          className={cn(
            base,
            "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300"
          )}
          title="Re-queue job"
        >
          <RotateCcw size={13} />
          Retry
        </button>
      )}

      {showDelete && (
        <button
          onClick={handleDelete}
          className={cn(
            base,
            "border-transparent text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
          )}
          title="Delete job"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}