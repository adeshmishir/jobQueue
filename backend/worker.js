import { Worker } from "bullmq";
import { pathToFileURL } from "url";
import connection from "./config/redisConnection.js";
import pool from "./config/db.js";
import { sendEmail } from "./services/emailService.js";
import { generatePdf } from "./services/pdfService.js";

let workerInstance;

const workerConcurrency = Number(process.env.WORKER_CONCURRENCY || 3);
const workerName = process.env.WORKER_NAME || "worker-01";

const workerStats = {
  processed: 0,
  failed: 0,
  active: 0,
};

function createWorker() {
  if (workerInstance) {
    return workerInstance;
  }

  workerInstance = new Worker(
    "jobs",
    async (job) => {
      const { id, type, payload } = job.data;

      workerStats.active += 1;
      console.log("Processing job:", job.id, job.data.id);

      try {
        await pool.query(
          "UPDATE jobs SET status = 'PROCESSING', started_at = COALESCE(started_at, now()), updated_at = now() WHERE id = $1",
          [id]
        );

        if (type === "fail") {
          await pool.query(
            "UPDATE jobs SET status = 'FAILED', updated_at = now(), processed_at = now(), attempts = $2 WHERE id = $1",
            [id, job.attemptsMade]
          );

          throw new Error("Intentional failure");
        }

        if (type === "generate-pdf") {
          const { title, content } = payload || {};

          const result = await generatePdf({
            fileName: `${id}.pdf`,
            title,
            content,
          });

          await pool.query(
            "UPDATE jobs SET status = 'COMPLETED', result = $2, updated_at = now(), processed_at = now() WHERE id = $1",
            [id, JSON.stringify(result)]
          );

          console.log(`PDF generated: ${result.filePath}`);
          return;
        }

        if (type === "send-email") {
          const { to, subject, text } = payload || {};

          await sendEmail(to, subject, text);

          await pool.query(
            "UPDATE jobs SET status = 'COMPLETED', result = $2, updated_at = now(), processed_at = now() WHERE id = $1",
            [
              id,
              JSON.stringify({
                to,
                subject,
                sentAt: new Date().toISOString(),
              }),
            ]
          );

          console.log(`Email sent to ${to}`);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 3000));

        await pool.query(
          "UPDATE jobs SET status = 'COMPLETED', updated_at = now(), processed_at = now() WHERE id = $1",
          [id]
        );

        console.log(`Job ${id} completed`);
      } finally {
        workerStats.active -= 1;
      }
    },
    {
      connection,
      concurrency: workerConcurrency,
      name: workerName,
    }
  );

  workerInstance.on("failed", async (job) => {
    console.log(
      `Job ${job?.data?.id} failed. Attempt ${job?.attemptsMade}/${job?.opts?.attempts}`
    );

    if (job && job.attemptsMade >= job.opts.attempts) {
      workerStats.failed += 1;
      await pool.query(
        "UPDATE jobs SET status = 'FAILED', updated_at = now(), processed_at = now(), attempts = $2 WHERE id = $1",
        [job.data.id, job.attemptsMade]
      );

      console.log(`Job ${job.data.id} permanently failed`);
    } else if (job?.data) {
      await pool.query(
        "UPDATE jobs SET status = 'PENDING', updated_at = now(), attempts = $2 WHERE id = $1",
        [job.data.id, job.attemptsMade]
      );
    }
  });

  workerInstance.on("completed", (job) => {
    if (job?.data?.id) {
      workerStats.processed += 1;
    }
    console.log(`Job ${job.data.id} completed successfully`);
  });

  workerInstance.on("error", (error) => {
    console.error("Worker error:", error);
  });

  return workerInstance;
}

export async function startWorker() {
  const worker = createWorker();

  try {
    await worker.waitUntilReady();
    console.log("BullMQ worker started");
  } catch (error) {
    console.error("BullMQ worker failed to start:", error);
    throw error;
  }

  return worker;
}

export async function stopWorker() {
  if (!workerInstance) {
    return;
  }

  await workerInstance.close();
  workerInstance = undefined;
}

export function getWorkerStats() {
  return {
    name: workerName,
    running: !!workerInstance,
    concurrency: workerConcurrency,
    active: workerStats.active,
    processed: workerStats.processed,
    failed: workerStats.failed,
  };
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  startWorker().catch((error) => {
    console.error("Failed to start worker:", error);
    process.exit(1);
  });

  const shutdown = async (signal) => {
    console.log(`Received ${signal}, closing worker...`);
    await stopWorker();
    process.exit(0);
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}