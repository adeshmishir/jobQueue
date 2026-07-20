import { Worker } from "bullmq";
import { pathToFileURL } from "url";
import connection from "./config/redisConnection.js";
import pool from "./config/db.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { sendEmail } from "./services/emailService.js";

let workerInstance;

function createWorker() {
  if (workerInstance) {
    return workerInstance;
  }

  workerInstance = new Worker(
    "jobs",
    async (job) => {
      const { id, type, payload } = job.data;

      console.log("Processing job:", job.data);

      await pool.query("UPDATE jobs SET status = $1 WHERE id = $2", [
        "PROCESSING",
        id,
      ]);

      if (type === "fail") {
        await pool.query("UPDATE jobs SET status = $1 WHERE id = $2", [
          "FAILED",
          id,
        ]);

        throw new Error("Intentional failure");
      }

      if (type === "generate-pdf") {
        const { title, content } = payload || {};

        const folder = path.join(process.cwd(), "generated-pdfs");

        if (!fs.existsSync(folder)) {
          fs.mkdirSync(folder);
        }

        const fileName = `${id}.pdf`;
        const filePath = path.join(folder, fileName);

        const doc = new PDFDocument();
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        doc.fontSize(22).text(title || "Generated PDF", {
          align: "center",
        });

        doc.moveDown();
        doc.fontSize(14).text(content || "No content provided");

        doc.end();

        await new Promise((resolve, reject) => {
          stream.on("finish", resolve);
          stream.on("error", reject);
        });

       await pool.query(
  "UPDATE jobs SET status = $1, result = $2 WHERE id = $3",
  [
    "COMPLETED",
    JSON.stringify({
      fileName,
      filePath,
      generatedAt: new Date().toISOString(),
    }),
    id,
  ]
);

        console.log(`PDF generated: ${filePath}`);
        return;
      }

      if (type === "send-email") {
  const { to, subject, text } = payload || {};

  await sendEmail(to, subject, text);

  await pool.query(
    "UPDATE jobs SET status = $1, result = $2 WHERE id = $3",
    [
      "COMPLETED",
      JSON.stringify({
        to,
        subject,
        sentAt: new Date().toISOString(),
      }),
      id,
    ]
  );

  console.log(`Email sent to ${to}`);
  return;
}

      await new Promise((resolve) => setTimeout(resolve, 3000));

      await pool.query("UPDATE jobs SET status = $1 WHERE id = $2", [
        "COMPLETED",
        id,
      ]);

      console.log(`Job ${id} completed`);
    },
    { connection }
  );

  workerInstance.on("failed", async (job) => {
    console.log(
      `Job ${job?.data?.id} failed. Attempt ${job?.attemptsMade}/${job?.opts?.attempts}`
    );

    if (job && job.attemptsMade >= job.opts.attempts) {
      await pool.query("UPDATE jobs SET status = $1 WHERE id = $2", [
        "FAILED",
        job.data.id,
      ]);

      console.log(`Job ${job.data.id} permanently failed`);
    }
  });

  workerInstance.on("completed", (job) => {
    console.log(`Job ${job.data.id} completed successfully`);
  });

  workerInstance.on("error", (error) => {
    console.error("Worker error:", error);
  });

  return workerInstance;
}

export function startWorker() {
  const worker = createWorker();
  console.log("Worker is initialized...");
  return worker;
}

export async function stopWorker() {
  if (!workerInstance) {
    return;
  }

  await workerInstance.close();
  workerInstance = undefined;
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  startWorker();

  const shutdown = async (signal) => {
    console.log(`Received ${signal}, closing worker...`);
    await stopWorker();
    process.exit(0);
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}