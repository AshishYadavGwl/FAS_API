import express from "express";
import { getNotificationAlertById } from "../controllers/notificationAlertController.js";

const router = express.Router();

router.get("/:id", getNotificationAlertById);

export default router;
