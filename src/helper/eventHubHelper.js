// helpers/eventHubHelper.js (DEBUGGING VERSION)

import { EventHubConsumerClient } from "@azure/event-hubs";

class EventHubHelper {
  constructor() {
    this.connectionString = process.env.OAG_EVENT_HUB_CONNECTION_STRING;
    this.eventHubName = process.env.OAG_EVENT_HUB_NAME;
    this.consumerGroup = "$Default";
  }

  async fetchEventsForAlerts(alertIds) {
    console.log("\n🔍 === DEBUG: EventHub Helper Start ===");
    console.log("Target AlertIds:", alertIds);

    const allEvents = {};
    let client;
    let totalEventsReceived = 0;
    let totalEventsMatched = 0;

    // Initialize result structure
    alertIds.forEach((id) => {
      allEvents[id] = [];
    });

    try {
      client = new EventHubConsumerClient(
        this.consumerGroup,
        this.connectionString,
        this.eventHubName
      );

      console.log("📡 Starting Event Hub subscription...");

      const subscription = client.subscribe(
        {
          processEvents: async (receivedEvents) => {
            totalEventsReceived += receivedEvents.length;
            console.log(
              `📨 Received ${receivedEvents.length} events (Total: ${totalEventsReceived})`
            );

            for (const event of receivedEvents) {
              try {
                const eventBody =
                  typeof event.body === "string"
                    ? event.body
                    : JSON.stringify(event.body);
                const eventData = JSON.parse(eventBody);
                const alertId = eventData.AlertId || eventData.alertId;

                if (alertId && alertIds.includes(alertId)) {
                  totalEventsMatched++;

                  // ✅ DETAILED DEBUG LOG FOR MATCHING EVENTS
                  console.log(`\n🎯 === MATCH FOUND ===`);
                  console.log(`AlertId: ${alertId}`);
                  console.log(`MessageId: ${eventData.MessageId}`);
                  console.log(
                    `MessageTimestamp: ${eventData.MessageTimestamp}`
                  );
                  console.log(`EnqueuedTime: ${event.enqueuedTimeUtc}`);
                  console.log(`SequenceNumber: ${event.sequenceNumber}`);

                  // ✅ FLIGHT STATUS DEBUG
                  console.log(`\n📊 === FLIGHT STATUS DEBUG ===`);
                  console.log(`State: ${eventData.State}`);
                  console.log(`FlightNumber: ${eventData.FlightNumber}`);
                  console.log(
                    `CarrierCode: ${JSON.stringify(eventData.CarrierCode)}`
                  );

                  // ✅ DEPARTURE TIMING DEBUG (KEY ISSUE AREA)
                  console.log(`\n⏰ === DEPARTURE TIMING DEBUG ===`);
                  const departure = eventData.Departure;
                  if (departure) {
                    console.log(
                      `Departure Object:`,
                      JSON.stringify(departure, null, 2)
                    );

                    if (departure.Times) {
                      console.log(
                        `Times Object:`,
                        JSON.stringify(departure.Times, null, 2)
                      );

                      if (departure.Times.Estimated) {
                        console.log(`\n🔍 === ESTIMATED TIMES ===`);
                        console.log(
                          `OutGateTimeliness: "${departure.Times.Estimated.OutGateTimeliness}"`
                        );
                        console.log(
                          `OutGateVariation: "${departure.Times.Estimated.OutGateVariation}"`
                        );
                        console.log(
                          `OutGateLocal: "${departure.Times.Estimated.OutGate?.Local}"`
                        );
                        console.log(
                          `OutGateUtc: "${departure.Times.Estimated.OutGate?.Utc}"`
                        );
                      }

                      if (departure.Times.Scheduled) {
                        console.log(`\n📅 === SCHEDULED TIMES ===`);
                        console.log(
                          `ScheduledLocal: "${departure.Times.Scheduled.Local}"`
                        );
                        console.log(
                          `ScheduledUtc: "${departure.Times.Scheduled.Utc}"`
                        );
                      }

                      if (departure.Times.Actual) {
                        console.log(`\n✅ === ACTUAL TIMES ===`);
                        console.log(
                          `ActualLocal: "${departure.Times.Actual.OffGround?.Local}"`
                        );
                        console.log(
                          `ActualUtc: "${departure.Times.Actual.OffGround?.Utc}"`
                        );
                      }
                    }
                  } else {
                    console.log(`❌ No Departure data found`);
                  }

                  // ✅ ARRIVAL DEBUG (If needed)
                  if (eventData.Arrival) {
                    console.log(`\n🛬 === ARRIVAL DEBUG ===`);
                    console.log(
                      `Arrival Times:`,
                      JSON.stringify(eventData.Arrival.Times, null, 2)
                    );
                  }

                  const mappedEvent = {
                    alertId: alertId,
                    messageId: eventData.MessageId,
                    messageTimestamp: eventData.MessageTimestamp,
                    sequenceNumber: event.sequenceNumber,
                    offset: event.offset,
                    enqueuedTime: event.enqueuedTimeUtc,

                    // Flight details
                    documentType: eventData.DocumentType,
                    flightType: eventData.FlightType,
                    state: eventData.State,
                    serviceType: eventData.ServiceType,
                    flightNumber: eventData.FlightNumber,

                    // Carrier info
                    carrierCodeIata: eventData.CarrierCode?.Iata,
                    carrierCodeIcao: eventData.CarrierCode?.Icao,

                    // ✅ DEPARTURE INFO WITH DEBUG
                    departureTimesScheduledLocal:
                      eventData.Departure?.Times?.Scheduled?.Local,
                    departureTimesScheduledUtc:
                      eventData.Departure?.Times?.Scheduled?.Utc,
                    departureTimesEstimatedOutGateTimeliness:
                      eventData.Departure?.Times?.Estimated?.OutGateTimeliness,
                    departureTimesEstimatedOutGateVariation:
                      eventData.Departure?.Times?.Estimated?.OutGateVariation,
                    departureTimesEstimatedOutGateLocal:
                      eventData.Departure?.Times?.Estimated?.OutGate?.Local,
                    departureTimesEstimatedOutGateUtc:
                      eventData.Departure?.Times?.Estimated?.OutGate?.Utc,
                    departureTimesActualOffGroundLocal:
                      eventData.Departure?.Times?.Actual?.OffGround?.Local,
                    departureTimesActualOffGroundUtc:
                      eventData.Departure?.Times?.Actual?.OffGround?.Utc,
                    departureAirportIata: eventData.Departure?.Airport?.Iata,
                    departureAirportIcao: eventData.Departure?.Airport?.Icao,
                    departureTerminal: eventData.Departure?.Terminal,
                    departureGate: eventData.Departure?.Gate,

                    // Complete data for analysis
                    completeEventData: eventData,
                    rawEventBody: eventBody,
                  };

                  // ✅ LOG MAPPED EVENT KEY FIELDS
                  console.log(`\n📋 === MAPPED EVENT SUMMARY ===`);
                  console.log(`State: "${mappedEvent.state}"`);
                  console.log(
                    `OutGateTimeliness: "${mappedEvent.departureTimesEstimatedOutGateTimeliness}"`
                  );
                  console.log(
                    `OutGateVariation: "${mappedEvent.departureTimesEstimatedOutGateVariation}"`
                  );
                  console.log(`EnqueuedTime: ${mappedEvent.enqueuedTime}`);

                  allEvents[alertId].push(mappedEvent);
                  console.log(`✅ Event stored for AlertId: ${alertId}`);
                }
              } catch (parseError) {
                console.error("🚨 Event parsing error:", parseError.message);
                continue;
              }
            }
          },
          processError: (error) => {
            console.error("🚨 Event Hub processing error:", error);
          },
        },
        {
          startPosition: {
            enqueuedOn: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
          maxWaitTimeInSeconds: 15,
        }
      );

      console.log("⏳ Waiting for events (17 seconds)...");
      await new Promise((resolve) => setTimeout(resolve, 17000));

      await subscription.close();

      console.log(`\n📊 === EVENT COLLECTION SUMMARY ===`);
      console.log(`Total events received: ${totalEventsReceived}`);
      console.log(`Total events matched: ${totalEventsMatched}`);
      console.log(`Target alerts: ${alertIds.length}`);

      // ✅ LATEST EVENT SELECTION WITH DEBUG
      const latestEvents = {};
      alertIds.forEach((alertId) => {
        const events = allEvents[alertId] || [];
        console.log(`\n🔍 === LATEST SELECTION FOR ${alertId} ===`);
        console.log(`Found ${events.length} events for this AlertId`);

        if (events.length > 0) {
          // Sort by enqueuedTime descending
          const sortedEvents = events.sort(
            (a, b) => new Date(b.enqueuedTime) - new Date(a.enqueuedTime)
          );

          console.log(`📅 Events sorted by enqueuedTime (most recent first):`);
          sortedEvents.forEach((event, index) => {
            console.log(
              `  ${index + 1}. ${event.messageId} - ${event.enqueuedTime}`
            );
            console.log(
              `     State: "${event.state}" | Status: "${event.departureTimesEstimatedOutGateTimeliness}"`
            );
          });

          // Take the latest (most recent)
          const latestEvent = sortedEvents[0];
          latestEvents[alertId] = [latestEvent];

          console.log(`\n✅ === SELECTED LATEST EVENT ===`);
          console.log(`MessageId: ${latestEvent.messageId}`);
          console.log(`EnqueuedTime: ${latestEvent.enqueuedTime}`);
          console.log(`State: "${latestEvent.state}"`);
          console.log(
            `OutGateTimeliness: "${latestEvent.departureTimesEstimatedOutGateTimeliness}"`
          );
          console.log(
            `OutGateVariation: "${latestEvent.departureTimesEstimatedOutGateVariation}"`
          );

          // ✅ COMPARISON WITH C# LOGIC
          console.log(`\n🔄 === C# vs Node.js COMPARISON ===`);
          console.log(
            `Raw Status Field: "${latestEvent.departureTimesEstimatedOutGateTimeliness}"`
          );
          console.log(
            `Should format as: ${this.debugStatusFormatting(latestEvent)}`
          );
        } else {
          latestEvents[alertId] = [];
          console.log(`❌ No events found for AlertId: ${alertId}`);
        }
      });

      console.log("\n🔍 === DEBUG: EventHub Helper End ===\n");
      return latestEvents;
    } catch (error) {
      console.error("💥 Event Hub Helper Error:", error);
      throw new Error(`Event Hub latest fetch error: ${error.message}`);
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  // ✅ DEBUG STATUS FORMATTING
  debugStatusFormatting(event) {
    const status = event.departureTimesEstimatedOutGateTimeliness;
    const variation = event.departureTimesEstimatedOutGateVariation;

    console.log(`\n🔧 === STATUS FORMATTING DEBUG ===`);
    console.log(`Input Status: "${status}"`);
    console.log(`Input Variation: "${variation}"`);

    if (!status) {
      console.log(`Result: "Unknown" (no status field)`);
      return "Unknown";
    }

    if (status.toLowerCase() === "delayed" && variation) {
      const minutes = this.parseTimeToMinutes(variation);
      const result = `Delayed by ${minutes} minutes`;
      console.log(`Result: "${result}" (formatted with variation)`);
      return result;
    }

    console.log(`Result: "${status}" (original status)`);
    return status;
  }

  // Parse time like "00:24:00" to 24 minutes
  parseTimeToMinutes(timeString) {
    try {
      console.log(`⏰ Parsing time: "${timeString}"`);
      const [hours, minutes] = timeString.split(":").map(Number);
      const totalMinutes = hours * 60 + (minutes || 0);
      console.log(`Parsed to: ${totalMinutes} minutes`);
      return totalMinutes;
    } catch (error) {
      console.log(`Parse error: ${error.message}, returning 0`);
      return 0;
    }
  }

  // Single alert fetch
  async fetchEventsForAlert(alertId) {
    const result = await this.fetchEventsForAlerts([alertId]);
    return result[alertId] || [];
  }
}

export default EventHubHelper;
