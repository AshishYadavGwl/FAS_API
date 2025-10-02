import { Router } from "express";
import EventHubController from "../controllers/eventHubController.js";

const router = Router();

// Fetch events for specific user IDs
router.post("/fetch-for-users", EventHubController.fetchForUsers);

// Fetch events for meeting IDs
router.post("/fetch-for-meetings", EventHubController.fetchForMeetings);

export default router;
