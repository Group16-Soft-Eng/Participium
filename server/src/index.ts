import {app}  from "@app";
import { CONFIG } from "@config";
import { initializeDatabase } from "@database";
let server;

async function startServer() {
  try {
    await initializeDatabase();
    app.listen(CONFIG.APP_PORT);
    console.log("Server Started");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();