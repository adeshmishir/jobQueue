import { Queue } from "bullmq";
import connection from "./redisConnection.js";

export const jobQueue = new Queue("jobs", {
  connection,
});