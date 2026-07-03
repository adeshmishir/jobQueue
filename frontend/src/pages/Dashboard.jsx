import { useEffect, useState } from "react";
import api from "../services/api";

function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [type, setType] = useState("default");
  const [payload, setPayload] = useState("");
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfContent, setPdfContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [openMenuId, setOpenMenuId] = useState(null);
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((job) => job.status === "COMPLETED").length;
  const failedJobs = jobs.filter((job) => job.status === "FAILED").length;
  const pendingJobs = jobs.filter((job) => job.status === "PENDING").length;
  const displayedJobs = jobs.slice(0, visibleCount);
  const hasMoreJobs = visibleCount < jobs.length;

  const fetchJobs = async () => {
    const res = await api.get("/jobs");
    setJobs(res.data);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const deleteJob = async (jobId) => {
    if (!window.confirm("Delete this task?")) {
      return;
    }

    try {
      await api.delete(`/jobs/${jobId}`);
      setMessage({ type: "success", text: "Task deleted" });
      setVisibleCount(10);
      fetchJobs();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.error || err.message });
    }
  };

  const deleteAllJobs = async () => {
    if (!window.confirm("Delete all tasks?")) {
      return;
    }

    try {
      await api.delete("/jobs");
      setMessage({ type: "success", text: "All tasks deleted" });
      setVisibleCount(10);
      fetchJobs();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.error || err.message });
    }
  };

  const toggleMenu = (jobId) => {
    setOpenMenuId((current) => (current === jobId ? null : jobId));
  };

  const submitJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const preparedPayload = (() => {
      if (type === "generate-pdf") {
        return {
          title: pdfTitle.trim() || "Generated PDF",
          content: pdfContent.trim() || "No content provided",
        };
      }

      if (type === "fail") {
        return payload.trim() || "Intentional failure request";
      }

      return payload;
    })();

    try {
      const res = await api.post("/jobs", { type, payload: preparedPayload });
      setMessage({ type: "success", text: `Job created: ${res.data.jobId}` });
      setPayload("");
      setPdfTitle("");
      setPdfContent("");
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
        <div className="rounded-xl bg-linear-to-r from-indigo-600 to-indigo-500 text-white p-6 shadow-md">
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
          {type === "generate-pdf" ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">PDF Title</label>
                <input
                  type="text"
                  value={pdfTitle}
                  onChange={(e) => setPdfTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded p-2 mt-1 bg-white"
                  placeholder="Enter PDF title"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">PDF Content</label>
                <textarea
                  value={pdfContent}
                  onChange={(e) => setPdfContent(e.target.value)}
                  className="w-full border border-gray-200 rounded p-2 mt-1 bg-white"
                  rows={4}
                  placeholder="Write the content you want in the PDF"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-sm text-gray-600">{type === "fail" ? "Message" : "Payload (JSON or text)"}</label>
              <textarea
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                className="w-full border border-gray-200 rounded p-2 mt-1 bg-white"
                rows={3}
                placeholder={type === "fail" ? "Write a message for the failed job" : "Enter text or JSON payload"}
              />
            </div>
          )}
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
            <div>
              <h3 className="font-semibold">Recent Jobs</h3>
              <p className="text-sm text-gray-500">Showing {Math.min(displayedJobs.length, jobs.length)} of {jobs.length} tasks</p>
            </div>
            {jobs.length > 10 && (
              <button
                type="button"
                onClick={deleteAllJobs}
                className="px-3 py-2 rounded border border-red-300 text-red-600 text-sm hover:bg-red-50"
              >
                Delete All
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left bg-white">
              <thead>
                <tr className="text-sm text-gray-600 border-b">
                  <th className="py-3">ID</th>
                  <th className="py-3">Type</th>
                  <th className="py-3">Payload</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedJobs.map((job, idx) => (
                  <tr key={job.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} border-t`}> 
                    <td className="py-2 text-sm text-slate-700">{job.id}</td>
                    <td className="py-2 text-sm text-slate-700">{job.type}</td>
                    <td className="py-2 text-sm text-slate-700">{(() => {
                      try {
                        const s = typeof job.payload === 'string' ? job.payload : JSON.stringify(job.payload);
                        return s.length > 80 ? s.slice(0, 77) + '...' : s;
                      } catch {
                        return String(job.payload).slice(0, 80);
                      }
                    })()}</td>
                    <td className="py-2 text-sm">
                      {job.status === 'COMPLETED' && <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">COMPLETED</span>}
                      {job.status === 'FAILED' && <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">FAILED</span>}
                      {job.status === 'PENDING' && <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">PENDING</span>}
                      {!['COMPLETED','FAILED','PENDING'].includes(job.status) && <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">{job.status}</span>}
                    </td>
                    <td className="py-2 text-sm">
                      <div className="relative flex justify-end">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleMenu(job.id);
                          }}
                          className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
                          aria-label="More actions"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                          </svg>
                        </button>

                        {openMenuId === job.id && (
                          <div className="absolute right-0 top-10 z-10 w-36 rounded-md border border-gray-200 bg-white shadow-lg">
                            {job.status === "COMPLETED" && job.result?.filePath ? (
                              <a
                                href={`http://localhost:5000/download/${job.id}`}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m-8 6h8" />
                                </svg>
                                Download
                              </a>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => deleteJob(job.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 0h10l-1 12a2 2 0 01-2 2H9a2 2 0 01-2-2L6 7z" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasMoreJobs && (
            <div className="mt-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + 10)}
                className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Show more
              </button>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;