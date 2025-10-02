import { Router } from "express";
import FlightAlertController from "../controllers/flightAlertController.js";

const router = Router();

// Create alerts for specific user IDs
router.post("/create-for-users", FlightAlertController.createForUsers);

// Create alerts for meeting IDs
router.post("/create-for-meetings", FlightAlertController.createForMeetings);

export default router;
