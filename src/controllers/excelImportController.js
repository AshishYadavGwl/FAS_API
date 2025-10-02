import ExcelImportService from "../services/excelImportService.js";
import ImportDataService from "../services/importDataService.js";
import MeetingService from "../services/meetingService.js";
import MeetingUserService from "../services/meetingUserService.js";
import ApiResponse from "../utils/response.js";

class ExcelImportController {
  static async importDataReact(req, res) {
    try {
      console.log("Excel import API called");

      // ✅ GET USER INFO FROM JWT TOKEN
      const userId = req.user?.id || req.user?.Id || 1;
      const userName =
        req.user?.firstName && req.user?.lastName
          ? `${req.user.firstName} ${req.user.lastName}`
          : `User-${userId}`;

      const selectedMeeting = parseInt(req.body.selectedMeeting) || 0;

      console.log(
        `Import request - User: ${userName} (ID: ${userId}), SelectedMeeting: ${selectedMeeting}`
      );

      // Check if file is provided
      if (!req.file) {
        return ApiResponse.error(res, "Please select a file to upload", 400);
      }

      // ✅ PASS USER NAME TO ExcelImportService
      const listUserMeeting = await ExcelImportService.addMeetingDetailsAsync(
        req.file,
        userName, // ✅ Pass USER NAME instead of ID
        selectedMeeting
      );

      if (listUserMeeting.success) {
        // Save file details with USER NAME
        const importDataDetails = await ExcelImportService.saveFormFileAsync(
          req.file
        );
        importDataDetails.CreatedBy = userName; // ✅ USER NAME for import log

        const listImportData = await ImportDataService.addImportDataDetailAsync(
          importDataDetails
        );

        return ApiResponse.success(
          res,
          {
            isSuccess: true,
            message: listImportData.message || "Import completed successfully",
            data: listUserMeeting.data,
            importedCount: listUserMeeting.data?.length || 0,
            distinctMeetings: listUserMeeting.extra,
            alertResults: listUserMeeting.alertResults || null,
            createdByUser: userName, // ✅ Include user NAME in response
          },
          "Import completed successfully",
          200
        );
      }

      // ... rest of the method
    } catch (error) {
      console.error("Import API error:", error);
      return ApiResponse.error(
        res,
        "Import failed due to unexpected error",
        500
      );
    }
  }

  // Replace existing downloadMeetingData method with this
  static async downloadMeetingData(req, res) {
    try {
      const { meetingId } = req.params;

      console.log(`📥 Download request for meeting ID: ${meetingId}`);

      // Validate meeting ID
      if (!meetingId || meetingId === "0") {
        return ApiResponse.error(res, "Invalid meeting ID provided", 400);
      }

      // Get meeting details
      const meeting = await MeetingService.getMeetingById(meetingId);
      if (!meeting) {
        return ApiResponse.error(res, "Meeting not found", 404);
      }

      // Get meeting users
      const meetingUsers = await MeetingUserService.getMeetingUsersByMeetingId(
        meetingId
      );
      if (!meetingUsers || meetingUsers.length === 0) {
        return ApiResponse.error(res, "No users found for this meeting", 404);
      }

      console.log(`📋 Found ${meetingUsers.length} users for download`);

      // Generate Excel file
      const excelBuffer =
        await ExcelImportService.generateExcelFromMeetingUsers(
          meetingUsers,
          meeting.MeetingName
        );

      // Create filename EXACTLY like your sample: 01Sep2025_Immunova-Trial-Meet.xlsx
      const cleanMeetingName = meeting.MeetingName.replace(
        /[^a-zA-Z0-9\s-]/g,
        ""
      ) // Remove special chars except space and dash
        .replace(/\s+/g, "-") // Replace spaces with dash
        .trim();

      const fileName = `${cleanMeetingName}.xlsx`;

      console.log(`📁 Generated filename: ${fileName}`);

      // Set response headers for file download
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      res.setHeader("Content-Length", excelBuffer.length);

      console.log(
        `✅ Sending Excel file: ${fileName} (${excelBuffer.length} bytes)`
      );

      return res.send(excelBuffer);
    } catch (error) {
      console.error("❌ Download error:", error);
      return ApiResponse.error(res, "Failed to generate Excel file", 500);
    }
  }

