import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import CreateJobModal from "./CreateJobModal";
import BulkJobModal from "./BulkJobModal";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <Topbar
          onMenu={() => setSidebarOpen(true)}
          onCreate={() => setCreateOpen(true)}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet context={{ openCreate: () => setCreateOpen(true), openBulk: () => setBulkOpen(true) }} />
          </div>
        </main>
      </div>
      <CreateJobModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <BulkJobModal open={bulkOpen} onClose={() => setBulkOpen(false)} />
    </div>
  );
}