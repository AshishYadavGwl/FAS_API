import { Router } from "express";
import MeetingUserController from "../controllers/meetingUserController.js";

const router = Router();

// POST: api/meetingusers/add → Add a new user to a meeting
router.post("/add", MeetingUserController.createMeetingUser);

// GET: api/meetingusers/paginated → Get paginated list of meeting users
router.get("/paginated", MeetingUserController.getPaginatedMeetingUsers);

// GET: api/meetingusers/:id → Get single meeting user by ID
router.get("/:id", MeetingUserController.getMeetingUserById);

// GET: api/meetingusers/meeting/:id → Get all users for a specific meeting
router.get("/meeting/:id", MeetingUserController.getMeetingUsersByMeetingId);

// PUT: api/meetingusers/edit/:id → Update meeting user by ID
router.put("/edit/:id", MeetingUserController.updateMeetingUser);

export default router;
