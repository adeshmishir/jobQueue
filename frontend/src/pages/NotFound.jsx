import { Link } from "react-router-dom";
import { Layers, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
        <Compass size={26} />
      </span>
      <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        404 — Page not found
      </h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        The page you are looking for doesn&apos;t exist.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
      >
        <Layers size={15} />
        Back to Dashboard
      </Link>
    </div>
  );
}