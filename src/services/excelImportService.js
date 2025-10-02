import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";
import MeetingUserService from "./meetingUserService.js";
import MeetingService from "./meetingService.js";
import FlightAlertService from "./flightAlertService.js"; // ✅ ONLY Alert creation

class ExcelImportService {
  // Required columns mapping (as per your Excel format)
  static requiredColumns = [
    "MeetingName",
    "FirstName",
    "LastName",
    "EmailId",
    "PhoneNumber",
    "AttendeeType",
    "CarrierCode",
    "DepartureFlightNumber",
    "DepartureDateTime",
    "ArrivalDateTime",
    "OriginAirport",
    "DestinationAirport",
    "FlightType",
  ];

  // Main import function - equivalent to AddMeetingDetailsAsync
  static async addMeetingDetailsAsync(file, userId, selectedMeetingID) {
    try {
      console.log("🚀 Starting Excel import process...");

      const { listMeetingUser, errorMessage } =
        await this.extractDataFromExcelAsync(file, userId, selectedMeetingID);

      if (errorMessage) {
        return {
          message: errorMessage,
          status: 400,
          success: false,
        };
      }

      console.log(`📊 Processing ${listMeetingUser.length} meeting users...`);

      // Get distinct meeting IDs
      const distinctMeetingIds = [
        ...new Set(listMeetingUser.map((mu) => mu.MeetingID)),
      ];

      // Bulk insert meeting users
      const insertResult = await this.bulkInsertMeetingUsers(listMeetingUser);

      // ✅ SIMPLE ALERT CREATION ONLY
      if (insertResult.status === 200 && insertResult.data.length > 0) {
        try {
          console.log(
            `🎯 Creating alerts for ${insertResult.data.length} users...`
          );

          const userIds = insertResult.data.map((user) => user.Id || user.id);
          const alertResult = await this.createSimpleAlerts(
            userIds,
            insertResult.data
          );

          insertResult.alertResults = alertResult;
        } catch (alertError) {
          console.error("⚠️ Alert creation error:", alertError.message);
          insertResult.alertResults = {
            success: false,
            alertsCreated: 0,
            alertsFailed: insertResult.data.length,
            errors: [{ error: alertError.message }],
          };
        }
      }

      return {
        message: insertResult.message,
        status: insertResult.status,
        success: true,
        data: insertResult.data,
        extra: distinctMeetingIds,
        alertResults: insertResult.alertResults || null,
      };
    } catch (error) {
      console.error("❌ Error in addMeetingDetailsAsync:", error);
      return {
        message: "Import failed due to unexpected error",
        status: 500,
        success: false,
      };
    }
  }

  // ✅ SIMPLE ALERT CREATION FOR IMPORTED USERS
  static async createSimpleAlerts(userIds, userData) {
    const results = {
      success: true,
      alertsCreated: 0,
      alertsFailed: 0,
      errors: [],
    };

    try {
      for (let i = 0; i < userIds.length; i++) {
        const userId = userIds[i];
        const user = userData[i];

        try {
          // Create alert for individual user
          const alertResult = await FlightAlertService.createAlertsForUsers([
            userId,
          ]);

          if (alertResult.success && alertResult.created > 0) {
            results.alertsCreated++;

            // Get the generated AlertId and update user record
            const updatedUser = await MeetingUserService.getMeetingUserById(
              userId
            );
            if (updatedUser && updatedUser.AlertId) {
              console.log(
                `✅ Alert created for ${user.FirstName} ${user.LastName}: ${updatedUser.AlertId}`
              );
            }
          } else {
            results.alertsFailed++;
            results.errors.push({
              userId: userId,
              name: `${user.FirstName} ${user.LastName}`,
              flightNumber: user.DepartureFlightNumber,
              carrierCode: user.CarrierCode,
              departureDate: user.DepartureDateTime,
              error: alertResult.message || "Alert creation failed",
            });
          }
        } catch (individualError) {
          results.alertsFailed++;
          results.errors.push({
            userId: userId,
            name: `${user.FirstName} ${user.LastName}`,
            flightNumber: user.DepartureFlightNumber,
            carrierCode: user.CarrierCode,
            departureDate: user.DepartureDateTime,
            error: individualError.message,
          });
        }
      }

      // Set overall success based on results
      results.success = results.alertsCreated > 0;

      console.log(`📊 Alert creation completed:
        - Success: ${results.alertsCreated}
        - Failed: ${results.alertsFailed}
      `);

      return results;
    } catch (error) {
      return {
        success: false,
        alertsCreated: 0,
        alertsFailed: userIds.length,
        errors: [{ error: error.message }],
      };
    }
  }

