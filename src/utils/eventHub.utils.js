import { EventHubConsumerClient } from "@azure/event-hubs";

class EventHubUtils {
  // Connects to Event Hub using env config
  static createClient() {
    return new EventHubConsumerClient(
      "$Default",
      process.env.OAG_EVENT_HUB_CONNECTION_STRING,
      process.env.OAG_EVENT_HUB_NAME
    );
  }

  // Gets flight status from event (actual first, then estimated)
  static parseEvent(event) {
    const raw =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    const dep = raw.departure || raw.Departure;
    const times = dep?.times;

    const actual = times?.actual;
    const estimated = times?.estimated;

    return {
      alertId: raw.alertId || raw.AlertId,
      messageId: raw.messageId || raw.MessageId,
      state: raw.state || raw.State || null,
      status:
        actual?.outGateTimeliness ||
        estimated?.outGateTimeliness ||
        "No Take Off Info",
      time: actual?.outGateVariation || estimated?.outGateVariation || null,
    };
  }
}

export default EventHubUtils;
