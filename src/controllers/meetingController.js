import MeetingService from "../services/meetingService.js";
import ApiResponse from "../utils/response.js";

class MeetingController {
  // Create meeting
  // AY
  static async createMeeting(req, res) {
    const { meetingName, createdBy, emailAlert, smsAlert } = req.body;

    // Validate required fields
    if (!meetingName?.trim() || !createdBy) {
      return ApiResponse.error(
        res,
        "Meeting name and creator are required",
        400
      );
    }

    try {
      const meeting = await MeetingService.createMeeting({
        MeetingName: meetingName.trim(),
        CreatedBy: createdBy,
        EmailAlert: emailAlert || false,
        SmsAlert: smsAlert || false,
        CreateDate: new Date(),
      });

      return ApiResponse.success(
        res,
        meeting,
        "Meeting created successfully",
        201
      );
    } catch (error) {
      return ApiResponse.error(res, "Failed to create meeting", 500);
    }
  }

  // Get paginated meetings with search, filter, sort
  // AY
  static async getPaginatedMeetings(req, res) {
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

    try {
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
      return ApiResponse.error(res, "Failed to fetch meetings", 500);
    }
  }

  // Get all meetings
  // AY
  static async getAllMeetings(req, res) {
    try {
      const meetings = await MeetingService.getAllMeetings();
      return ApiResponse.success(
        res,
        meetings,
        "Meetings fetched successfully"
      );
    } catch (error) {
      return ApiResponse.error(res, "Failed to fetch meetings", 500);
    }
  }
}

export default MeetingController;
