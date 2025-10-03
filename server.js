import app from "./src/app.js";
import { connectDB } from "./src/config/database.js";
import config from "./src/config/config.js";
import "./src/models/associations.js";

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(config.port, () => {
      if (config.logging) {
        console.log(`Server: ${config.port} | Env: ${config.env}`);
      }
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      server.close(() => process.exit(0));
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
