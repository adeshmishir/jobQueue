import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL;

const api = axios.create({ baseURL: API_URL });

export const fetchJobs = () => api.get("/jobs").then((r) => r.data);
export const fetchJob = (id) => api.get(`/jobs/${id}`).then((r) => r.data);
export const fetchStats = () => api.get("/jobs/stats").then((r) => r.data);
export const fetchHealth = () => api.get("/health/detailed").then((r) => r.data);
export const createJob = (type, payload, priority) =>
  api.post("/jobs", { type, payload, priority }).then((r) => r.data);
export const retryJob = (id) =>
  api.post(`/jobs/${id}/retry`).then((r) => r.data);
export const deleteJob = (id) => api.delete(`/jobs/${id}`).then((r) => r.data);
export const deleteAllJobs = () => api.delete("/jobs").then((r) => r.data);
export const downloadUrl = (id) => `${API_URL}/download/${id}`;

export { SOCKET_URL };

export default api;