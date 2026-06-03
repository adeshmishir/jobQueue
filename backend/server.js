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

app.get("/jobs", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM jobs
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
});

app.get("/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM jobs WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch job",
    });
  }
});
app.post("/jobs", async (req, res) => {
  const { type, payload } = req.body;

  const id = uuidv4();

  // 1. Save in DB first
  await pool.query(
    "INSERT INTO jobs (id, type, payload, status) VALUES ($1, $2, $3, $4)",
    [id, type, payload, "PENDING"]
  );

  // 2. Push to queue
  await jobQueue.add(
  "job",
  {
    id,
    type,
    payload,
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