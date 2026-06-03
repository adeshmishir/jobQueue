import { Worker } from "bullmq";
import connection from "./config/redisConnection.js";
import pool from "./config/db.js";

const worker = new Worker(
  "jobs",
  async (job) => {
    const { id, type, payload } = job.data;

    console.log("Processing job:", job.data);

    // Mark as processing
    await pool.query(
      "UPDATE jobs SET status = $1 WHERE id = $2",
      ["PROCESSING", id]
    );

    // Simulate failure
    if (type === "fail") {
      await pool.query(
        "UPDATE jobs SET status = $1 WHERE id = $2",
        ["FAILED", id]
      );

      throw new Error("Intentional failure");
    }

    // Simulate work
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Mark as completed
    await pool.query(
      "UPDATE jobs SET status = $1 WHERE id = $2",
      ["COMPLETED", id]
    );

    console.log(`Job ${id} completed`);
  },
  { connection }
);

console.log("Worker is running...");

worker.on("failed", async (job, err) => {
  console.log(
    `Job ${job?.data?.id} failed. Attempt ${job?.attemptsMade}/${job?.opts?.attempts}`
  );

  // When all retries are exhausted
  if (job && job.attemptsMade >= job.opts.attempts) {
    await pool.query(
      "UPDATE jobs SET status = $1 WHERE id = $2",
      ["FAILED", job.data.id]
    );

    console.log(`Job ${job.data.id} permanently failed`);
  }
});

worker.on("completed", (job) => {
  console.log(`Job ${job.data.id} completed successfully`);
});