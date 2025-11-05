import express from "express";
import NotificationAlertController from "../controllers/notificationAlertController.js";

const router = express.Router();

// Fetch alerts by Meeting ID
router.get("/meeting/:id", NotificationAlertController.getByMeetingId);

// Fetch alerts by Attendee ID
router.get("/attendee/:id", NotificationAlertController.getByAttendeeId);

// Fetch alerts by Attendee Type
router.get("/type/:type", NotificationAlertController.getByAttendeeType);

router.post("/alerts/save-or-update", NotificationAlertController.saveOrUpdate)

export default router;
