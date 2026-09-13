import { CloudOff, RefreshCw } from "lucide-react";

export default function ErrorState({ onRetry, compact }) {
  if (compact) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-500/30 dark:bg-rose-500/10">
        <div className="flex items-center gap-3">
          <CloudOff size={18} className="text-rose-500" />
          <div>
            <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
              Unable to connect to JobQueue API
            </p>
            <p className="text-xs text-rose-600/80 dark:text-rose-300/70">
              Data will retry automatically in a moment.
            </p>
          </div>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-500/40 dark:bg-transparent dark:text-rose-300"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-white px-6 py-16 text-center dark:border-rose-500/30 dark:bg-slate-900">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-500 dark:bg-rose-500/15">
        <CloudOff size={22} />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
        Unable to connect to JobQueue API
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        The backend service may be starting up or unavailable. Please try again.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          <RefreshCw size={15} />
          Retry
        </button>
      )}
    </div>
  );
}