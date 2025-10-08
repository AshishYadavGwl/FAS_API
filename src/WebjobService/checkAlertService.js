// services/checkAlertService.js
import { EventHubConsumerClient } from "@azure/event-hubs";

class CheckAlertService {
  static async searchAlertInEventHub(alertId, lookbackHours = 24) {
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
      console.log(`🔍 Searching for Alert ID: ${alertId}`);

      const allEvents = await this.fetchAllEvents(client, lookbackHours);
      result.totalScanned = allEvents.length;

      console.log(`✅ Total events scanned: ${allEvents.length}`);

      // Filter by alert ID
      const matchingEvents = allEvents.filter((event) => {
        const eventAlertId = event.AlertId || event.alertId;
        return eventAlertId === alertId;
      });

      // Format response
      result.events = matchingEvents
        .map((event) => ({
          // ✅ Check करो - ये fields aa rahe hain ya nahi
          sequenceNumber: event.sequenceNumber,
          enqueuedTimeUtc: event.enqueuedTimeUtc,
          offset: event.offset,
          partitionKey: event.partitionKey,

          // OAG data
          messageId: event.MessageId || event.messageId,
          alertId: event.AlertId || event.alertId,
          state: event.State || event.state,

          // Flight info
          flightNumber: event.FlightNumber || event.Departure?.FlightNumber,
          carrierCode: event.CarrierCode || event.Carrier?.IATA,

          // Status
          departureStatus: event.Departure?.Times?.Estimated?.OutGateTimeliness,
          departureVariation:
            event.Departure?.Times?.Estimated?.OutGateVariation,

          // Raw data for debugging
          fullData: event,
        }))
        .sort((a, b) => a.sequenceNumber - b.sequenceNumber);

      result.eventsFound = matchingEvents.length;
      result.success = true;
      result.searchDuration = Date.now() - startTime;

      console.log(`🎯 Found ${result.eventsFound} events`);

      return result;
    } catch (error) {
      result.error = error.message;
      result.searchDuration = Date.now() - startTime;
      console.error("❌ Error:", error);
      return result;
    } finally {
      await client.close();
    }
  }

  static async fetchAllEvents(client, lookbackHours) {
    const allEvents = [];
    const startPosition = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

    console.log(`📥 Fetching from: ${startPosition.toISOString()}`);

    const partitionIds = await client.getPartitionIds();
    console.log(`📊 Partitions: ${partitionIds.length}`);

    const fetchPromises = partitionIds.map((partitionId) =>
      this.fetchPartitionEvents(client, partitionId, startPosition)
    );

    const partitionResults = await Promise.all(fetchPromises);

    partitionResults.forEach((events, index) => {
      console.log(
        `  Partition ${partitionIds[index]}: ${events.length} events`
      );
      allEvents.push(...events);
    });

    return allEvents;
  }

  static async fetchPartitionEvents(client, partitionId, startPosition) {
    const events = [];
    const maxWaitTime = 12000;

    try {
      const subscription = client.subscribe(
        partitionId,
        {
          processEvents: async (batch) => {
            for (const event of batch) {
              try {
                const data =
                  typeof event.body === "string"
                    ? JSON.parse(event.body)
                    : event.body;

                // ✅ Event Hub metadata add karo
                events.push({
                  ...data,
                  sequenceNumber: event.sequenceNumber,
                  enqueuedTimeUtc: event.enqueuedTimeUtc,
                  offset: event.offset,
                  partitionKey: event.partitionKey,
                });
              } catch (err) {
                console.error(`Parse error:`, err.message);
              }
            }
          },
          processError: async (err) => {
            console.error(`Partition ${partitionId} error:`, err.message);
          },
        },
        {
          startPosition: { enqueuedOn: startPosition },
          maxBatchSize: 500,
          maxWaitTimeInSeconds: 3,
        }
      );

      await new Promise((resolve) => setTimeout(resolve, maxWaitTime));
      await subscription.close();
    } catch (error) {
      console.error(`Partition ${partitionId} fetch error:`, error.message);
    }

    return events;
  }
}

export default CheckAlertService;
