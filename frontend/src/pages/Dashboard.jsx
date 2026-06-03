import { useEffect, useState } from "react";
import api from "../services/api";

function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [type, setType] = useState("default");
  const [payload, setPayload] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const totalJobs = jobs.length;
const completedJobs = jobs.filter((job) => job.status === "COMPLETED").length;
const failedJobs = jobs.filter((job) => job.status === "FAILED").length;
const pendingJobs = jobs.filter((job) => job.status === "PENDING").length;

  const fetchJobs = async () => {
    const res = await api.get("/jobs");
    setJobs(res.data);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const submitJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post("/jobs", { type, payload });
      setMessage({ type: "success", text: `Job created: ${res.data.jobId}` });
      setPayload("");
      fetchJobs();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">
        Distributed Job Queue Dashboard
      </h1>

      <div className="mb-6">
        <form onSubmit={submitJob} className="bg-white p-4 rounded-xl shadow max-w-2xl">
          <div className="flex gap-4 items-center mb-3">
            <label className="text-sm text-gray-600">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="border rounded p-2">
              <option value="default">default</option>
              <option value="fail">fail (simulate failure)</option>
            </select>
            <button type="submit" disabled={loading} className="ml-auto bg-blue-600 text-white px-4 py-2 rounded">
              {loading ? "Submitting..." : "Create Job"}
            </button>
          </div>
          <div>
            <label className="text-sm text-gray-600">Payload (JSON or text)</label>
            <textarea value={payload} onChange={(e) => setPayload(e.target.value)} className="w-full border rounded p-2 mt-1" rows={3} />
          </div>
          {message && (
            <div className={`mt-3 p-2 rounded ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message.text}
            </div>
          )}
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
  <div className="bg-white p-5 rounded-xl shadow">
    <p className="text-gray-500">Total Jobs</p>
    <h2 className="text-3xl font-bold">{totalJobs}</h2>
  </div>

  <div className="bg-white p-5 rounded-xl shadow">
    <p className="text-gray-500">Completed</p>
    <h2 className="text-3xl font-bold text-green-600">{completedJobs}</h2>
  </div>

  <div className="bg-white p-5 rounded-xl shadow">
    <p className="text-gray-500">Failed</p>
    <h2 className="text-3xl font-bold text-red-600">{failedJobs}</h2>
  </div>

  <div className="bg-white p-5 rounded-xl shadow">
    <p className="text-gray-500">Pending</p>
    <h2 className="text-3xl font-bold text-yellow-600">{pendingJobs}</h2>
  </div>
</div>

      <div className="mt-6">
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-semibold mb-3">Recent Jobs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-sm text-gray-600">
                  <th className="py-2">ID</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Payload</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-t">
                    <td className="py-2 text-sm">{job.id}</td>
                    <td className="py-2 text-sm">{job.type}</td>
                    <td className="py-2 text-sm">{String(job.payload).slice(0, 80)}</td>
                    <td className="py-2 text-sm">{job.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;