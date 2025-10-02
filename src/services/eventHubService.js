import EventHubHelper from "../helper/eventHubHelper.js";
import EventHubUtils from "../utils/eventHubUtils.js";
import MeetingUserService from "./meetingUserService.js";

class EventHubService {
  constructor() {
    this.helper = new EventHubHelper();
  }

  // Get latest status for users - with comprehensive debug logs
  async fetchEventsForUsers(userIds) {
    try {
      console.log("\n🔍 === EventHub Service Debug Start ===");
      console.log("Input userIds:", userIds);

      const users = [];

      for (const userId of userIds) {
        const user = await MeetingUserService.getMeetingUserById(userId);
        if (user) {
          users.push(user);
          console.log(`✅ User ${userId} found:`, {
            id: user.Id,
            name: `${user.FirstName} ${user.LastName}`,
            alertId: user.AlertId,
            hasAlertId: !!user.AlertId,
          });
        } else {
          console.log(`❌ User ${userId} not found in database`);
        }
      }

      if (!users.length) {
        console.log("❌ No users found");
        return { success: false, message: "No users found" };
      }

      console.log(`📊 Total users found: ${users.length}`);

      const alertIds = EventHubUtils.extractAlertIds(users);
      console.log("📋 Extracted alertIds:", alertIds);

      const uniqueAlertIds = EventHubUtils.getUniqueAlertIds(alertIds);
      console.log("🎯 Unique alertIds:", uniqueAlertIds);

      if (!uniqueAlertIds.length) {
        console.log("❌ No alert IDs found");
        return { success: false, message: "No alert IDs found" };
      }

      // ✅ Get ONLY latest events with detailed logging
      console.log("\n🌐 Fetching events from Event Hub...");
      const latestEventsData = await this.helper.fetchEventsForAlerts(
        uniqueAlertIds
      );

      console.log("\n📥 Event Hub Response Summary:");
      Object.keys(latestEventsData).forEach((alertId) => {
        const events = latestEventsData[alertId];
        console.log(`  AlertId ${alertId}: ${events.length} events`);
        if (events.length > 0) {
          console.log(
            `    Latest event: ${events[0].messageId} at ${events[0].enqueuedTime}`
          );
        }
      });

      const result = {
        success: true,
        message: `Latest flight status for ${uniqueAlertIds.length} alerts`,
        totalUsers: users.length,

        // Clean user data with detailed status mapping
        users: users.map((user) => {
          const latestEvents = latestEventsData[user.AlertId] || [];
          const latestStatus = latestEvents.length > 0 ? latestEvents[0] : null;

          const userResult = {
            userId: user.Id,
            name: `${user.FirstName} ${user.LastName}`,
            alertId: user.AlertId,
            hasStatus: latestStatus !== null,
            latestStatus: latestStatus
              ? {
                  // Key flight info
                  state: latestStatus.state,
                  flightNumber: latestStatus.flightNumber,
                  carrierCode: latestStatus.carrierCodeIata,

                  // Departure status
                  departureGate: latestStatus.departureGate,
                  departureTerminal: latestStatus.departureTerminal,
                  departureTimeliness:
                    latestStatus.departureTimesEstimatedOutGateTimeliness,
                  scheduledDeparture: latestStatus.departureTimesScheduledLocal,
                  estimatedDeparture:
                    latestStatus.departureTimesEstimatedOutGateLocal,

                  // Arrival status
                  arrivalGate: latestStatus.arrivalGate,
                  scheduledArrival: latestStatus.arrivalTimesScheduledLocal,
                  estimatedArrival:
                    latestStatus.arrivalTimesEstimatedInGateLocal,

                  // Event metadata
                  lastUpdated: latestStatus.enqueuedTime,
                  messageId: latestStatus.messageId,

                  // Complete data if needed
                  completeData: latestStatus.completeEventData,
                }
              : null,
          };

          console.log(`👤 User mapping result:`, {
            userId: userResult.userId,
            name: userResult.name,
            alertId: userResult.alertId,
            hasStatus: userResult.hasStatus,
            statusFound: !!latestStatus,
          });

          return userResult;
        }),
      };

      console.log("\n✅ EventHub Service Result:", {
        success: result.success,
        totalUsers: result.totalUsers,
        usersWithStatus: result.users.filter((u) => u.hasStatus).length,
        usersWithoutStatus: result.users.filter((u) => !u.hasStatus).length,
      });

      console.log("🔍 === EventHub Service Debug End ===\n");
      return result;
    } catch (error) {
      console.error("💥 EventHub Service Error:", error);
      return { success: false, message: error.message };
    }
  }

  // Get latest status for meetings
  async fetchEventsForMeetings(meetingIds) {
    try {
      const allUsers = [];

      for (const meetingId of meetingIds) {
        const users = await MeetingUserService.getMeetingUsersByMeetingId(
          meetingId
        );
        allUsers.push(...users);
      }

      if (!allUsers.length) {
        return { success: false, message: "No users found in meetings" };
      }

      const userIds = allUsers.map((user) => user.Id);
      return this.fetchEventsForUsers(userIds);
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export default new EventHubService();
