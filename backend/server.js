import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { jobQueue } from "./config/queue.js";
import pool from "./config/db.js";
import {v4 as uuidv4} from "uuid";
dotenv.config();

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

// NOTE: routes for listing/getting jobs are defined below (no duplicates)
app.post("/jobs", async (req, res) => {
  const { type, payload } = req.body;

  const id = uuidv4();

  // 1. Save in DB first
  // Ensure payload is valid JSON text for the JSON column.
  let parsedPayload = payload;
  if (typeof payload === "string") {
    try {
      parsedPayload = JSON.parse(payload);
    } catch (e) {
      // leave as string - we'll store it as a JSON string below
      parsedPayload = payload;
    }
  }

  const dbPayload = JSON.stringify(parsedPayload === undefined ? null : parsedPayload);

  await pool.query(
    "INSERT INTO jobs (id, type, payload, status) VALUES ($1, $2, $3, $4)",
    [id, type, dbPayload, "PENDING"]
  );

  // 2. Push to queue
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
});

// List all jobs
app.get("/jobs", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, type, payload, status FROM jobs ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET /jobs error:", err);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// Get a single job by id
app.get("/jobs/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT id, type, payload, status FROM jobs WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /jobs/:id error:", err);
    res.status(500).json({ error: "Failed to fetch job" });
  }
});
try {
  const result = await pool.query("SELECT NOW()");
  console.log("DB Connected:", result.rows[0]);
} catch (err) {

  console.error("DB Error:", err);
}
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});