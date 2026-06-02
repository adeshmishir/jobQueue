import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { jobQueue } from "./config/queue.js";
import {v4 as uuidv4} from "uuid";
dotenv.config();

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});
app.post("/jobs", async (req, res) => {
  try {
    const { type, payload } = req.body;

    const jobId = uuidv4();

    const job = await jobQueue.add("job", {
      id: jobId,
      type,
      payload,
    });

    res.json({
      success: true,
      jobId: job.id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});