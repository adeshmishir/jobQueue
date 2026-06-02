import { Queue } from "bullmq";
import redis from "./redis.js";

export const jobQueue = new Queue("jobs", {
  connection: redis,
});