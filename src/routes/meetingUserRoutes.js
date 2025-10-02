import { Router } from "express";
import MeetingUserController from "../controllers/meetingUserController.js";

const router = Router();

// Specific static routes (no parameters)
router.get("/", MeetingUserController.getAllMeetingUsers); // GET /api/meetingusers
router.get(
  "/archived/:meetingId",
  MeetingUserController.getArchivedMeetingUsers
); // GET /api/meetingusers/archived/0 or /archived/123

router.get("/paginated", MeetingUserController.getPaginatedMeetingUsers);

router.post("/send-alert", MeetingUserController.sendAlertForUsers); // POST /api/meetingusers/send-alert

// Specific dynamic routes (with specific path + parameters)
router.get(
  "/meeting/:meetingId",
  MeetingUserController.getMeetingUsersByMeetingId
); // GET /api/meetingusers/meeting/123

// CRUD operations with specific paths
router.post("/", MeetingUserController.createMeetingUser); // POST /api/meetingusers
router.put("/:id", MeetingUserController.updateMeetingUser); // PUT /api/meetingusers/123
router.delete("/:id", MeetingUserController.deleteMeetingUser); // DELETE /api/meetingusers/123

// Generic dynamic route (catch-all) - MUST BE LAST
router.get("/:id", MeetingUserController.getMeetingUserById); // GET /api/meetingusers/123

export default router;
