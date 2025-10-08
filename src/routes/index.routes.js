import express from "express";
import authRoutes from "./auth.routes.js";
import meetingRoutes from "./meeting.routes.js";
import meetingUserRoutes from "./meetingUser.routes.js";
import eventHubRoutes from "./eventHub.routes.js";

const router = express.Router();

// Routes for user authentication
router.use("/auth", authRoutes);

// Routes for managing meetings
router.use("/meetings", meetingRoutes);

// Routes for managing meeting users
router.use("/meetingusers", meetingUserRoutes);

// Routes for managing event hub alert
router.use("/eventhub", eventHubRoutes);

export default router;
