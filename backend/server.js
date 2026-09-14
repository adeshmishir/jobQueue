import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { pathToFileURL } from "url";
import { jobQueue } from "./config/queue.js";
import pool from "./config/db.js";
import redisConnection from "./config/redisConnection.js";
import { ensureSchema } from "./config/schema.js";
import { v4 as uuidv4 } from "uuid";
import { startWorker, stopWorker, getWorkerStats } from "./worker.js";
import { fileExists } from "./services/pdfService.js";

dotenv.config();

export const app = express();

app.use(
  cors({
    origin: [
      "https://job-queue-nine.vercel.app",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

let serverInstance;
let shuttingDown = false;
let shutdownHandlersRegistered = false;

const JOB_COLUMNS =
  "id, type, payload, status, result, attempts, created_at, updated_at, started_at, processed_at, " +
  "CASE WHEN processed_at IS NOT NULL AND created_at IS NOT NULL " +
  "THEN ROUND(EXTRACT(EPOCH FROM (processed_at - created_at))::numeric, 2)::float ELSE NULL END AS duration";

async function getJobCounts() {
  const result = await pool.query(
    "SELECT status, COUNT(*)::int AS count FROM jobs GROUP BY status"
  );

  const counts = { PENDING: 0, PROCESSING: 0, COMPLETED: 0, FAILED: 0 };
  for (const row of result.rows) {
    if (["PENDING", "PROCESSING", "COMPLETED", "FAILED"].includes(row.status)) {
      counts[row.status] = row.count;
    }
  }
  return counts;
}

app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get("/health/detailed", async (req, res) => {
  const result = {};

  result.status = "ok";
  result.uptime = Math.round(process.uptime());
  result.timestamp = new Date().toISOString();
  result.components = {};

  result.components.api = { status: "ok" };

  try {
    await pool.query("SELECT NOW()");
    result.components.database = { status: "ok" };
  } catch (error) {
    result.components.database = { status: "down", error: error.message };
  }

  result.components.redis = {
    status:
      redisConnection.status === "ready" || redisConnection.status === "connect"
        ? "ok"
        : "down",
    clientStatus: redisConnection.status,
  };

  const workerStats = getWorkerStats();
  result.components.worker = {
    status: workerStats.running ? "ok" : "down",
    ...workerStats,
  };

  try {
    result.counts = await getJobCounts();
  } catch (error) {
    result.counts = null;
    result.components.database = { status: "down", error: error.message };
    result.status = "degraded";
  }

  if (
    result.components.database.status !== "ok" ||
    result.components.redis.status !== "ok" ||
    result.components.worker.status !== "ok"
  ) {
    result.status = "degraded";
  }

  res.status(result.status === "ok" ? 200 : 503).json(result);
});

app.post("/jobs", async (req, res) => {
  try {
    const { type, payload, priority } = req.body;
    if (!type) {
      return res.status(400).json({ error: "Job type is required" });
    }
    const id = uuidv4();

    let parsedPayload = payload;
    if (typeof payload === "string") {
      try {
        parsedPayload = JSON.parse(payload);
      } catch (error) {
        parsedPayload = payload;
      }
    }

    const dbPayload = JSON.stringify(
      parsedPayload === undefined ? null : parsedPayload
    );

    await pool.query(
      "INSERT INTO jobs (id, type, payload, status) VALUES ($1, $2, $3, $4)",
      [id, type, dbPayload, "PENDING"]
    );

    const options = {
      jobId: id,
      attempts: 3,
      backoff: {
        type: "fixed",
        delay: 3000,
      },
    };

    if (
      typeof priority === "number" ||
      ["high", "normal", "low"].includes(priority)
    ) {
      const priorityMap = { high: 1, normal: 5, low: 10 };
      options.priority =
        typeof priority === "number" ? priority : priorityMap[priority];
    }

    await jobQueue.add("job", { id, type, payload: parsedPayload }, options);

    res.json({
      success: true,
      jobId: id,
    });
  } catch (error) {
    console.error("POST /jobs error:", error);
    res.status(500).json({ error: "Failed to create job" });
  }
});

app.get("/jobs/stats", async (req, res) => {
  try {
    const counts = await getJobCounts();

    const agg = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed,
        COUNT(*) FILTER (WHERE status = 'FAILED')::int AS failed,
        ROUND(AVG(EXTRACT(EPOCH FROM (processed_at - created_at)))::numeric, 2)::float AS avg_duration_seconds
      FROM jobs`
    );

    const completed = agg.rows[0].completed || 0;
    const failed = agg.rows[0].failed || 0;
    const ratio = completed + failed;

    const daysQuery = await pool.query(
      `SELECT
        to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
        to_char(date_trunc('day', created_at), 'Dy') AS label,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed,
        COUNT(*) FILTER (WHERE status = 'FAILED')::int AS failed
      FROM jobs
      WHERE created_at >= (now() - interval '6 days')
      GROUP BY date_trunc('day', created_at)
      ORDER BY date_trunc('day', created_at)`
    );

    const dayMap = new Map();
    for (const row of daysQuery.rows) {
      dayMap.set(row.day, row);
    }

    const last7Days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const label = date.toLocaleDateString("en-US", { weekday: "short" });
      const existing = dayMap.get(key);

      last7Days.push({
        day: key,
        label,
        total: existing?.total ?? 0,
        completed: existing?.completed ?? 0,
        failed: existing?.failed ?? 0,
      });
    }

    res.json({
      ...counts,
      total:
        counts.PENDING + counts.PROCESSING + counts.COMPLETED + counts.FAILED,
      successRate: ratio > 0 ? Number(((completed / ratio) * 100).toFixed(1)) : 0,
      avgDurationSeconds:
        agg.rows[0].avg_duration_seconds !== null
          ? agg.rows[0].avg_duration_seconds
          : 0,
      last7Days,
    });
  } catch (error) {
    console.error("GET /jobs/stats error:", error);
    res.status(500).json({ error: "Failed to fetch job stats" });
  }
});

app.get("/jobs", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${JOB_COLUMNS} FROM jobs ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("GET /jobs error:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

app.get("/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT ${JOB_COLUMNS} FROM jobs WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("GET /jobs/:id error:", error);
    res.status(500).json({ error: "Failed to fetch job" });
  }
});

app.post("/jobs/:id/retry", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT id, type, payload, status FROM jobs WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    const job = result.rows[0];

    if (job.status === "PROCESSING") {
      return res.status(409).json({ error: "Job is currently processing" });
    }

    await jobQueue.remove(id).catch(() => {});

    await pool.query(
      "UPDATE jobs SET status = 'PENDING', result = NULL, processed_at = NULL, started_at = NULL, updated_at = now() WHERE id = $1",
      [id]
    );

    await jobQueue.add(
      "job",
      {
        id,
        type: job.type,
        payload: job.payload,
      },
      {
        jobId: id,
        attempts: 3,
        backoff: {
          type: "fixed",
          delay: 3000,
        },
      }
    );

    res.json({ success: true, jobId: id, status: "PENDING" });
  } catch (error) {
    console.error("POST /jobs/:id/retry error:", error);
    res.status(500).json({ error: "Failed to retry job" });
  }
});

app.delete("/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM jobs WHERE id = $1", [id]);

    try {
      await jobQueue.remove(id);
    } catch (queueError) {
      console.warn("Unable to remove job from queue:", queueError.message);
    }

    res.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /jobs/:id error:", error);
    res.status(500).json({ error: "Failed to delete job" });
  }
});

app.delete("/jobs", async (req, res) => {
  try {
    const result = await pool.query("SELECT id FROM jobs");
    const jobIds = result.rows.map((row) => row.id);

    if (jobIds.length > 0) {
      await pool.query("DELETE FROM jobs");

      for (const id of jobIds) {
        try {
          await jobQueue.remove(id);
        } catch (queueError) {
          console.warn("Unable to remove job from queue:", queueError.message);
        }
      }
    }

    res.json({ success: true, deletedCount: jobIds.length });
  } catch (error) {
    console.error("DELETE /jobs error:", error);
    res.status(500).json({ error: "Failed to delete jobs" });
  }
});

app.get("/download/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT result FROM jobs WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    const jobResult = result.rows[0].result;

    if (!jobResult || !jobResult.filePath) {
      return res.status(400).json({ error: "No file available" });
    }

    if (!fileExists(jobResult.filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    res.download(jobResult.filePath, jobResult.fileName);
  } catch (error) {
    console.error("GET /download/:id error:", error);
    res.status(500).json({ error: "Failed to download file" });
  }
});

export async function startServer() {
  if (serverInstance) {
    return serverInstance;
  }

  try {
    await ensureSchema();
    const result = await pool.query("SELECT NOW()");
    console.log("Database connected:", result.rows[0].now);
  } catch (error) {
    console.error("Database error:", error);
  }

  serverInstance = app.listen(PORT, HOST, () => {
    console.log(`Server running on port ${PORT}`);
  });

  return serverInstance;
}

export async function stopServer() {
  if (!serverInstance) {
    return;
  }

  await new Promise((resolve, reject) => {
    serverInstance.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  serverInstance = undefined;
}

export async function startWebService() {
  await startServer();
  await startWorker();

  if (!shutdownHandlersRegistered) {
    shutdownHandlersRegistered = true;
    const shutdown = (signal) => {
      handleShutdown(signal).catch((error) => {
        console.error("Shutdown error:", error);
      });
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  }

  return serverInstance;
}

async function handleShutdown(signal) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  console.log(`Received ${signal}, shutting down...`);

  const forceExitTimer = setTimeout(() => {
    console.error("Graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, 30000);
  forceExitTimer.unref();

  try {
    await stopServer();
    await stopWorker();
    await jobQueue.close();
    redisConnection.disconnect();
    await pool.end();
    console.log("Shutdown complete");
  } catch (error) {
    console.error("Shutdown error:", error);
  } finally {
    clearTimeout(forceExitTimer);
    process.exit(0);
  }
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  startWebService().catch((error) => {
    console.error("Failed to start web service:", error);
    process.exit(1);
  });
}