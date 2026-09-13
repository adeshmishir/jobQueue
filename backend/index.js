import dotenv from "dotenv";
import { startWebService } from "./server.js";

dotenv.config();

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

startWebService().catch((error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});