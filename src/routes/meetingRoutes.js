import { Router } from "express";
import MeetingController from "../controllers/meetingController.js";

const router = Router();

// POST: api/meetings/add → Create a new meeting
router.post("/add", MeetingController.createMeeting);

// GET: api/meetings/paginated → Get paginated list of meetings
router.get("/paginated", MeetingController.getPaginatedMeetings);

// GET: api/meetings/all → Get all meetings
router.get("/all", MeetingController.getAllMeetings);

export default router;
