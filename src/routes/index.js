import express from "express";
import authRoutes from "./authRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);

router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

export default router;
