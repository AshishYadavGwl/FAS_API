import app from "./src/app.js";
import { connectDB } from "./src/config/database.js";
import config from "./src/config/config.js";

// Start server function
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log("✅ Database connected");

    // Start server
    app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📍 Environment: ${config.env}`);
      console.log(
        `🌐 URL: ${process.env.BASE_URL || `http://localhost:${config.port}`}`
      );
    });
  } catch (error) {
    console.error("❌ Startup failed:", error.message);
    process.exit(1);
  }
};

// Run server
startServer();
