import Meeting from "../models/Meeting.js";
import MeetingUser from "../models/MeetingUser.js";
import alertService from "../services/alertService.js";
import MeetingService from "../services/meetingService.js";
import ApiResponse from "../utils/response.js";

class MeetingController {
  // GET /api/meetings/paginated
  static async getPaginatedMeetings(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        filterMeetingName = "",
        filterCreatedBy = "",
        filterCreateDate = "",
        sortBy = "CreateDate",
        sortOrder = "DESC",
      } = req.query;

      const result = await MeetingService.getPaginatedMeetings({
        page: parseInt(page),
        limit: parseInt(limit),
        search: search.trim(),
        filterMeetingName: filterMeetingName.trim(),
        filterCreatedBy: filterCreatedBy.trim(),
        filterCreateDate: filterCreateDate.trim(),
        sortBy,
        sortOrder,
      });

      return ApiResponse.success(
        res,
        {
          meetings: result.meetings,
          pagination: result.pagination,
        },
        "Meetings fetched successfully"
      );
    } catch (error) {
      console.error("Get paginated meetings error:", error);
      return ApiResponse.error(res, "Failed to fetch meetings", 500);
    }
  }

  // GET /api/meetings - Get all meetings
  static async getAllMeetings(req, res) {
    try {
      const meetings = await MeetingService.getAllMeetings();

      // Format response to match your required structure
      const formattedMeetings = meetings.map((meeting) => ({
        id: meeting.Id,
        meetingName: meeting.MeetingName,
        createdBy: meeting.CreatedBy,
        createDate: meeting.CreateDate,
        emailAlert: meeting.EmailAlert,
        smsAlert: meeting.SmsAlert,
        emailState: meeting.EmailState,
        emailStatus: meeting.EmailStatus,
        smsState: meeting.SmsState,
        smsStatus: meeting.SmsStatus,
        modifiedBy: meeting.ModifiedBy,
        modifiedDate: meeting.ModifiedDate,
      }));

      return ApiResponse.success(
        res,
        formattedMeetings,
        "Meetings fetched successfully"
      );
    } catch (error) {
      console.error("Get meetings error:", error);
      return ApiResponse.error(res, "Failed to fetch meetings", 500);
    }
  }

  // GET /api/meetings/:id - Get single meeting
  static async getMeetingById(req, res) {
    try {
      const { id } = req.params;
      const meeting = await MeetingService.getMeetingById(id);

      if (!meeting) {
        return ApiResponse.error(res, "Meeting not found", 404);
      }

      const formattedMeeting = {
        id: meeting.Id,
        meetingName: meeting.MeetingName,
        createdBy: meeting.CreatedBy,
        createDate: meeting.CreateDate,
        emailAlert: meeting.EmailAlert,
        smsAlert: meeting.SmsAlert,
        emailState: meeting.EmailState,
        emailStatus: meeting.EmailStatus,
        smsState: meeting.SmsState,
        smsStatus: meeting.SmsStatus,
        modifiedBy: meeting.ModifiedBy,
        modifiedDate: meeting.ModifiedDate,
      };

      return ApiResponse.success(res, formattedMeeting, "Meeting found");
    } catch (error) {
      console.error("Get meeting error:", error);
      return ApiResponse.error(res, "Failed to fetch meeting", 500);
    }
  }

  // POST /api/meetings - Create new meeting
  static async createMeeting(req, res) {
    try {
      const { meetingName, createdBy, emailAlert, smsAlert } = req.body;

      // Validation
      if (!meetingName || !createdBy) {
        return ApiResponse.error(
          res,
          "Meeting name and creator are required",
          400
        );
      }

      const meetingData = {
        MeetingName: meetingName,
        CreatedBy: createdBy,
        EmailAlert: emailAlert || false,
        SmsAlert: smsAlert || false,
        CreateDate: new Date(),
      };

      const newMeeting = await MeetingService.createMeeting(meetingData);

      const formattedMeeting = {
        id: newMeeting.Id,
        meetingName: newMeeting.MeetingName,
        createdBy: newMeeting.CreatedBy,
        createDate: newMeeting.CreateDate,
        emailAlert: newMeeting.EmailAlert,
        smsAlert: newMeeting.SmsAlert,
        emailState: newMeeting.EmailState,
        emailStatus: newMeeting.EmailStatus,
        smsState: newMeeting.SmsState,
        smsStatus: newMeeting.SmsStatus,
        modifiedBy: newMeeting.ModifiedBy,
        modifiedDate: newMeeting.ModifiedDate,
      };

      return ApiResponse.success(
        res,
        formattedMeeting,
        "Meeting created successfully",
        201
      );
    } catch (error) {
      console.error("Create meeting error:", error);
      return ApiResponse.error(res, "Failed to create meeting", 500);
    }
  }

  // PUT /api/meetings/:id - Update meeting
  static async updateMeeting(req, res) {
    try {
      const { id } = req.params;
      const { meetingName, modifiedBy, emailAlert, smsAlert } = req.body;

      const updateData = {};
      if (meetingName) updateData.MeetingName = meetingName;
      if (modifiedBy) updateData.ModifiedBy = modifiedBy;
      if (emailAlert !== undefined) updateData.EmailAlert = emailAlert;
      if (smsAlert !== undefined) updateData.SmsAlert = smsAlert;

      const updatedMeeting = await MeetingService.updateMeeting(id, updateData);

      if (!updatedMeeting) {
        return ApiResponse.error(res, "Meeting not found", 404);
      }

      const formattedMeeting = {
        id: updatedMeeting.Id,
        meetingName: updatedMeeting.MeetingName,
        createdBy: updatedMeeting.CreatedBy,
        createDate: updatedMeeting.CreateDate,
        emailAlert: updatedMeeting.EmailAlert,
        smsAlert: updatedMeeting.SmsAlert,
        emailState: updatedMeeting.EmailState,
        emailStatus: updatedMeeting.EmailStatus,
        smsState: updatedMeeting.SmsState,
        smsStatus: updatedMeeting.SmsStatus,
        modifiedBy: updatedMeeting.ModifiedBy,
        modifiedDate: updatedMeeting.ModifiedDate,
      };

      return ApiResponse.success(
        res,
        formattedMeeting,
        "Meeting updated successfully"
      );
    } catch (error) {
      console.error("Update meeting error:", error);
      return ApiResponse.error(res, "Failed to update meeting", 500);
    }
  }

  // DELETE /api/meetings/:id - Delete meeting (soft delete)
  static async deleteMeeting(req, res) {
    try {
      const { id } = req.params;
      const deleted = await MeetingService.deleteMeeting(id);

      if (!deleted) {
        return ApiResponse.error(res, "Meeting not found", 404);
      }

      return ApiResponse.success(res, null, "Meeting deleted successfully");
    } catch (error) {
      console.error("Delete meeting error:", error);
      return ApiResponse.error(res, "Failed to delete meeting", 500);
    }
  }

  // GET /api/meetings/archived - Get archived meetings
  static async getArchivedMeetings(req, res) {
    try {
      const archivedMeetings = await Meeting.findAll({
        where: { IsDeleted: true },
        order: [["ModifiedDate", "DESC"]],
      });

      const formatted = archivedMeetings.map((meeting) => ({
        id: meeting.Id,
        meetingName: meeting.MeetingName,
        createdBy: meeting.CreatedBy,
        createDate: meeting.CreateDate,
        archivedDate: meeting.ModifiedDate,
        emailAlert: meeting.EmailAlert,
        smsAlert: meeting.SmsAlert,
      }));

      return ApiResponse.success(res, formatted, "Archived meetings fetched");
    } catch (error) {
      return ApiResponse.error(res, "Failed to fetch archived meetings", 500);
    }
  }

  static async archiveMeeting(req, res) {
    try {
      const { id } = req.params;
      console.log(`🗃️ Archiving meeting ID: ${id}`);

      // Update Meeting IsDeleted = true
      await Meeting.update(
        {
          IsDeleted: true,
          ModifiedDate: new Date(),
          ModifiedBy: req.user?.username || "System",
        },
        { where: { Id: id } }
      );

      // Update all MeetingUsers IsDeleted = true
      await MeetingUser.update(
        {
          IsDeleted: true,
          ModifiedDate: new Date(),
          ModifiedBy: req.user?.username || "System",
        },
        { where: { MeetingID: id } }
      );

      return ApiResponse.success(res, null, "Meeting archived successfully");
    } catch (error) {
      console.error("Archive meeting error:", error);
      return ApiResponse.error(res, "Failed to archive meeting", 500);
    }
  }

  // MeetingUserController.js me sirf ye function replace karo
  static async sendAlertForMeeting(req, res) {
    try {
      const meetingIds =
        req.body.meetingIds || req.query.meetingIds || req.query.Id;
      if (!meetingIds) {
        return ApiResponse.error(res, "Please provide meeting IDs", 400);
      }

      const result = await alertService.sendAlertForMeetings(meetingIds);
      return ApiResponse.success(
        res,
        result.data,
        `Updated ${result.updatedCount} users from ${meetingIds.length} meetings`,
        200
      );
    } catch (error) {
      return ApiResponse.error(res, `Send alert failed: ${error.message}`, 500);
    }
  }
}

export default MeetingController;
