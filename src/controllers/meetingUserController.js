import MeetingUserService from "../services/meetingUserService.js";
import { isValidateMeetingUser } from "../utils/meetingUserUtils.js";
import ApiResponse from "../utils/response.js";

class MeetingUserController {
  // Create bulk meeting user
  // AY
  static async createMeetingUser(req, res) {
    try {
      const usersData = req.body;

      const { valid, errors } = isValidateMeetingUser(usersData);

      if (!valid) {
        return ApiResponse.error(
          res,
          `Validation failed: ${errors.join(", ")}`,
          400
        );
      }

      const createdUsers = await MeetingUserService.createMeetingUsers(
        usersData
      );

      return ApiResponse.success(
        res,
        createdUsers,
        "Meeting users created successfully",
        201
      );
    } catch (error) {
      console.error("Controller error:", error.message);
      return ApiResponse.error(
        res,
        error.message || "Failed to create meeting users",
        500
      );
    }
  }

  // Get all meeting user paginated,filter,search,sort
  // AY
  static async getPaginatedMeetingUsers(req, res) {
    const {
      page = 1,
      pageSize = 10,
      search = "",
      meetingId,
      sortBy = "DepartureDateTime",
      sortOrder = "DESC",
      meetingName,
      emailId,
      status,
      state,
      departureFlightNumber,
      departureDateTime,
      arrivalDateTime,
      originAirport,
      destinationAirport,
      fullName,
      attendeeType,
      phoneNumber,
      carrierName,
      createdBy,
    } = req.query;

    // Parse and validate once
    const parsedPage = parseInt(page) || 1;
    const parsedPageSize = Math.min(parseInt(pageSize) || 10, 100);
    const parsedMeetingId = meetingId ? parseInt(meetingId) : null;

    try {
      const result = await MeetingUserService.getPaginatedMeetingUsers({
        page: parsedPage,
        pageSize: parsedPageSize,
        search: search.trim(),
        meetingId: parsedMeetingId,
        sortBy,
        sortOrder: sortOrder.toUpperCase(),
        filters: {
          meetingName,
          emailId,
          status,
          state,
          departureFlightNumber,
          departureDateTime,
          arrivalDateTime,
          originAirport,
          destinationAirport,
          fullName,
          attendeeType,
          phoneNumber,
          carrierName,
          createdBy,
        },
      });

      return ApiResponse.success(
        res,
        result,
        "Meeting users fetched successfully"
      );
    } catch (error) {
      return ApiResponse.error(res, "Failed to fetch meeting users", 500);
    }
  }

  // Get meeting user by id
  // AY
  static async getMeetingUserById(req, res) {
    const { id } = req.params;
    const userId = parseInt(id);

    if (!id || isNaN(userId) || userId <= 0) {
      return ApiResponse.error(res, "Invalid user ID", 400);
    }

    try {
      const meetingUser = await MeetingUserService.getMeetingUserById(userId);

      return meetingUser
        ? ApiResponse.success(res, meetingUser, "Meeting user found")
        : ApiResponse.error(res, "Meeting user not found", 404);
    } catch (error) {
      return ApiResponse.error(res, "Failed to fetch meeting user", 500);
    }
  }

  // Get meeting user by meeting id
  // AY
  static async getMeetingUsersByMeetingId(req, res) {
    const { meetingId } = req.params;
    const parsedMeetingId = parseInt(meetingId);

    // Validate meeting ID
    if (!meetingId || isNaN(parsedMeetingId) || parsedMeetingId <= 0) {
      return ApiResponse.error(res, "Invalid meeting ID", 400);
    }

    try {
      const users = await MeetingUserService.getMeetingUsersByMeetingId(
        parsedMeetingId
      );

      return ApiResponse.success(
        res,
        { users, total: users.length },
        "Meeting users fetched successfully"
      );
    } catch (error) {
      console.error("❌ Controller error:", error);
      return ApiResponse.error(res, "Failed to fetch meeting users", 500);
    }
  }

  // Update meeting user
  // AY
  static async updateMeetingUsers(req, res) {
    try {
      const { meetingId, users } = req.body;
      if (!meetingId || !users || !Array.isArray(users)) {
        return ApiResponse.error(res, "Invalid input", 400);
      }

      const result = await MeetingUserService.updateMeetingUser(
        meetingId,
        users
      );
      return ApiResponse.success(res, result, "Success", 200);
    } catch (error) {
      return error.missingIds
        ? ApiResponse.error(
            res,
            `Attendee Not Found: IDs ${error.missingIds.join(", ")} not found`,
            404,
            { missingIds: error.missingIds }
          )
        : ApiResponse.error(res, error.message, 500);
    }
  }
}

export default MeetingUserController;
