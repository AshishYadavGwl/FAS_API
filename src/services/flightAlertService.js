import FlightAlertHelper from "../helper/flightAlertHelper.js";
import FlightAlertUtils from "../utils/flightAlertUtils.js";
import MeetingUserService from "./meetingUserService.js";

class FlightAlertService {
  constructor() {
    this.helper = new FlightAlertHelper();
  }

  // API 1: Create alerts for meeting user IDs
  async createAlertsForUsers(userIds) {
    const stats = { created: 0, skipped: 0, failed: 0 };
    const results = [];

    for (const userId of userIds) {
      try {
        const user = await MeetingUserService.getMeetingUserById(userId);
        if (!user) {
          stats.failed++;
          results.push({
            userId,
            success: false,
            error: "User not found",
          });
          continue;
        }

        if (user.AlertId?.trim()) {
          stats.skipped++;
          results.push({
            userId,
            name: FlightAlertUtils.getUserName(user),
            success: true,
            alertId: user.AlertId,
            skipped: true,
          });
          continue;
        }

        const validation = FlightAlertUtils.validateFlightData(user);
        if (!validation.valid) {
          stats.failed++;
          results.push({
            userId,
            name: FlightAlertUtils.getUserName(user),
            success: false,
            error: validation.error,
          });
          continue;
        }

        const departureDate = FlightAlertUtils.formatDate(
          user.DepartureDateTime
        );
        if (!departureDate) {
          stats.failed++;
          results.push({
            userId,
            name: FlightAlertUtils.getUserName(user),
            success: false,
            error: "Invalid departure date format",
          });
          continue;
        }

        const alertResult = await this.helper.createAlert(
          user.CarrierCode,
          user.DepartureFlightNumber,
          departureDate
        );

        if (alertResult.success) {
          await MeetingUserService.updateMeetingUser(userId, {
            AlertId: alertResult.alertId,
            Status: "Alert Active",
            State: "OAG Alert Created",
            ModifiedDate: new Date(),
          });

          stats.created++;
          results.push({
            userId,
            name: FlightAlertUtils.getUserName(user),
            success: true,
            alertId: alertResult.alertId,
            isDuplicate: alertResult.isDuplicate || false,
          });
        }
      } catch (error) {
        stats.failed++;
        results.push({
          userId,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      message: `Processed ${userIds.length} users: ${stats.created} created, ${stats.skipped} skipped, ${stats.failed} failed`,
      ...stats,
      results,
    };
  }

  // API 2: Create alerts for meeting IDs
  async createAlertsForMeetings(meetingIds) {
    const allUserIds = [];

    for (const meetingId of meetingIds) {
      const users = await MeetingUserService.getMeetingUsersByMeetingId(
        meetingId
      );
      allUserIds.push(...users.map((user) => user.Id));
    }

    if (!allUserIds.length) {
      return {
        success: false,
        message: "No users found in specified meetings",
        created: 0,
        skipped: 0,
        failed: 0,
        results: [],
      };
    }

    return this.createAlertsForUsers(allUserIds);
  }
}

export default new FlightAlertService();
