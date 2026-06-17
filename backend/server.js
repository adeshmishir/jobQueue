import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { pathToFileURL } from "url";
import { jobQueue } from "./config/queue.js";
import pool from "./config/db.js";
import { v4 as uuidv4 } from "uuid";
import { startWorker, stopWorker } from "./worker.js";

dotenv.config();

export const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

const PORT = process.env.PORT || 5000;
let serverInstance;
let shutdownHandlersRegistered = false;

app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

app.post("/jobs", async (req, res) => {

  try {
    const { type, payload } = req.body;
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

    await jobQueue.add(
      "job",
      {
        id,
        type,
        payload: parsedPayload,
      },
      {
        attempts: 3,
        backoff: {
          type: "fixed",
          delay: 3000,
        },
      }
    );

    res.json({
      success: true,
      jobId: id,
    });
  } catch (error) {
    console.error("POST /jobs error:", error);
    res.status(500).json({ error: "Failed to create job" });
  }
});

app.get("/jobs", async (req, res) => {
  try {
   const result = await pool.query(
  "SELECT id, type, payload, status, result FROM jobs ORDER BY id DESC"
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
  "SELECT id, type, payload, status, result FROM jobs WHERE id = $1",
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

export async function startServer() {
  if (serverInstance) {
    return serverInstance;
  }

  try {
    const result = await pool.query("SELECT NOW()");
    console.log("DB Connected:", result.rows[0]);
  } catch (error) {
    console.error("DB Error:", error);
  }

  serverInstance = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
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
  startWorker();

  if (!shutdownHandlersRegistered) {
    const shutdown = async (signal) => {
      console.log(`Received ${signal}, shutting down web service...`);

      try {
        await stopWorker();
        await stopServer();
      } finally {
        process.exit(0);
      }
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
    shutdownHandlersRegistered = true;
  }

  return serverInstance;
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  startWebService().catch((error) => {
    console.error("Failed to start web service:", error);
    process.exit(1);
  });
}