  // Extract data from Excel - equivalent to ExtractDataFromExcelAsync
  static async extractDataFromExcelAsync(file, userId, selectedMeetingID) {
    let errorMessage = "";
    let listMeetingUser = [];

    try {
      console.log("📋 Starting Excel data extraction...");

      // File validation
      const fileValidation = this.validateFile(file);
      if (!fileValidation.isValid) {
        return { listMeetingUser, errorMessage: fileValidation.error };
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);
      const worksheet = workbook.worksheets[0];

      // Worksheet validation
      const worksheetValidation = this.validateWorksheet(worksheet);
      if (!worksheetValidation.isValid) {
        return { listMeetingUser, errorMessage: worksheetValidation.error };
      }

      console.log(`📊 Processing ${worksheet.rowCount - 1} rows from Excel...`);

      // Process each row (starting from row 2, skipping header)
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);

        // Skip empty rows
        if (this.isRowEmpty(row)) continue;

        try {
          const meetingUser = await this.processRow(
            row,
            rowNumber,
            userId,
            selectedMeetingID
          );
          if (meetingUser) {
            listMeetingUser.push(meetingUser);
          }
        } catch (rowError) {
          console.error(
            `❌ Error processing row ${rowNumber}:`,
            rowError.message
          );
          return { listMeetingUser, errorMessage: rowError.message };
        }
      }

