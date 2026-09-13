import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center dark:bg-slate-950">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400">
            <AlertTriangle size={26} />
          </span>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Something went wrong
          </h2>
          <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            A rendering error occurred. Reloading resumes live updates.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            <RefreshCw size={15} />
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}