import express from "express";
import authRoutes from "./authRoutes.js";
import meetingRoutes from "./meetingRoutes.js";
import meetingUserRoutes from "./meetingUserRoutes.js";

const router = express.Router();

// Routes for user authentication
router.use("/auth", authRoutes);

// Routes for managing meetings
router.use("/meetings", meetingRoutes);

// Routes for managing meeting users
router.use("/meetingusers", meetingUserRoutes);

export default router;