      console.log(
        `✅ Successfully processed ${listMeetingUser.length} meeting users`
      );
      return { listMeetingUser, errorMessage };
    } catch (error) {
      console.error("❌ Error in extractDataFromExcelAsync:", error);
      return {
        listMeetingUser,
        errorMessage: "The data provided seems invalid, Please check.",
      };
    }
  }

  // File validation
  static validateFile(file) {
    if (!file || file.size === 0) {
      return { isValid: false, error: "Please select a file to upload." };
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      return { isValid: false, error: "File size must be less than 5 MB." };
    }

    const allowedExtensions = [".xlsx", ".xls"];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error:
          "Invalid file format. Please upload an Excel file in .xlsx, .xls format.",
      };
    }

    return { isValid: true };
  }

  // Worksheet validation
  static validateWorksheet(worksheet) {
    if (!worksheet || worksheet.rowCount <= 1) {
      return {
        isValid: false,
        error: "The uploaded Excel file is empty or contains no data.",
      };
    }

    // Check headers (assuming first row contains headers)
    const headerRow = worksheet.getRow(1);
    const expectedHeaders = [
      "MeetingName",
      "FirstName",
      "LastName",
      "EmailId",
      "PhoneNumber",
      "AttendeeType",
      "CarrierCode",
      "DepartureFlightNumber",
      "DepartureDateTime",
      "ArrivalDateTime",
      "OriginAirport",
      "DestinationAirport",
      "FlightType",
    ];

    // Basic header validation (you can customize this)
    if (headerRow.cellCount < expectedHeaders.length) {
      return {
        isValid: false,
        error: "The uploaded Excel file does not contain the required columns.",
      };
    }

    return { isValid: true };
  }

  // Check if row is empty
  static isRowEmpty(row) {
    for (let colNumber = 1; colNumber <= row.cellCount; colNumber++) {
      const cell = row.getCell(colNumber);
      if (
        cell.value !== null &&
        cell.value !== undefined &&
        cell.value !== ""
      ) {
        return false;
      }
    }
    return true;
  }

  // Process individual row
  static async processRow(row, rowNumber, userId, selectedMeetingID) {
    try {
      // Extract data from row (adjust column numbers based on your Excel format)
      const meetingUser = {
        FirstName: this.getCellValue(row, 2),
        LastName: this.getCellValue(row, 3),
        EmailId: this.getCellValue(row, 4),
        PhoneNumber: this.getCellValue(row, 5),
        AttendeeType: this.getCellValue(row, 6),
        CarrierCode: this.getCellValue(row, 7),
        DepartureFlightNumber: this.getCellValue(row, 8),
        OriginAirport: this.getCellValue(row, 11),
        DestinationAirport: this.getCellValue(row, 12),
        FlightType: this.getCellValue(row, 13),
        CreatedBy: userId,
        CreateDate: new Date(),
        IsDeleted: false,
        IsActive: true,
      };

      // Date parsing
      meetingUser.DepartureDateTime = this.parseExcelDate(
        row.getCell(9),
        rowNumber,
        "Departure"
      );
      meetingUser.ArrivalDateTime = this.parseExcelDate(
        row.getCell(10),
        rowNumber,
        "Arrival"
      );

      // Validation
      this.validateMeetingUser(meetingUser, rowNumber);

      // Meeting handling
      const meetingName = this.getCellValue(row, 1);
      if (!meetingName) {
        throw new Error(
          `The MeetingName field cannot be null or empty. Please check Row No. ${rowNumber}.`
        );
      }

      // Get or create meeting
      const meeting = await this.getOrCreateMeeting(
        meetingName,
        userId,
        selectedMeetingID
      );
      meetingUser.MeetingID = meeting.Id;

      // Process carrier code if provided
      if (meetingUser.CarrierCode) {
        meetingUser.CarrierCode = this.processCarrierCode(
          meetingUser.CarrierCode
        );
      }

      return meetingUser;
    } catch (error) {
      throw error;
    }
  }

  // Get cell value safely
  static getCellValue(row, columnNumber) {
    const cell = row.getCell(columnNumber);
    return cell.value ? String(cell.value).toString() : null;
  }

  // Parse Excel date
  static parseExcelDate(cell, rowNumber, dateType) {
    try {
      if (!cell.value) {
        return new Date(); // Default to current date if empty
      }

      // If it's already a Date object
      if (cell.value instanceof Date) {
        return cell.value;
      }

      // If it's a string, try to parse
      if (typeof cell.value === "string") {
        const parsedDate = new Date(cell.value);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }

      // If it's a number (Excel serial date)
      if (typeof cell.value === "number") {
        // Excel serial date conversion
        const excelEpoch = new Date(1900, 0, 1);
        const days = cell.value - 1; // Excel counts from 1, not 0
        return new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
      }

      throw new Error(
        `${dateType} date is not valid. Please check Row No. ${rowNumber}.`
      );
    } catch (error) {
      throw new Error(
        `${dateType} date is not valid. Please check Row No. ${rowNumber}.`
      );
    }
  }

  // Validate meeting user data
  static validateMeetingUser(meetingUser, rowNumber) {
    // Email validation
    if (meetingUser.EmailId && !this.validateEmail(meetingUser.EmailId)) {
      throw new Error(
        `Invalid email format. Please check Row No. ${rowNumber}.`
      );
    }

    // Phone validation
    if (
      meetingUser.PhoneNumber &&
      !this.validatePhoneNumber(meetingUser.PhoneNumber)
    ) {
      throw new Error(
        `Invalid Phone Number. Please check Row No. ${rowNumber}.`
      );
    }

    // Required field validation
    if (!meetingUser.FirstName || !meetingUser.LastName) {
      throw new Error(
        `FirstName and LastName are required. Please check Row No. ${rowNumber}.`
      );
    }

    if (!meetingUser.EmailId && !meetingUser.PhoneNumber) {
      throw new Error(
        `Either EmailId or PhoneNumber is required. Please check Row No. ${rowNumber}.`
      );
    }
  }

  // Email validation
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Phone validation
  static validatePhoneNumber(phone) {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,15}$/;
    return phoneRegex.test(phone);
  }

  // Get or create meeting
  static async getOrCreateMeeting(meetingName, userId, selectedMeetingID) {
    try {
      // Try to find existing meeting by name
      const existingMeetings = await MeetingService.searchMeetingsByName(
        meetingName
      );

      if (existingMeetings && existingMeetings.length > 0) {
        return existingMeetings[0];
      }

      // Create new meeting if not found
      const newMeeting = await MeetingService.createMeeting({
        MeetingName: meetingName,
        CreatedBy: userId,
        CreateDate: new Date(),
        IsActive: true,
        IsDeleted: false,
        EmailAlert: false,
        SmsAlert: false,
      });

      return newMeeting;
    } catch (error) {
      console.error("❌ Error in getOrCreateMeeting:", error);
      throw new Error("Failed to process meeting information");
    }
  }

  // Process carrier code (implement your carrier code logic)
  static processCarrierCode(carrierCode) {
    // Add your carrier code processing logic here
    // This is equivalent to GeneralFunctions.GetCarriercode(carriercode) in C#
    return carrierCode.toUpperCase(); // Simple example
  }

  // Bulk insert meeting users - equivalent to BulkInsert
  static async bulkInsertMeetingUsers(meetingUsers) {
    try {
      console.log(
        `💾 Starting bulk insert of ${meetingUsers.length} meeting users...`
      );

      const insertedUsers = [];

      // Insert each user (you can optimize this later with actual bulk insert)
      for (const meetingUser of meetingUsers) {
        try {
          const inserted = await MeetingUserService.createMeetingUser(
            meetingUser
          );
          insertedUsers.push(inserted);
        } catch (error) {
          console.error("❌ Error inserting meeting user:", error);
          // Continue with other users even if one fails
        }
      }

      return {
        message: "Records added successfully.",
        status: 200,
        data: insertedUsers,
      };
    } catch (error) {
      console.error("❌ Error in bulkInsertMeetingUsers:", error);
      return {
        message: "Bulk insert failed",
        status: 500,
        data: [],
      };
    }
  }

  // Save uploaded file - equivalent to SaveFormFileAsync
  static async saveFormFileAsync(file) {
    try {
      const fileExt = path.extname(file.originalname);
      const fileNameWithoutExt = path
        .basename(file.originalname, fileExt)
        .replace(/\s+/g, "")
        .replace(/'/g, "_");

      const timestamp = new Date()
        .toISOString()
        .replace(/[-T:.Z]/g, "")
        .slice(0, 14);
      const fileName = `${fileNameWithoutExt}_${timestamp}${fileExt}`;

      const folderPath = path.join(process.cwd(), "public", "ImportData");

      // Create directory if it doesn't exist
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const filePath = path.join(folderPath, fileName);

      // Save file
      fs.writeFileSync(filePath, file.buffer);

      return {
        FileName: fileName,
        FileFullPath: filePath,
        CreatedBy: null, // Will be set by caller
        CreateDate: new Date(),
      };
    } catch (error) {
      console.error("❌ Error saving file:", error);
      throw new Error("Failed to save uploaded file");
    }
  }

  // Generate Excel file from meeting users data
  static async generateExcelFromMeetingUsers(meetingUsers, meetingName) {
    try {
      console.log(`📊 Generating Excel for ${meetingUsers.length} users`);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Meetings");

      // Define headers - EXACTLY as your sample file
      const headers = [
        "MeetingName",
        "FirstName",
        "LastName",
        "EmailId",
        "PhoneNumber",
        "AttendeeType",
        "CarrierCode",
        "FlightNumber", // Changed from DepartureFlightNumber
        "DepartureDateTime",
        "ArrivalDateTime",
        "OriginAirport",
        "DestinationAirport",
        "FlightLabel", // Added
        "ID", // Added
      ];

      // Add header row
      worksheet.addRow(headers);

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      // Add data rows - EXACTLY matching your format
      meetingUsers.forEach((user) => {
        worksheet.addRow([
          meetingName,
          user.FirstName || "",
          user.LastName || "",
          user.EmailId || "",
          user.PhoneNumber || "",
          user.AttendeeType || "",
          user.CarrierCode || "",
          user.DepartureFlightNumber || "", // Maps to FlightNumber column
          user.DepartureDateTime
            ? this.formatDateForExcelSample(user.DepartureDateTime)
            : "",
          user.ArrivalDateTime
            ? this.formatDateForExcelSample(user.ArrivalDateTime)
            : "",
          user.OriginAirport || "",
          user.DestinationAirport || "",
          user.FlightType || "", // Maps to FlightLabel
          user.Id || "", // Add ID column
        ]);
      });

      // Auto-fit columns
      worksheet.columns.forEach((column) => {
        const lengths = column.values.map((v) => (v ? v.toString().length : 0));
        const maxLength = Math.max(
          ...lengths.filter((v) => typeof v === "number")
        );
        column.width = Math.min(Math.max(maxLength + 2, 12), 50);
      });

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;
    } catch (error) {
      console.error("❌ Error generating Excel:", error);
      throw new Error("Failed to generate Excel file");
    }
  }

  // Updated date formatter - EXACTLY as your sample: 2025-09-01 155959
  static formatDateForExcelSample(dateValue) {
    if (!dateValue) return "";

    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return dateValue.toString();

      // Format: 2025-09-01 155959 (no colons in time part)
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      const hh = String(date.getHours()).padStart(2, "0");
      const min = String(date.getMinutes()).padStart(2, "0");
      const ss = String(date.getSeconds()).padStart(2, "0");

      return `${yyyy}-${mm}-${dd} ${hh}${min}${ss}`;
    } catch (error) {
      return dateValue.toString();
    }
  }

  // ✅ BULK EDIT METHODS - WITH SIMPLE ALERT CREATION

  // Bulk edit specific Excel processing
  static async bulkEditProcessExcel(
    file,
    userId,
    forceMeetingId,
    forceMeetingName
  ) {
    try {
      console.log(
        `🚀 Bulk edit Excel processing for meeting ID: ${forceMeetingId}`
      );

      const { listMeetingUser, errorMessage } =
        await this.extractDataFromExcelForBulkEdit(
          file,
          userId,
          forceMeetingId,
          forceMeetingName
        );

      if (errorMessage) {
        return {
          message: errorMessage,
          status: 400,
          success: false,
        };
      }

      console.log(
        `📊 Processing ${listMeetingUser.length} meeting users for bulk insert...`
      );

      // Bulk insert meeting users
      const insertResult = await this.bulkInsertMeetingUsers(listMeetingUser);

      // ✅ SIMPLE ALERT CREATION FOR BULK EDIT
      if (insertResult.status === 200 && insertResult.data.length > 0) {
        try {
          console.log(
            `🎯 Creating alerts for ${insertResult.data.length} bulk edit users...`
          );

          const userIds = insertResult.data.map((user) => user.Id || user.id);
          const alertResult = await this.createSimpleAlerts(
            userIds,
            insertResult.data
          );

          insertResult.alertResults = alertResult;
        } catch (alertError) {
          console.error(
            "⚠️ Bulk edit alert creation error:",
            alertError.message
          );
          insertResult.alertResults = {
            success: false,
            alertsCreated: 0,
            alertsFailed: insertResult.data.length,
            errors: [{ error: alertError.message }],
          };
        }
      }

      return {
        message: insertResult.message,
        status: insertResult.status,
        success: true,
        data: insertResult.data,
        alertResults: insertResult.alertResults || null,
      };
    } catch (error) {
      console.error("❌ Error in bulkEditProcessExcel:", error);
      return {
        message: "Bulk edit failed due to unexpected error",
        status: 500,
        success: false,
      };
    }
  }

  // Bulk edit के लिए special Excel processing
  static async extractDataFromExcelForBulkEdit(
    file,
    userId,
    forceMeetingId,
    forceMeetingName
  ) {
    let errorMessage = "";
    let listMeetingUser = [];

    try {
      console.log("📋 Starting bulk edit Excel data extraction...");

      // File validation
      const fileValidation = this.validateFile(file);
      if (!fileValidation.isValid) {
        return { listMeetingUser, errorMessage: fileValidation.error };
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);
      const worksheet = workbook.worksheets[0];

      // Worksheet validation
      const worksheetValidation = this.validateWorksheet(worksheet);
      if (!worksheetValidation.isValid) {
        return { listMeetingUser, errorMessage: worksheetValidation.error };
      }

      console.log(
        `📊 Processing ${worksheet.rowCount - 1} rows for bulk edit...`
      );

      // Process each row (starting from row 2, skipping header)
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);

        // Skip empty rows
        if (this.isRowEmpty(row)) continue;

        try {
          // Process row with forced meeting ID
          const meetingUser = await this.processRowForBulkEdit(
            row,
            rowNumber,
            userId,
            forceMeetingId
          );
          if (meetingUser) {
            listMeetingUser.push(meetingUser);
          }
        } catch (rowError) {
          console.error(
            `❌ Error processing row ${rowNumber}:`,
            rowError.message
          );
          return { listMeetingUser, errorMessage: rowError.message };
        }
      }

      console.log(
        `✅ Successfully processed ${listMeetingUser.length} meeting users for bulk edit`
      );
      return { listMeetingUser, errorMessage };
    } catch (error) {
      console.error("❌ Error in extractDataFromExcelForBulkEdit:", error);
      return {
        listMeetingUser,
        errorMessage: "The data provided seems invalid, Please check.",
      };
    }
  }

  // Update processRowForBulkEdit method in ExcelImportService.js
  static async processRowForBulkEdit(row, rowNumber, userId, forceMeetingId) {
    try {
      // Extract data from row - UPDATED column mapping to match your sample
      const meetingUser = {
        FirstName: this.getCellValue(row, 2),
        LastName: this.getCellValue(row, 3),
        EmailId: this.getCellValue(row, 4),
        PhoneNumber: this.getCellValue(row, 5),
        AttendeeType: this.getCellValue(row, 6),
        CarrierCode: this.getCellValue(row, 7),
        DepartureFlightNumber: this.getCellValue(row, 8), // FlightNumber column
        OriginAirport: this.getCellValue(row, 11),
        DestinationAirport: this.getCellValue(row, 12),
        FlightType: this.getCellValue(row, 13), // FlightLabel column
        CreatedBy: userId,
        CreateDate: new Date(),
        IsDeleted: false,
        IsActive: true,
        MeetingID: forceMeetingId,
      };

      // Parse dates from your format: 2025-09-01 155959
      meetingUser.DepartureDateTime = this.parseExcelDateSample(
        row.getCell(9),
        rowNumber,
        "Departure"
      );
      meetingUser.ArrivalDateTime = this.parseExcelDateSample(
        row.getCell(10),
        rowNumber,
        "Arrival"
      );

      // Validation
      this.validateMeetingUser(meetingUser, rowNumber);

      // Process carrier code if provided
      if (meetingUser.CarrierCode) {
        meetingUser.CarrierCode = this.processCarrierCode(
          meetingUser.CarrierCode
        );
      }

      return meetingUser;
    } catch (error) {
      throw error;
    }
  }

  // Add this new date parser for your format: 2025-09-01 155959
  static parseExcelDateSample(cell, rowNumber, dateType) {
    try {
      if (!cell.value) {
        return new Date(); // Default to current date if empty
      }

      // If it's already a Date object
      if (cell.value instanceof Date) {
        return cell.value;
      }

      // If it's a string in your format: 2025-09-01 155959
      if (typeof cell.value === "string") {
        const dateStr = cell.value.trim();

        // Parse format: 2025-09-01 155959
        if (dateStr.match(/^\d{4}-\d{2}-\d{2} \d{6}$/)) {
          const [datePart, timePart] = dateStr.split(" ");
          const [year, month, day] = datePart.split("-");
          const hours = timePart.substr(0, 2);
          const minutes = timePart.substr(2, 2);
          const seconds = timePart.substr(4, 2);

          return new Date(year, month - 1, day, hours, minutes, seconds);
        }

        // Fallback to regular date parsing
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }

      // If it's a number (Excel serial date)
      if (typeof cell.value === "number") {
        const excelEpoch = new Date(1900, 0, 1);
        const days = cell.value - 1;
        return new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
      }

      throw new Error(
        `${dateType} date is not valid. Please check Row No. ${rowNumber}.`
      );
    } catch (error) {
      throw new Error(
        `${dateType} date is not valid. Please check Row No. ${rowNumber}.`
      );
    }
  }
}

export default ExcelImportService;
