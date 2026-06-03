import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

const dbConfig = {
  user: process.env.PGUSER || "admin",
  host: process.env.PGHOST || "127.0.0.1",
  database: process.env.PGDATABASE || "jobsdb",
  password: process.env.PGPASSWORD || "admin",
  port: Number(process.env.PGPORT) || 5433,
};

const pool = new Pool(dbConfig);

export default pool;