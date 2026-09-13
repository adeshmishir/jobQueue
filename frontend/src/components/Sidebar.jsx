import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ListTodo,
  Cpu,
  BarChart3,
  Layers,
  X,
  GitBranch,
} from "lucide-react";
import { cn } from "../lib/format";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/jobs", label: "Jobs", icon: ListTodo },
  { to: "/workers", label: "Workers", icon: Cpu },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <Layers size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-slate-900 dark:text-white">
              JobQueue
            </p>
            <p className="truncate text-xs text-slate-400 dark:text-slate-500">
              Background Job Platform
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
                  )
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              React → Express → BullMQ → Redis → PostgreSQL
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
              Portfolios project for asynchronous job processing.
            </p>
          </div>
          <a
            href="https://github.com/adeshmishir/jobQueue"
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center gap-2 text-xs text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-300"
          >
            <GitBranch size={14} />
            adeshmishir/jobQueue
          </a>
        </div>
      </aside>
    </>
  );
}