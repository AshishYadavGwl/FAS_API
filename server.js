import app from "./src/app.js";
import { connectDB } from "./src/config/database.js";
import config from "./src/config/config.js";

const startServer = async () => {
  try {
    await connectDB();

    app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📍 Environment: ${config.env}`);
      console.log(`🔗 API Base URL: http://localhost:${config.port}/api`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
