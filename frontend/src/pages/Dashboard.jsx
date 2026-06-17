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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6">
        <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white p-6 shadow-md">
          <h1 className="text-3xl font-bold">Distributed Job Queue Dashboard</h1>
          <p className="text-indigo-100 mt-1 text-sm">Monitor and create background jobs</p>
        </div>
      </div>

      <div className="mb-6">
        <form onSubmit={submitJob} className="bg-white p-4 rounded-xl shadow max-w-2xl">
          <div className="flex gap-4 items-center mb-3">
            <label className="text-sm text-gray-600">Type</label>
           <select
  value={type}
  onChange={(e) => setType(e.target.value)}
  className="border rounded p-2 bg-white"
>
  <option value="default">default</option>
  <option value="generate-pdf">generate-pdf</option>
  <option value="fail">fail (simulate failure)</option>
</select>
            <button type="submit" disabled={loading} className="ml-auto bg-white hover:bg-gray-200 disabled:opacity-60 text-gray-800 px-4 py-2 rounded border">
              {loading ? "Submitting..." : "Create Job"}
            </button>
          </div>
          <div>
            <label className="text-sm text-gray-600">Payload (JSON or text)</label>
            <textarea value={payload} onChange={(e) => setPayload(e.target.value)} className="w-full border border-gray-200 rounded p-2 mt-1 bg-white" rows={3} />
          </div>
          {message && (
            <div className={`mt-3 p-2 rounded ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message.text}
            </div>
          )}
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
  <div className="bg-white p-5 rounded-xl shadow border-l-4 border-blue-500">
    <p className="text-gray-500">Total Jobs</p>
    <h2 className="text-3xl font-bold">{totalJobs}</h2>
  </div>

  <div className="bg-white p-5 rounded-xl shadow border-l-4 border-green-500">
    <p className="text-gray-500">Completed</p>
    <h2 className="text-3xl font-bold text-green-700">{completedJobs}</h2>
  </div>

  <div className="bg-white p-5 rounded-xl shadow border-l-4 border-red-500">
    <p className="text-gray-500">Failed</p>
    <h2 className="text-3xl font-bold text-red-700">{failedJobs}</h2>
  </div>

  <div className="bg-white p-5 rounded-xl shadow border-l-4 border-amber-400">
    <p className="text-gray-500">Pending</p>
    <h2 className="text-3xl font-bold text-amber-600">{pendingJobs}</h2>
  </div>
</div>

      <div className="mt-6">
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-semibold mb-3">Recent Jobs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left bg-white">
              <thead>
                <tr className="text-sm text-gray-600 border-b">
                  <th className="py-3">ID</th>
                  <th className="py-3">Type</th>
                  <th className="py-3">Payload</th>
                  <th className="py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, idx) => (
                  <tr key={job.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} border-t`}> 
                    <td className="py-2 text-sm text-slate-700">{job.id}</td>
                    <td className="py-2 text-sm text-slate-700">{job.type}</td>
                    <td className="py-2 text-sm text-slate-700">{(() => {
                      try {
                        const s = typeof job.payload === 'string' ? job.payload : JSON.stringify(job.payload);
                        return s.length > 80 ? s.slice(0, 77) + '...' : s;
                      } catch (e) {
                        return String(job.payload).slice(0, 80);
                      }
                    })()}</td>
                    <td className="py-2 text-sm">
                      {job.status === 'COMPLETED' && <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">COMPLETED</span>}
                      {job.status === 'FAILED' && <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">FAILED</span>}
                      {job.status === 'PENDING' && <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">PENDING</span>}
                      {!['COMPLETED','FAILED','PENDING'].includes(job.status) && <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">{job.status}</span>}
                    </td>
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