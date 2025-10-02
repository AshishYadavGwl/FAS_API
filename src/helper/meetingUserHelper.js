// helpers/meetingUserHelper.js
import FlightAlertService from "../services/flightAlertService.js";
import EventHubHelper from "./eventHubHelper.js";
import MeetingUserService from "../services/meetingUserService.js";

class MeetingUserHelper {
  // ✅ Send Alert for Selected Users - Main Logic
  static async sendAlertForUsers(userIds) {
    try {
      console.log(
        `🎯 Processing alerts for ${userIds.length} users: [${userIds}]`
      );

      // Get user details
      const users = await MeetingUserService.getMeetingUsersByIds(userIds);

      if (!users || users.length === 0) {
        throw new Error("No users found with provided IDs");
      }

      console.log(`👥 Found ${users.length} users to process alerts`);

      // Process each user
      const results = {
        totalUsers: users.length,
        alertsCreated: 0,
        statusUpdated: 0,
        errors: [],
        success: true,
        processedUsers: [],
      };

      for (const user of users) {
        try {
          console.log(
            `\n🔄 Processing user: ${user.FirstName} ${user.LastName} (ID: ${user.Id})`
          );

          const userResult = {
            userId: user.Id,
            name: `${user.FirstName} ${user.LastName}`,
            flightNumber: user.DepartureFlightNumber,
            hasAlertId: !!user.AlertId,
            alertCreated: false,
            statusUpdated: false,
            currentStatus: user.Status,
            currentState: user.State,
            error: null,
          };

          // Step 1: Check if user has AlertId
          if (!user.AlertId) {
            console.log(`📝 Creating new alert for user ${user.Id}...`);

            // Create alert for this user
            const alertResult = await FlightAlertService.createAlertsForUsers([
              user.Id,
            ]);

            if (alertResult.success && alertResult.created > 0) {
              // Refresh user data to get the new AlertId
              const updatedUser = await MeetingUserService.getMeetingUserById(
                user.Id
              );
              user.AlertId = updatedUser?.AlertId;
              userResult.alertCreated = true;
              results.alertsCreated++;

              console.log(
                `✅ Alert created for user ${user.Id}: ${user.AlertId}`
              );
            } else {
              throw new Error(alertResult.message || "Failed to create alert");
            }
          } else {
            console.log(
              `🔍 User ${user.Id} already has AlertId: ${user.AlertId}`
            );
          }

          // Step 2: Fetch latest status from Event Hub
          if (user.AlertId) {
            console.log(
              `📡 Fetching Event Hub data for AlertId: ${user.AlertId}`
            );

            const eventHubResult = await EventHubHelper.fetchEventsForAlert(
              user.AlertId
            );

            if (
              eventHubResult.success &&
              eventHubResult.events &&
              eventHubResult.events.length > 0
            ) {
              const latestEvent = eventHubResult.events[0]; // Most recent event

              // Extract status and state from event
              const newStatus = this.extractFlightStatus(latestEvent);
              const newState = latestEvent.state || "";

              console.log(`📊 Event Hub data found:
                Current Status: "${user.Status}" → New Status: "${newStatus}"
                Current State: "${user.State}" → New State: "${newState}"
              `);

              // Step 3: Update status if different
              if (newStatus !== user.Status || newState !== user.State) {
                console.log(`🔄 Updating user ${user.Id} status...`);

                const updateResult =
                  await MeetingUserService.updateMeetingUserStatus(user.Id, {
                    status: newStatus,
                    state: newState,
                    lastUpdated: new Date(),
                  });

                if (updateResult) {
                  userResult.statusUpdated = true;
                  userResult.newStatus = newStatus;
                  userResult.newState = newState;
                  results.statusUpdated++;

                  console.log(`✅ User ${user.Id} status updated successfully`);
                }
              } else {
                console.log(
                  `ℹ️ User ${user.Id} status unchanged - no update needed`
                );
              }
            } else {
              console.log(
                `⚠️ No Event Hub data found for AlertId: ${user.AlertId}`
              );
            }
          }

          results.processedUsers.push(userResult);
        } catch (userError) {
          console.error(
            `❌ Error processing user ${user.Id}:`,
            userError.message
          );

          const errorResult = {
            userId: user.Id,
            name: `${user.FirstName} ${user.LastName}`,
            flightNumber: user.DepartureFlightNumber,
            error: userError.message,
          };

          results.errors.push(errorResult);
          results.processedUsers.push(errorResult);
        }
      }

      // Determine overall success
      const hasSuccessfulOperations =
        results.alertsCreated > 0 || results.statusUpdated > 0;
      results.success = hasSuccessfulOperations || results.errors.length === 0;

      console.log(`\n📊 Send Alert Summary:
        Total Users: ${results.totalUsers}
        Alerts Created: ${results.alertsCreated}
        Status Updated: ${results.statusUpdated}  
        Errors: ${results.errors.length}
        Success: ${results.success}
      `);

      return results;
    } catch (error) {
      console.error("💥 MeetingUserHelper sendAlertForUsers error:", error);
      throw error;
    }
  }

  // ✅ HELPER: Extract flight status from event data
  static extractFlightStatus(eventData) {
    try {
      // Priority order for status extraction
      const statusSources = [
        eventData.departureTimesEstimatedOutGateTimeliness,
        eventData.state,
        eventData.completeEventData?.State,
        eventData.completeEventData?.Departure?.Times?.Estimated
          ?.OutGateTimeliness,
      ];

      for (const status of statusSources) {
        if (status && typeof status === "string") {
          const statusLower = status.toLowerCase();

          if (statusLower.includes("delayed")) {
            // Extract delay time if available
            const variation =
              eventData.departureTimesEstimatedOutGateVariation ||
              eventData.completeEventData?.Departure?.Times?.Estimated
                ?.OutGateVariation;

            if (variation) {
              const minutes = this.parseTimeToMinutes(variation);
              return `Delayed by ${minutes} minutes`;
            }
            return status; // Return original delayed status
          }

          if (statusLower === "ontime" || statusLower === "on time") {
            return "OnTime";
          }

          return status; // Return as-is for other statuses
        }
      }

      return "Unknown"; // Default fallback
    } catch (error) {
      console.error("Error extracting flight status:", error);
      return "Unknown";
    }
  }

  // ✅ HELPER: Parse time variation to minutes
  static parseTimeToMinutes(timeString) {
    try {
      if (!timeString) return 0;

      // Handle format like "00:24:00"
      const parts = timeString.split(":");
      if (parts.length >= 2) {
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        return hours * 60 + minutes;
      }

      // Handle other numeric formats
      const numericValue = parseInt(timeString);
      return isNaN(numericValue) ? 0 : numericValue;
    } catch (error) {
      return 0;
    }
  }
}

export default MeetingUserHelper;
