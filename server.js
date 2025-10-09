import { server } from "./src/app.js";
import { connectDB } from "./src/config/database.js";
import config from "./src/config/config.js";
import "./src/models/associations.js";
import eventHubService from "./src/services/eventHub.service.js";
import webSocketService from "./src/services/webSocket.service.js";

const startServer = async () => {
  try {
    await connectDB();

    server.listen(config.port, () => {
      if (config.logging) {
        console.log(`🚀 Server running on port ${config.port}`);
        console.log(`📡 WebSocket ready at ws://localhost:${config.port}`);
        console.log(`🌐 API ready at http://localhost:${config.port}/api`);
      }
    });

    // Graceful shutdown with services
    process.on("SIGTERM", async () => {
      console.log("🛑 SIGTERM received, shutting down...");
      await eventHubService.stop();
      webSocketService.shutdown();
      server.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
      });
    });

    process.on("SIGINT", async () => {
      console.log("🛑 SIGINT received, shutting down...");
      await eventHubService.stop();
      WebSocketService.shutdown();
      server.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