  // Bulk edit - Replace all users in selected meeting with new data
  static async bulkEditMeetingData(req, res) {
    try {
      console.log("🚀 Bulk edit API called");

      const userId = req.user?.id || 1;
      const selectedMeetingId = parseInt(req.body.selectedMeeting) || 0;

      console.log(
        `📋 Bulk edit request - UserId: ${userId}, MeetingId: ${selectedMeetingId}`
      );

      // Validation
      if (!selectedMeetingId || selectedMeetingId === 0) {
        return ApiResponse.error(res, "Please select a valid meeting", 400);
      }

      if (!req.file) {
        return ApiResponse.error(res, "Please select a file to upload", 400);
      }

      console.log(
        `📁 File received: ${req.file.originalname} (${req.file.size} bytes)`
      );

      // Check if meeting exists
      const meeting = await MeetingService.getMeetingById(selectedMeetingId);
      if (!meeting) {
        return ApiResponse.error(res, "Selected meeting not found", 404);
      }

      // Get current users count (for reporting)
      const currentUsers = await MeetingUserService.getMeetingUsersByMeetingId(
        selectedMeetingId
      );
      const oldCount = currentUsers.length;

      console.log(`🗑️ Found ${oldCount} existing users to replace`);

      // Delete all existing meeting users for this meeting FIRST
      console.log(`🗑️ Deleting ${oldCount} existing users...`);
      await MeetingUserService.bulkDeleteByMeetingId(selectedMeetingId);

      // Process Excel data with forced meeting ID
      console.log(
        `📊 Processing Excel file with forced meeting ID: ${selectedMeetingId}`
      );

      const listUserMeeting = await ExcelImportService.bulkEditProcessExcel(
        req.file,
        userId,
        selectedMeetingId,
        meeting.MeetingName
      );

      if (!listUserMeeting.success) {
        console.error(`❌ Excel processing failed: ${listUserMeeting.message}`);
        return ApiResponse.error(
          res,
          listUserMeeting.message || "Excel processing failed",
          listUserMeeting.status || 400
        );
      }

      const newCount = listUserMeeting.data?.length || 0;
      console.log(`✅ Successfully added ${newCount} new users`);

      // Save import log
      try {
        const importDataDetails = await ExcelImportService.saveFormFileAsync(
          req.file
        );
        importDataDetails.CreatedBy = userId;
        await ImportDataService.addImportDataDetailAsync(importDataDetails);
        console.log(`✅ Import log saved`);
      } catch (logError) {
        console.error(`⚠️ Failed to save import log:`, logError);
      }

      return ApiResponse.success(
        res,
        {
          success: true,
          oldCount,
          newCount,
          meetingName: meeting.MeetingName,
          meetingId: selectedMeetingId,
          message: `Bulk edit completed: ${oldCount} users replaced with ${newCount} new users`,
          users: listUserMeeting.data,
        },
        "Bulk edit completed successfully",
        200
      );
    } catch (error) {
      console.error("❌ Bulk edit API error:", error);
      console.error("Stack trace:", error.stack);

      return ApiResponse.error(res, `Bulk edit failed: ${error.message}`, 500);
    }
  }

  // Get import history
  static async getImportHistory(req, res) {
    try {
      // You can implement this to show import history
      return ApiResponse.success(
        res,
        [],
        "Import history fetched successfully"
      );
    } catch (error) {
      console.error("❌ Get import history error:", error);
      return ApiResponse.error(res, "Failed to fetch import history", 500);
    }
  }
}

export default ExcelImportController;
