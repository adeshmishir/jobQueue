import { startWebService } from "./server.js";

startWebService().catch((error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});