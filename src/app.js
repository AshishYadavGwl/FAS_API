import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";
import routes from "./routes/index.js";
import errorHandler from "./middleware/errorHandler.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Create __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Express app
const app = express();

// Security middleware - protects from common attacks
app.use(helmet());

// Enable CORS - allows frontend to connect
app.use(cors());

// Request logging - shows incoming requests in console
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Parse JSON data from requests (max 10mb)
app.use(express.json({ limit: "10mb" }));

// Parse form data from requests
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("I am alive");
});

// Serve static images from public/images folder
app.use("/images", express.static(path.join(__dirname, "../public/images")));

// Main API routes
app.use("/api", routes);

// Health check endpoint - to verify server is running
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler - when route not found
app.use("/*splat", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
});

// Error handler - handles all errors (keep this last)
app.use(errorHandler);

export default app;
