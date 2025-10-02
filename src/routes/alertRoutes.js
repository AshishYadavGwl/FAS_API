import express from "express";
import AlertController from "../controllers/alertController.js";

const router = express.Router();

// Send alerts for specific users
router.post("/send-for-users", AlertController.sendAlertForUsers);

// Send alerts for meetings (all users in meetings)
router.post("/send-for-meetings", AlertController.sendAlertForMeetings);

export default router;
