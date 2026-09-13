import pool from "./db.js";

export async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id UUID PRIMARY KEY,
      type TEXT NOT NULL,
      payload JSONB,
      status TEXT NOT NULL DEFAULT 'PENDING',
      attempts INTEGER NOT NULL DEFAULT 0,
      result JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      started_at TIMESTAMPTZ,
      processed_at TIMESTAMPTZ
    )
  `);

  await pool.query(
    "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()"
  );
  await pool.query(
    "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ"
  );
  await pool.query(
    "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ"
  );
  await pool.query(
    "ALTER TABLE jobs ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'"
  );
}