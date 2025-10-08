// services/checkAlertService.js

import { EventHubConsumerClient } from "@azure/event-hubs";

class CheckAlertService {
  // Fetch all events first, then filter by alert ID
  static async searchAlertInEventHub(alertId, lookbackHours = 3) {
    const client = new EventHubConsumerClient(
      "$Default",
      process.env.OAG_EVENT_HUB_CONNECTION_STRING,
      process.env.OAG_EVENT_HUB_NAME
    );

    const result = {
      success: false,
      alertId,
      eventsFound: 0,
      totalScanned: 0,
      events: [],
      searchDuration: 0,
      error: null,
    };

    const startTime = Date.now();

    try {
      // Step 1: पहले सारे events fetch करो
      const allEvents = await this.fetchAllEvents(client, lookbackHours);

      result.totalScanned = allEvents.length;
      console.log(`✅ Total events fetched: ${allEvents.length}`);

      // Step 2: अब memory में filter करो
      const matchingEvents = allEvents.filter((event) => {
        const eventAlertId = event.alertId || event.AlertId;
        return eventAlertId === alertId;
      });

      // Step 3: Matching events format करो
      result.events = matchingEvents.map((event) => ({
        messageId: event.MessageId,
        alertId: event.AlertId || event.alertId,
        state: event.State,
        status: this.extractStatus(event),
        flightNumber: event.FlightNumber,
        carrierCode: event.CarrierCode,
        enqueuedTime: event.enqueuedTimeUtc,
        sequenceNumber: event.sequenceNumber,
        departure: event.Departure,
        arrival: event.Arrival,
        rawData: event,
      }));

      result.eventsFound = matchingEvents.length;
      result.success = true;
      result.searchDuration = Date.now() - startTime;

      console.log(`🎯 Matching events found: ${result.eventsFound}`);

      return result;
    } catch (error) {
      result.error = error.message;
      result.searchDuration = Date.now() - startTime;
      console.error("❌ Search error:", error);
      return result;
    } finally {
      await client.close();
    }
  }

  // Fetch all events from Event Hub
  static async fetchAllEvents(client, lookbackHours = 3) {
    const allEvents = [];
    const startPosition = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

    console.log(`📥 Fetching events from ${startPosition.toISOString()}`);

    // Get all partition IDs
    const partitionIds = await client.getPartitionIds();
    console.log(`📊 Found ${partitionIds.length} partitions:`, partitionIds);

    // Parallel fetch from all partitions
    const fetchPromises = partitionIds.map((partitionId) =>
      this.fetchPartitionEvents(client, partitionId, startPosition)
    );

    const partitionResults = await Promise.all(fetchPromises);

    // Merge all partition events
    partitionResults.forEach((events, index) => {
      console.log(
        `  Partition ${partitionIds[index]}: ${events.length} events`
      );
      allEvents.push(...events);
    });

    return allEvents;
  }

  // Fetch events from single partition
  static async fetchPartitionEvents(client, partitionId, startPosition) {
    const events = [];
    const maxWaitTime = 10000; // 10 seconds max wait
    const maxEvents = 10000; // Safety limit

    try {
      const subscription = client.subscribe(
        partitionId,
        {
          processEvents: async (batch, context) => {
            for (const event of batch) {
              try {
                const data =
                  typeof event.body === "string"
                    ? JSON.parse(event.body)
                    : event.body;

                // Add metadata to event data
                events.push({
                  ...data,
                  enqueuedTimeUtc: event.enqueuedTimeUtc,
                  sequenceNumber: event.sequenceNumber,
                  offset: event.offset,
                });

                // Safety break
                if (events.length >= maxEvents) {
                  await subscription.close();
                  return;
                }
              } catch (err) {
                console.error(
                  `Parse error in partition ${partitionId}:`,
                  err.message
                );
              }
            }
          },
          processError: async (err, context) => {
            console.error(`Error in partition ${partitionId}:`, err.message);
          },
        },
        {
          startPosition: { enqueuedOn: startPosition },
          maxBatchSize: 100, // Batch में 100 events लो
          maxWaitTimeInSeconds: 2, // हर batch के लिए 2 seconds wait
        }
      );

      // Wait करो कुछ seconds
      await new Promise((resolve) => setTimeout(resolve, maxWaitTime));

      await subscription.close();
    } catch (error) {
      console.error(`Partition ${partitionId} fetch error:`, error.message);
    }

    return events;
  }

  // Extract human-readable status
  static extractStatus(data) {
    const timeliness = data.Departure?.Times?.Estimated?.OutGateTimeliness;
    const variation = data.Departure?.Times?.Estimated?.OutGateVariation;

    if (!timeliness) return "Unknown";

    if (timeliness.toLowerCase() === "delayed" && variation) {
      const [h, m] = variation.split(":").map(Number);
      return `Delayed by ${h * 60 + (m || 0)} minutes`;
    }

    return timeliness;
  }

  // Bonus: Get stats by alert IDs
  static async getEventStats(lookbackHours = 3) {
    const client = new EventHubConsumerClient(
      "$Default",
      process.env.OAG_EVENT_HUB_CONNECTION_STRING,
      process.env.OAG_EVENT_HUB_NAME
    );

    try {
      const allEvents = await this.fetchAllEvents(client, lookbackHours);

      // Group by alert ID
      const alertStats = {};
      allEvents.forEach((event) => {
        const alertId = event.AlertId || event.alertId;
        if (alertId) {
          alertStats[alertId] = (alertStats[alertId] || 0) + 1;
        }
      });

      return {
        totalEvents: allEvents.length,
        uniqueAlerts: Object.keys(alertStats).length,
        alertBreakdown: alertStats,
      };
    } finally {
      await client.close();
    }
  }
}

export default CheckAlertService;
