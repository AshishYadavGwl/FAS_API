class EventHubUtils {
  static extractAlertIds(users) {
    return users
      .filter((user) => user.AlertId?.trim())
      .map((user) => user.AlertId.trim());
  }

  static getUniqueAlertIds(alertIds) {
    return [...new Set(alertIds)];
  }

  static formatEventData(eventData) {
    return {
      alertId: eventData.alertId || eventData.AlertId,
      timestamp: eventData.timestamp || new Date().toISOString(),
      rawData: eventData,
    };
  }
}

export default EventHubUtils;
