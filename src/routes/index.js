import express from "express";
import authRoutes from "./authRoutes.js";
import meetingRoutes from "./meetingRoutes.js";
import meetingUserRoutes from "./meetingUserRoutes.js";
import excelImportRoutes from "./excelImportRoutes.js";
import flightAlertRoutes from "./flightAlertRoutes.js";
import eventHubRoutes from "./eventHubRoutes.js";
import alertRoutes from "./alertRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/meetings", meetingRoutes);
router.use("/meetingusers", meetingUserRoutes);
router.use("/excel", excelImportRoutes);
router.use("/flight-alerts", flightAlertRoutes);
router.use("/event-hub", eventHubRoutes);
router.use("/alerts", alertRoutes);

router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

export default router;
