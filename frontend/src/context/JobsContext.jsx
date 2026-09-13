import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { fetchJobs, fetchStats, fetchHealth } from "../services/api";

const JobsContext = createContext(null);
const POLL_MS = 4000;

export function JobsProvider({ children }) {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    const [jobsRes, statsRes, healthRes] = await Promise.allSettled([
      fetchJobs(),
      fetchStats(),
      fetchHealth(),
    ]);

    if (!mounted.current) return;

    if (jobsRes.status === "fulfilled") setJobs(jobsRes.value);
    if (statsRes.status === "fulfilled") setStats(statsRes.value);
    if (healthRes.status === "fulfilled") setHealth(healthRes.value);

    const anyRejected = [jobsRes, statsRes, healthRes].some(
      (r) => r.status === "rejected"
    );
    setApiError(anyRejected ? "Unable to reach the JobQueue API." : null);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    const onVisible = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      mounted.current = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  return (
    <JobsContext.Provider
      value={{ jobs, stats, health, loading, apiError, lastUpdated, refresh }}
    >
      {children}
    </JobsContext.Provider>
  );
}

export function useJobs() {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error("useJobs must be used within JobsProvider");
  return ctx;
}