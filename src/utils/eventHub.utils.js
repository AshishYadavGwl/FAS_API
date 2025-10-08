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

    const estimated = times?.estimated;

    return {
      alertId: raw.alertId || raw.AlertId,
      messageId: raw.messageId || raw.MessageId,
      state: raw.state || raw.State || null,
      status: estimated?.outGateTimeliness || "No Take Off Info",
      time: estimated?.outGateVariation || null,
    };
  }

  // Converts time variation to readable format and appends to status
  static formatStatusWithTime = (status, time) => {
    if (!time || time === "00:00:00") return status;

    const match = time.match(/([+-])?(\d{2}):(\d{2}):(\d{2})/);
    if (!match) return status;

    const [, sign, hours, minutes] = match;
    const totalMinutes = parseInt(hours) * 60 + parseInt(minutes);

    if (totalMinutes === 0) return status;

    return `${status} by ${totalMinutes} min`;
  };
}

export default EventHubUtils;
