// utils/eventHubUtils.js

import { EventHubConsumerClient } from "@azure/event-hubs";

class EventHubUtils {
  // Fetch latest events from Event Hub
  static async fetchLatestEvents(alertIds, hoursBack = 24) {
    const client = new EventHubConsumerClient(
      "$Default",
      process.env.OAG_EVENT_HUB_CONNECTION_STRING,
      process.env.OAG_EVENT_HUB_NAME
    );

    const events = {};
    alertIds.forEach((id) => (events[id] = []));

    try {
      const subscription = client.subscribe(
        {
          processEvents: async (receivedEvents) => {
            for (const event of receivedEvents) {
              try {
                const data =
                  typeof event.body === "string"
                    ? JSON.parse(event.body)
                    : event.body;

                const alertId = data.AlertId || data.alertId;

                if (alertId && alertIds.includes(alertId)) {
                  events[alertId].push({
                    alertId,
                    messageId: data.MessageId,
                    timestamp: event.enqueuedTimeUtc,
                    state: data.State || "Unknown",
                    status: this.extractStatus(data),
                  });
                }
              } catch {
                continue;
              }
            }
          },
          processError: () => {},
        },
        {
          startPosition: {
            enqueuedOn: new Date(Date.now() - hoursBack * 60 * 60 * 1000),
          },
          maxWaitTimeInSeconds: 15,
        }
      );

      await new Promise((resolve) => setTimeout(resolve, 17000));
      await subscription.close();

      // Get only latest event per alert
      const latest = {};
      Object.keys(events).forEach((alertId) => {
        const sorted = events[alertId].sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        latest[alertId] = sorted[0] || null;
      });

      return latest;
    } finally {
      await client.close();
    }
  }

  // Extract readable status from event data
  static extractStatus(eventData) {
    const timeliness = eventData.Departure?.Times?.Estimated?.OutGateTimeliness;
    const variation = eventData.Departure?.Times?.Estimated?.OutGateVariation;

    if (!timeliness) return "Unknown";

    if (timeliness.toLowerCase() === "delayed" && variation) {
      const minutes = this.parseTimeToMinutes(variation);
      return `Delayed by ${minutes} minutes`;
    }

    return timeliness;
  }

  // Parse time string (HH:MM:SS) to minutes
  static parseTimeToMinutes(timeString) {
    try {
      const [hours, minutes] = timeString.split(":").map(Number);
      return hours * 60 + (minutes || 0);
    } catch {
      return 0;
    }
  }

  // Extract unique alert IDs from users
  static getAlertIds(users) {
    return [
      ...new Set(
        users.filter((u) => u.AlertId?.trim()).map((u) => u.AlertId.trim())
      ),
    ];
  }
}

export default EventHubUtils;
