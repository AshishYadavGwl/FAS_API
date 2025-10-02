import { Router } from "express";
import MeetingController from "../controllers/meetingController.js";

const router = Router();

// Define meeting endpoints
router.get("/paginated", MeetingController.getPaginatedMeetings);
router.get("/", MeetingController.getAllMeetings); // GET /api/meetings
router.get("/:id", MeetingController.getMeetingById); // GET /api/meetings/:id
router.post("/", MeetingController.createMeeting); // POST /api/meetings
router.put("/:id", MeetingController.updateMeeting); // PUT /api/meetings/:id
router.delete("/:id", MeetingController.deleteMeeting); // DELETE /api/meetings/:id
router.get("/list/archived", MeetingController.getArchivedMeetings);
router.put("/archive/:id", MeetingController.archiveMeeting);
router.post("/send-alert", MeetingController.sendAlertForMeeting);

export default router;
