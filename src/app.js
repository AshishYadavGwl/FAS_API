import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import path from "path";
import routes from "./routes/index.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const isProd = process.env.NODE_ENV === "production";

// **SECURITY & PERFORMANCE MIDDLEWARE**
app.use(helmet());
app.use(compression());
app.use(cors());

// Conditional logging
if (!isProd || process.env.LOG_REQUESTS === "true") {
  app.use(morgan("dev"));
}

// Body parsing with limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files
app.use(
  "/images",
  express.static(path.join(__dirname, "../public/images"), {
    maxAge: isProd ? "7d" : 0,
  })
);

// Root route
app.get("/", (req, res) => res.send("API Running"));

// API routes
app.use("/api", routes);

// 404 handler
app.all("/*splat", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;
