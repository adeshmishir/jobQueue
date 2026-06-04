import IORedis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export default connection;