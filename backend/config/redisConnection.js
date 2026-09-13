import IORedis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

connection.once("connect", () => {
  console.log("Redis connected");
});

connection.on("error", (error) => {
  console.error("Redis connection error:", error.message);
});

connection.on("close", () => {
  console.warn("Redis connection closed");
});

export default connection;