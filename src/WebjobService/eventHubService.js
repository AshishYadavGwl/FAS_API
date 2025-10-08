// services/eventHubService.js

import { Op } from "sequelize";
import MeetingUser from "../models/MeetingUser.js";
import { sequelize } from "../config/database.js";
import EventHubUtils from "./eventHubUtils.js";

class EventHubService {
  // Main sync function with detailed stats
  static async syncFlightStatus(hoursAhead = 48) {
    const startTime = Date.now();
    const stats = {
      success: false,
      hoursAhead,
      usersFound: 0,
      usersWithAlerts: 0,
      uniqueAlerts: 0,
      eventsReceived: 0,
      statusChanged: 0,
      statusUnchanged: 0,
      executionTime: 0,
      details: [],
    };

    try {
      // Step 1: Get users with upcoming flights
      const cutoffTime = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);

      const users = await MeetingUser.findAll({
        where: {
          DepartureDateTime: {
            [Op.between]: [new Date(), cutoffTime],
          },
          IsDeleted: false,
          IsActive: true,
        },
        attributes: [
          "Id",
          "AlertId",
          "Status",
          "State",
          "FirstName",
          "LastName",
        ],
        raw: true,
      });

      stats.usersFound = users.length;

      if (!users.length) {
        stats.success = true;
        stats.executionTime = Date.now() - startTime;
        return stats;
      }

      // Step 2: Filter users with AlertId
      const usersWithAlerts = users.filter((u) => u.AlertId?.trim());
      stats.usersWithAlerts = usersWithAlerts.length;

      if (!usersWithAlerts.length) {
        stats.success = true;
        stats.executionTime = Date.now() - startTime;
        return stats;
      }

      // Step 3: Get unique alert IDs
      const alertIds = EventHubUtils.getAlertIds(usersWithAlerts);
      stats.uniqueAlerts = alertIds.length;

      // Step 4: Fetch events from Event Hub
      const latestEvents = await EventHubUtils.fetchLatestEvents(alertIds);
      stats.eventsReceived = Object.values(latestEvents).filter(
        (e) => e !== null
      ).length;

      // Step 5: Prepare updates
      const toUpdate = [];

      usersWithAlerts.forEach((user) => {
        const event = latestEvents[user.AlertId];

        if (!event) {
          stats.details.push({
            userId: user.Id,
            name: `${user.FirstName} ${user.LastName}`,
            alertId: user.AlertId,
            action: "No Event Data",
            oldStatus: user.Status,
            oldState: user.State,
          });
          return;
        }

        const newStatus = event.status || "Unknown";
        const newState = event.state || "Unknown";

        if (user.Status !== newStatus || user.State !== newState) {
          toUpdate.push({
            id: user.Id,
            status: newStatus,
            state: newState,
          });

          stats.details.push({
            userId: user.Id,
            name: `${user.FirstName} ${user.LastName}`,
            alertId: user.AlertId,
            action: "Updated",
            oldStatus: user.Status,
            newStatus: newStatus,
            oldState: user.State,
            newState: newState,
          });

          stats.statusChanged++;
        } else {
          stats.details.push({
            userId: user.Id,
            name: `${user.FirstName} ${user.LastName}`,
            alertId: user.AlertId,
            action: "No Change",
            currentStatus: user.Status,
            currentState: user.State,
          });

          stats.statusUnchanged++;
        }
      });

      // Step 6: Bulk update if needed
      if (toUpdate.length > 0) {
        await this.bulkUpdateStatus(toUpdate);
      }

      stats.success = true;
      stats.executionTime = Date.now() - startTime;
      return stats;
    } catch (error) {
      stats.success = false;
      stats.error = error.message;
      stats.executionTime = Date.now() - startTime;
      return stats;
    }
  }

  // Bulk update using UNNEST
  static async bulkUpdateStatus(updates) {
    const transaction = await sequelize.transaction();

    try {
      await sequelize.query(
        `UPDATE "MeetingUser" AS m SET 
          "Status" = u.status,
          "State" = u.state,
          "ModifiedDate" = NOW()
        FROM (
          SELECT * FROM UNNEST($1::int[], $2::text[], $3::text[])
        ) AS u(user_id, status, state)
        WHERE m."Id" = u.user_id`,
        {
          bind: [
            updates.map((u) => u.id),
            updates.map((u) => u.status),
            updates.map((u) => u.state),
          ],
          transaction,
        }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export default EventHubService;
