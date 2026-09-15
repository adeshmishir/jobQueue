import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { fetchJobs, fetchStats, fetchHealth, SOCKET_URL } from "../services/api";

const JobsContext = createContext(null);

export function JobsProvider({ children }) {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);
  const socketRef = useRef(null);

  const applySnapshot = useCallback((snapshot) => {
    if (!mounted.current || !snapshot) return;
    if (Array.isArray(snapshot.jobs)) setJobs(snapshot.jobs);
    if (snapshot.stats) setStats(snapshot.stats);
    if (snapshot.health) setHealth(snapshot.health);
    setApiError(null);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

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

  const requestSnapshot = useCallback(() => {
    const socket = socketRef.current;
    if (socket?.connected) socket.emit("request:snapshot");
  }, []);

  useEffect(() => {
    mounted.current = true;

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setApiError(null);
      socket.emit("request:snapshot");
    });

    socket.on("snapshot", applySnapshot);

    socket.on("disconnect", () => {
      setApiError("Connection to the JobQueue server lost. Reconnecting...");
    });

    socket.on("connect_error", () => {
      setApiError("Unable to reach the JobQueue server.");
    });

    const onVisible = () => {
      if (!document.hidden) requestSnapshot();
    };
    document.addEventListener("visibilitychange", onVisible);

    refresh();

    return () => {
      mounted.current = false;
      document.removeEventListener("visibilitychange", onVisible);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [applySnapshot, refresh, requestSnapshot]);

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