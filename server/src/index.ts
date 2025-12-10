import {app}  from "@app";
import { CONFIG } from "@config";
import { initializeDatabase, initializeRedis } from "@database";
import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import { Server as IOServer, Socket } from "socket.io";
import { setIO } from "@services/ioService";

let server;

async function startServer() {
  try {
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, "../uploads/reports");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log("Created uploads directory:", uploadsDir);
    }

    //? Ensure avatars directory exists (as for reports, but for story 9)
    const avatarsDir = path.join(__dirname, "../uploads/avatars");
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
      console.log("Created uploads directory:", avatarsDir);
    }

    await initializeDatabase();
    await initializeRedis();

    // app.listen(CONFIG.APP_PORT);

    // Create HTTP server and attach Socket.IO
    const httpServer = http.createServer(app);
    const io = new IOServer(httpServer, { cors: { origin: "*" } });
    setIO(io);

    io.on("connection", (socket: Socket) => {
      socket.on("join-report", (reportId: number) => socket.join(`report:${reportId}`));
    });

    httpServer.listen(CONFIG.APP_PORT);
    console.log("Server Started on port", CONFIG.APP_PORT);
    
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();