import alertService from "../services/alertService.js";
import MeetingUserService from "../services/meetingUserService.js";
import { isValidateMeetingUser } from "../utils/meetingUserUtils.js";
import ApiResponse from "../utils/response.js";

class MeetingUserController {
  // Create bulk meeting user
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

  // Helper function to format exact response as per requirement
  static formatMeetingUserResponse(meetingUser) {
    return {
      id: meetingUser.Id,
      meetingID: meetingUser.MeetingID,
      meetingName: meetingUser.meeting
        ? meetingUser.meeting.MeetingName
        : `Meeting ${meetingUser.MeetingID}`, // Fallback if meeting is deleted
      fullName:
        meetingUser.FirstName && meetingUser.LastName
          ? `${meetingUser.FirstName} ${meetingUser.LastName}`
          : meetingUser.FirstName || meetingUser.LastName || "Unknown User",
      emailId: meetingUser.EmailId,
      phoneNumber: meetingUser.PhoneNumber,
      attendeeType: meetingUser.AttendeeType,
      departureAirline: meetingUser.DepartureAirline,
      arrivalAirline: meetingUser.ArrivalAirline,
      departureFlightNumber: meetingUser.DepartureFlightNumber,
      arrivalFlightNumber: meetingUser.ArrivalFlightNumber,
      departureDateTime: meetingUser.DepartureDateTime,
      arrivalDateTime: meetingUser.ArrivalDateTime,
      originAirport: meetingUser.OriginAirport,
      destinationAirport: meetingUser.DestinationAirport,
      createdBy: meetingUser.CreatedBy,
      createDate: meetingUser.CreateDate,
      carrierCode: meetingUser.CarrierCode,
      codeType: meetingUser.CodeType,
      flightType: meetingUser.FlightType,
      flightLabel: meetingUser.FlightLabel,
      flightStatus: meetingUser.Status || null, // Use Status field for flightStatus
      lastSyncDateTime: meetingUser.LastSyncDateTime,
      state: meetingUser.State,
      firstName: meetingUser.FirstName, // Keep as separate field too
      lastName: meetingUser.LastName, // Keep as separate field too
      carrierName: meetingUser.CarrierName,
    };
  }

  // GET /api/meetingusers - Get all meeting users
  static async getAllMeetingUsers(req, res) {
    try {
      console.log("🔍 Getting all meeting users...");

      const meetingUsers = await MeetingUserService.getAllMeetingUsers(true);

      console.log(`✅ Found ${meetingUsers.length} meeting users`);

      const formattedMeetingUsers = meetingUsers.map((mu) =>
        MeetingUserController.formatMeetingUserResponse(mu)
      );

      return ApiResponse.success(
        res,
        formattedMeetingUsers,
        "Meeting users fetched successfully"
      );
    } catch (error) {
      console.error("❌ Controller getAllMeetingUsers error:", error);
      return ApiResponse.error(res, "Failed to fetch meeting users", 500);
    }
  }

  // GET /api/meetingusers/:id - Get single meeting user
  static async getMeetingUserById(req, res) {
    try {
      const { id } = req.params;
      console.log(`🔍 Getting meeting user with ID: ${id}`);

      const meetingUser = await MeetingUserService.getMeetingUserById(id);

      if (!meetingUser) {
        return ApiResponse.error(res, "Meeting user not found", 404);
      }

      const formattedMeetingUser =
        MeetingUserController.formatMeetingUserResponse(meetingUser);

      return ApiResponse.success(
        res,
        formattedMeetingUser,
        "Meeting user found"
      );
    } catch (error) {
      console.error("❌ Controller getMeetingUserById error:", error);
      return ApiResponse.error(res, "Failed to fetch meeting user", 500);
    }
  }

  // GET /api/meetingusers/meeting/:meetingId - Get users by meeting ID (Enhanced)
  static async getMeetingUsersByMeetingId(req, res) {
    try {
      const { meetingId } = req.params;

      console.log(`🔍 Controller: Raw meetingId parameter: '${meetingId}'`);

      // ✅ Enhanced parsing with better validation
      let meetingIdNumber;

      // Handle different empty/null cases
      if (
        meetingId === undefined ||
        meetingId === null ||
        meetingId === "" ||
        meetingId === "0"
      ) {
        meetingIdNumber = 0; // Get all users
      } else {
        meetingIdNumber = parseInt(meetingId, 10); // Explicit radix 10

        // ✅ Better NaN handling
        if (isNaN(meetingIdNumber) || meetingIdNumber < 0) {
          console.log(
            `❌ Invalid meetingId: '${meetingId}' -> NaN or negative`
          );
          return ApiResponse.error(
            res,
            `Invalid meeting ID: '${meetingId}'. Expected positive number or 0 for all users.`,
            400
          );
        }
      }

      console.log(`🔢 Parsed meetingId as number: ${meetingIdNumber}`);

      const meetingUsers = await MeetingUserService.getMeetingUsersByMeetingId(
        meetingIdNumber
      );

      const formattedMeetingUsers = meetingUsers.map((mu) =>
        MeetingUserController.formatMeetingUserResponse(mu)
      );

      // ✅ Enhanced message with better formatting
      const message =
        meetingIdNumber === 0
          ? `Found ${formattedMeetingUsers.length} total meeting users (all meetings)`
          : `Found ${formattedMeetingUsers.length} users for meeting ID ${meetingIdNumber}`;

      console.log(`✅ ${message}`);

      return ApiResponse.success(res, formattedMeetingUsers, message);
    } catch (error) {
      console.error("❌ Controller getMeetingUsersByMeetingId error:", error);

      // ✅ Enhanced error handling
      if (error.name === "SequelizeDatabaseError") {
        return ApiResponse.error(res, "Database query failed", 500);
      }

      return ApiResponse.error(res, "Failed to fetch meeting users", 500);
    }
  }

