// // routes/eventHub.routes.js

// import { Router } from "express";
// import EventHubService from "../services/eventHubService.js";
// import eventHubCron from "../services/eventHubCron.js";
// import eventHubRealtimeService from "../services/eventHubRealtimeService.js";
// import CheckAlertService from "../services/checkAlertService.js";

// const router = Router();
// // ✅ NEW: Check specific alert ID in Event Hub
// router.post("/check-alert", async (req, res) => {
//   try {
//     const { alertId, timeout = 20 } = req.body;

//     if (!alertId) {
//       return res.status(400).json({
//         success: false,
//         message: "alertId is required",
//       });
//     }

//     console.log(`\n🔍 API Request: Checking Event Hub for ${alertId}`);

//     const result = await CheckAlertService.searchAlertInEventHub(
//       alertId,
//       timeout
//     );

//     console.log(`✅ Search complete: ${result.eventsFound} events found\n`);

//     res.json({
//       success: result.success,
//       message:
//         result.eventsFound > 0
//           ? `Found ${result.eventsFound} event(s) for this alert`
//           : "No events found for this alert ID",
//       data: {
//         alertId: result.alertId,
//         eventsFound: result.eventsFound,
//         totalScanned: result.totalScanned,
//         searchDuration: `${(result.searchDuration / 1000).toFixed(1)}s`,
//         events: result.events,
//       },
//       error: result.error,
//     });
//   } catch (error) {
//     console.error(`❌ Check alert error:`, error.message);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });
// // Manual sync with detailed stats
// router.post("/sync", async (req, res) => {
//   try {
//     const { hoursAhead = 48 } = req.body;

//     // Validate hours
//     if (hoursAhead < 1 || hoursAhead > 168) {
//       return res.status(400).json({
//         success: false,
//         message: "hoursAhead must be between 1 and 168 (7 days)",
//       });
//     }

//     const stats = await EventHubService.syncFlightStatus(hoursAhead);

//     res.json({
//       success: stats.success,
//       message: stats.success
//         ? `Sync completed: ${stats.statusChanged} updated, ${stats.statusUnchanged} unchanged`
//         : "Sync failed",
//       stats: {
//         configuration: {
//           hoursAhead: stats.hoursAhead,
//           timeWindow: `Next ${stats.hoursAhead} hours`,
//         },
//         discovered: {
//           usersFound: stats.usersFound,
//           usersWithAlerts: stats.usersWithAlerts,
//           uniqueAlerts: stats.uniqueAlerts,
//         },
//         eventHub: {
//           eventsReceived: stats.eventsReceived,
//         },
//         updates: {
//           statusChanged: stats.statusChanged,
//           statusUnchanged: stats.statusUnchanged,
//         },
//         performance: {
//           executionTimeMs: stats.executionTime,
//           executionTimeSec: (stats.executionTime / 1000).toFixed(2),
//         },
//       },
//       details: stats.details,
//       error: stats.error || null,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });

// // ✅ NEW: Get cron status
// router.get("/cron/status", (req, res) => {
//   const status = eventHubCron.getStatus();
//   res.json({
//     success: true,
//     cron: status,
//   });
// });

// // ✅ NEW: Update cron hours
// router.put("/cron/config", (req, res) => {
//   const { hoursAhead } = req.body;

//   if (!hoursAhead || hoursAhead < 1 || hoursAhead > 168) {
//     return res.status(400).json({
//       success: false,
//       message: "hoursAhead must be between 1 and 168",
//     });
//   }

//   eventHubCron.setHoursAhead(hoursAhead);

//   res.json({
//     success: true,
//     message: `Cron time window updated to ${hoursAhead} hours`,
//     cron: eventHubCron.getStatus(),
//   });
// });

// // ✅ NEW: Stop cron
// router.post("/cron/stop", (req, res) => {
//   eventHubCron.stop();
//   res.json({
//     success: true,
//     message: "Cron job stopped",
//   });
// });

// // ✅ NEW: Start cron
// router.post("/cron/start", (req, res) => {
//   eventHubCron.start();
//   res.json({
//     success: true,
//     message: "Cron job started",
//     cron: eventHubCron.getStatus(),
//   });
// });

// // Get service status
// router.get("/status", (req, res) => {
//   res.json({
//     success: true,
//     status: eventHubRealtimeService.getStatus(),
//   });
// });

// // Stop service
// router.post("/stop", async (req, res) => {
//   try {
//     await eventHubRealtimeService.stop();
//     res.json({ success: true, message: "Service stopped" });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // Start service
// router.post("/start", async (req, res) => {
//   try {
//     await eventHubRealtimeService.start();
//     res.json({ success: true, message: "Service started" });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// export default router;
// // 