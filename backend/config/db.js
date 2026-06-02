import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  user: "admin",
  host: "localhost",
  database: "jobsdb",
  password: "admin",
  port: 5432,
});

export default pool;