  // PUT /api/meetingusers/:id - Update meeting user
  static async updateMeetingUser(req, res) {
    try {
      const { id } = req.params;
      console.log(`🔄 Updating meeting user ID: ${id}`);

      const updateData = { ...req.body };

      // Convert camelCase to PascalCase for database
      const mappedData = {};
      Object.keys(updateData).forEach((key) => {
        const dbKey = key.charAt(0).toUpperCase() + key.slice(1);
        mappedData[dbKey] = updateData[key];
      });

      const updatedMeetingUser = await MeetingUserService.updateMeetingUser(
        id,
        mappedData
      );

      if (!updatedMeetingUser) {
        return ApiResponse.error(res, "Meeting user not found", 404);
      }
      // await flightAlertService.createAlertsForUsers(id);
      // Get updated user with meeting details
      const updatedUser = await MeetingUserService.getMeetingUserById(id);
      const responseData =
        MeetingUserController.formatMeetingUserResponse(updatedUser);

      return ApiResponse.success(
        res,
        responseData,
        "Meeting user updated successfully"
      );
    } catch (error) {
      console.error("❌ Controller updateMeetingUser error:", error);
      return ApiResponse.error(res, "Failed to update meeting user", 500);
    }
  }

  // DELETE /api/meetingusers/:id - Delete meeting user
  static async deleteMeetingUser(req, res) {
    try {
      const { id } = req.params;
      console.log(`🗑️ Deleting meeting user ID: ${id}`);

      const deleted = await MeetingUserService.deleteMeetingUser(id);

      if (!deleted) {
        return ApiResponse.error(res, "Meeting user not found", 404);
      }

      return ApiResponse.success(
        res,
        null,
        "Meeting user deleted successfully"
      );
    } catch (error) {
      console.error("❌ Controller deleteMeetingUser error:", error);
      return ApiResponse.error(res, "Failed to delete meeting user", 500);
    }
  }

  static async getArchivedMeetingUsers(req, res) {
    try {
      const { meetingId } = req.params;

      console.log(
        `🗃️ Controller: Getting archived users with meetingId: '${meetingId}'`
      );

      // ✅ Input validation
      const meetingIdNumber = parseInt(meetingId, 10);

      if (isNaN(meetingIdNumber) || meetingIdNumber < 0) {
        console.log(`❌ Invalid meetingId: '${meetingId}' -> NaN or negative`);
        return ApiResponse.error(
          res,
          `Invalid meeting ID: '${meetingId}'. Expected positive number or 0 for all archived users.`,
          400
        );
      }

      console.log(
        `🔢 Using meetingId: ${meetingIdNumber} (${
          meetingIdNumber === 0 ? "ALL ARCHIVED" : "SPECIFIC MEETING"
        })`
      );

      // ✅ Single service call with conditional parameter
      const archivedMeetingUsers =
        await MeetingUserService.getArchivedMeetingUsers(meetingIdNumber);

      console.log(
        `✅ Found ${archivedMeetingUsers.length} archived meeting users`
      );

      // ✅ Format response exactly as per your sample
      const formattedArchivedUsers = archivedMeetingUsers.map((mu) =>
        MeetingUserController.formatMeetingUserResponse(mu)
      );

      // ✅ Dynamic message based on meetingId
      const message =
        meetingIdNumber === 0
          ? `Found ${formattedArchivedUsers.length} total archived meeting users (all meetings)`
          : `Found ${formattedArchivedUsers.length} archived users for meeting ID ${meetingIdNumber}`;

      console.log(`✅ ${message}`);

      return ApiResponse.success(res, formattedArchivedUsers, message);
    } catch (error) {
      console.error("❌ Controller getArchivedMeetingUsers error:", error);

      // ✅ Enhanced error handling
      if (error.name === "SequelizeDatabaseError") {
        return ApiResponse.error(res, "Database query failed", 500);
      }

      return ApiResponse.error(
        res,
        "Failed to fetch archived meeting users",
        500
      );
    }
  }

  // MeetingUserController.js me sirf ye function replace karo
  static async sendAlertForUsers(req, res) {
    try {
      const userIds = req.body.userIds || req.query.userIds || req.query.Id;
      if (!userIds) {
        return ApiResponse.error(res, "Please provide user IDs", 400);
      }

      const result = await alertService.sendAlertForUsers(userIds);
      return ApiResponse.success(
        res,
        result.data,
        `Updated ${result.updatedCount} users`,
        200
      );
    } catch (error) {
      return ApiResponse.error(res, `Send alert failed: ${error.message}`, 500);
    }
  }

  // GET /api/meetingusers/paginated
  static async getPaginatedMeetingUsers(req, res) {
    try {
      console.log("🔍 Getting paginated meeting users...");
      console.log("Query params:", req.query);

      const {
        page = 1,
        pageSize = 10,
        search = "",
        meetingId = null,
        sortBy = "DepartureDateTime",
        sortOrder = "DESC",
        // 14 filter columns
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

      const result = await MeetingUserService.getPaginatedMeetingUsers({
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        search: search.trim(),
        meetingId: meetingId ? parseInt(meetingId) : null,
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

      console.log(`✅ Found ${result.pagination.totalRecords} total records`);

      return ApiResponse.success(
        res,
        result,
        "Meeting users fetched successfully"
      );
    } catch (error) {
      console.error("❌ Controller getPaginatedMeetingUsers error:", error);
      console.error("Error stack:", error.stack);
      return ApiResponse.error(
        res,
        `Failed to fetch meeting users: ${error.message}`,
        500
      );
    }
  }
}

export default MeetingUserController;
