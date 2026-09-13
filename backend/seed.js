import { v4 as uuidv4 } from "uuid";
import pool from "./config/db.js";
import redisConnection from "./config/redisConnection.js";
import { jobQueue } from "./config/queue.js";
import { ensureSchema } from "./config/schema.js";

const HISTORICAL_DAYS = 6;

function at(daysAgo, hour, minute = 15) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hour, minute, 0, 0);
  return d;
}

function completedJob({ daysAgo, hour, type, payload, durationSeconds, attempts = 1 }) {
  const id = uuidv4();
  const created = at(daysAgo, hour);
  const started = new Date(created.getTime() + 2000);
  const processed = new Date(created.getTime() + durationSeconds * 1000);

  return {
    id,
    type,
    payload: JSON.stringify(payload),
    status: "COMPLETED",
    attempts,
    result: JSON.stringify({ seeded: true, note: "Historical seed data" }),
    created_at: created.toISOString(),
    started_at: started.toISOString(),
    processed_at: processed.toISOString(),
  };
}

function failedJob({ daysAgo, hour, type, payload, attempts = 3 }) {
  const id = uuidv4();
  const created = at(daysAgo, hour);
  const started = new Date(created.getTime() + 2000);
  const processed = new Date(created.getTime() + 15000);

  return {
    id,
    type,
    payload: JSON.stringify(payload),
    status: "FAILED",
    attempts,
    result: JSON.stringify({ seeded: true, error: "Simulated failure" }),
    created_at: created.toISOString(),
    started_at: started.toISOString(),
    processed_at: processed.toISOString(),
  };
}

function buildHistorical() {
  const jobs = [];

  for (let d = 1; d <= HISTORICAL_DAYS; d += 1) {
    jobs.push(
      completedJob({
        daysAgo: d,
        hour: 8,
        type: "default",
        payload: { task: `Morning sync run — day ${d}`, rows: 120 + d * 13 },
        durationSeconds: 3 + d,
      }),
      completedJob({
        daysAgo: d,
        hour: 13,
        type: "generate-pdf",
        payload: {
          title: `Daily Report ${new Date(at(d, 13)).toISOString().slice(0, 10)}`,
          content: `Revenue summary for day ${d}.`,
        },
        durationSeconds: 2 + d,
      }),
      completedJob({
        daysAgo: d,
        hour: 17,
        type: "send-email",
        payload: {
          to: "ops@example.com",
          subject: `Daily digest ${d}`,
          text: `Auto-generated digest for day ${d}.`,
        },
        durationSeconds: 1 + d,
      })
    );
  }

  jobs.push(
    failedJob({
      daysAgo: 6,
      hour: 19,
      type: "fail",
      payload: { reason: "seed failure demo" },
    }),
    failedJob({
      daysAgo: 3,
      hour: 9,
      type: "send-email",
      payload: { to: "billing@example.com", subject: "Invoice", text: "Retried then failed." },
    })
  );

  return jobs;
}

const LIVE_JOBS = [
  {
    type: "generate-pdf",
    payload: {
      title: "Q3 Financial Analysis",
      content: "Quarterly revenue breakdown for Q3.",
    },
    priority: 1,
  },
  {
    type: "generate-pdf",
    payload: {
      title: "Inventory Audit Report",
      content: "Stock levels and audit findings.",
    },
  },
  {
    type: "send-email",
    payload: {
      to: "ops@example.com",
      subject: "Welcome aboard",
      text: "Your worker account is ready.",
    },
  },
  {
    type: "default",
    payload: { task: "Cache warm-up", rows: 500 },
  },
  {
    type: "default",
    payload: { task: "Nightly backup", rows: 25 },
  },
  {
    type: "fail",
    payload: { reason: "Live retry demo" },
  },
];

async function seedLiveIntoQueue() {
  for (const { type, payload, priority = 5 } of LIVE_JOBS) {
    const id = uuidv4();

    await pool.query(
      "INSERT INTO jobs (id, type, payload, status, attempts) VALUES ($1, $2, $3, 'PENDING', 0)",
      [id, type, JSON.stringify(payload)]
    );

    await jobQueue.add(
      "job",
      { id, type, payload },
      {
        jobId: id,
        attempts: 3,
        backoff: { type: "fixed", delay: 3000 },
        priority,
      }
    );
  }
}

async function seed() {
  await ensureSchema();

  const existing = await pool.query("SELECT COUNT(*)::int AS count FROM jobs");
  if (existing.rows[0].count > 0) {
    console.log(`Skipping seed: ${existing.rows[0].count} job(s) already exist.`);
    await pool.end();
    redisConnection.disconnect();
    await jobQueue.close();
    return;
  }

  const historical = buildHistorical();
  for (const job of historical) {
    await pool.query(
      `INSERT INTO jobs (id, type, payload, status, attempts, result, created_at, started_at, processed_at)
       VALUES ($1, $2, $3::jsonb, $4, $5, $6::jsonb, $7, $8, $9)`,
      [
        job.id,
        job.type,
        job.payload,
        job.status,
        job.attempts,
        job.result,
        job.created_at,
        job.started_at,
        job.processed_at,
      ]
    );
  }

  await seedLiveIntoQueue();

  console.log(
    `Seeded ${historical.length} historical + ${LIVE_JOBS.length} live job(s).`
  );

  await pool.end();
  redisConnection.disconnect();
  await jobQueue.close();
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});