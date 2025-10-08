import { Router } from "express";
import eventHubService from "../services/eventHub.service.js";
import CheckAlertService from "../WebjobService/checkAlertService.js";

const router = Router();

// Start Event Hub real-time service
router.post("/start", async (req, res) => {
  try {
    // Check if already running
    if (eventHubService.isRunning) {
      return res.status(400).json({
        success: false,
        message: "Service is already running",
      });
    }

    await eventHubService.start();

    res.json({
      success: true,
      message: "Event Hub service started successfully",
      data: eventHubService.getStatus(),
    });
  } catch (error) {
    console.error("❌ Failed to start service:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start service",
      error: error.message,
    });
  }
});

// Stop Event Hub service
router.post("/stop", async (req, res) => {
  try {
    // Check if already stopped
    if (!eventHubService.isRunning) {
      return res.status(400).json({
        success: false,
        message: "Service is not running",
      });
    }

    await eventHubService.stop();

    res.json({
      success: true,
      message: "Event Hub service stopped successfully",
    });
  } catch (error) {
    console.error("❌ Failed to stop service:", error);
    res.status(500).json({
      success: false,
      message: "Failed to stop service",
      error: error.message,
    });
  }
});

// Get service status and statistics
router.get("/status", (req, res) => {
  try {
    const status = eventHubService.getStatus();

    res.json({
      success: true,
      message: "Service status retrieved",
      data: status,
    });
  } catch (error) {
    console.error("❌ Failed to get status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get service status",
      error: error.message,
    });
  }
});

// Restart service (convenience endpoint)
router.post("/restart", async (req, res) => {
  try {
    // Stop if running
    if (eventHubService.isRunning) {
      await eventHubService.stop();
    }

    // Wait a moment before starting
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Start again
    await eventHubService.start();

    res.json({
      success: true,
      message: "Event Hub service restarted successfully",
      data: eventHubService.getStatus(),
    });
  } catch (error) {
    console.error("❌ Failed to restart service:", error);
    res.status(500).json({
      success: false,
      message: "Failed to restart service",
      error: error.message,
    });
  }
});

// Search specific alert
router.get("/search/:alertId", async (req, res) => {
  try {
    const { alertId } = req.params;
    const hours = parseInt(req.query.hours) || 24;

    console.log(`\n🔍 API Request: Alert ${alertId}, Lookback ${hours}h`);

    const result = await CheckAlertService.searchAlertInEventHub(
      alertId,
      hours
    );

    res.json(result);
  } catch (error) {
    console.error("❌ Route error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
