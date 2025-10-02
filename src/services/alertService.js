import FlightAlertService from "./flightAlertService.js";
import EventHubService from "./eventHubService.js";
import MeetingUserService from "./meetingUserService.js";

class AlertService {
  // ✅ EXISTING FUNCTIONALITY + Alert Creation (No Breaking Changes)
  async sendAlertForUsers(userIds) {
    try {
      // ✅ NEW: Check and create alerts first (if needed)
      await this.ensureAlertsExist(userIds);

      // ✅ EXISTING: Create flight alerts (kept as is for compatibility)
      const alertResult = await FlightAlertService.createAlertsForUsers(
        userIds
      );

      if (!alertResult.success) {
        return alertResult;
      }

      // ✅ EXISTING: Get latest flight status from Event Hub
      const eventHubResult = await EventHubService.fetchEventsForUsers(userIds);
      const eventHubResultJSON = JSON.stringify(eventHubResult.users, null, 2);
      const eventHubData = JSON.parse(eventHubResultJSON);

      if (!eventHubResult.success) {
        return {
          success: true,
          message: "Alerts created but no Event Hub data found",
          alertsCreated: alertResult.created,
          eventHubData: null,
        };
      }

      // ✅ EXISTING: Update meeting users with latest status
      const updateResult = await this.updateUsersStatus(eventHubData);

      // ✅ EXISTING: Return same response format
      return {
        success: true,
        message: `Alerts sent for ${userIds.length} users`,
        alertsCreated: alertResult.created,
        usersUpdated: updateResult.updated,
        data: eventHubResult.users,
      };
    } catch (error) {
      return {
        success: false,
        message: `Alert service error: ${error.message}`,
      };
    }
  }

  // ✅ NEW METHOD: Ensure alerts exist before processing
  async ensureAlertsExist(userIds) {
    try {
      const usersNeedingAlerts = [];

      // Check which users don't have AlertId
      for (const userId of userIds) {
        const user = await MeetingUserService.getMeetingUserById(userId);
        if (user && (!user.AlertId || user.AlertId.trim() === "")) {
          usersNeedingAlerts.push(userId);
        }
      }

      // Create alerts for users without AlertId
      if (usersNeedingAlerts.length > 0) {
        console.log(
          `🔧 Creating alerts for ${usersNeedingAlerts.length} users without AlertId`
        );
        const createResult = await FlightAlertService.createAlertsForUsers(
          usersNeedingAlerts
        );

        if (createResult.success) {
          console.log(`✅ Pre-created ${createResult.created} alerts`);

          // Wait a bit for database to update
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          console.log(`❌ Pre-alert creation failed: ${createResult.message}`);
        }
      }
    } catch (error) {
      console.error("⚠️ Error ensuring alerts exist:", error.message);
      // Don't throw error - let existing flow continue
    }
  }

  // ✅ EXISTING: Send alerts for all users in meetings (unchanged)
  async sendAlertForMeetings(meetingIds) {
    try {
      const allUsers = [];

      for (const meetingId of meetingIds) {
        const users = await MeetingUserService.getMeetingUsersByMeetingId(
          meetingId
        );
        allUsers.push(...users);
      }

      if (!allUsers.length) {
        return {
          success: false,
          message: "No users found in meetings",
        };
      }

      const userIds = allUsers.map((user) => user.Id);
      return this.sendAlertForUsers(userIds);
    } catch (error) {
      return {
        success: false,
        message: `Meeting alert error: ${error.message}`,
      };
    }
  }

  // ✅ EXISTING: Update users status (unchanged)
  async updateUsersStatus(users) {
    let updated = 0;

    try {
      for (const user of users) {
        if (user.hasStatus && user.latestStatus?.completeData) {
          const data = user.latestStatus.completeData;
          const outGateTimeliness =
            data?.departure?.times?.estimated?.outGateTimeliness;
          const state = data?.state || "Unknown";

          await MeetingUserService.updateUserStatus(user.userId, {
            state: state,
            status: outGateTimeliness || state,
            alertId: user.alertId,
            lastUpdated: new Date(),
          });

          updated++;
        }
      }

      return { updated };
    } catch (error) {
      throw new Error(`Status update error: ${error.message}`);
    }
  }
}

export default new AlertService();
