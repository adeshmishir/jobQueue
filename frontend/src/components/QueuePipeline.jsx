import {
  Inbox,
  ListOrdered,
  Zap,
  Cog,
  Database,
  FileOutput,
  ArrowRight,
} from "lucide-react";

const STAGES = [
  { label: "Incoming Jobs", sub: "API / Frontend", icon: Inbox, tone: "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" },
  { label: "BullMQ", sub: "Queue", icon: ListOrdered, tone: "text-amber-500 bg-amber-50 dark:bg-amber-500/10" },
  { label: "Redis", sub: "Reliable broker", icon: Zap, tone: "text-rose-500 bg-rose-50 dark:bg-rose-500/10" },
  { label: "Worker", sub: "Processes jobs", icon: Cog, tone: "text-sky-500 bg-sky-50 dark:bg-sky-500/10", live: true },
  { label: "PostgreSQL", sub: "Persistent store", icon: Database, tone: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" },
  { label: "Result", sub: "PDF / email", icon: FileOutput, tone: "text-violet-500 bg-violet-50 dark:bg-violet-500/10" },
];

export default function QueuePipeline() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Queue Pipeline
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            How a job travels through the system
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Live
        </span>
      </div>

      <div className="flex flex-col items-stretch gap-2 lg:flex-row lg:items-center">
        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          return (
            <div key={stage.label} className="flex flex-1 flex-col items-center gap-2 lg:flex-row">
              <div className="flex w-full flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stage.tone}`}>
                  <Icon size={17} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                    {stage.label}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {stage.sub}
                  </p>
                </div>
              </div>
              {i < STAGES.length - 1 && (
                <ArrowRight
                  size={16}
                  className="hidden shrink-0 text-slate-300 dark:text-slate-600 lg:block lg:rotate-0"
                />
              )}
              {i < STAGES.length - 1 && (
                <ArrowRight
                  size={16}
                  className="rotate-90 text-slate-300 lg:hidden dark:text-slate-600"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}