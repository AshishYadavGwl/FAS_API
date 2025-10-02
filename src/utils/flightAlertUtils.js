class FlightAlertUtils {
  static validateFlightData(user) {
    if (!user.DepartureFlightNumber)
      return { valid: false, error: "Missing flight number" };
    if (!user.CarrierCode)
      return { valid: false, error: "Missing carrier code" };
    if (!user.DepartureDateTime)
      return { valid: false, error: "Missing departure date" };
    return { valid: true };
  }

  static extractAlertIdFromError(error) {
    try {
      const message =
        error.response?.data?.problemdetails?.message ||
        error.response?.data?.message;
      if (!message) return null;
      const match = message.match(/other alert\(s\):([a-f0-9\-]+)/i);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  // Handle DB format: "2025-09-02 16:40:00+00"
  static formatDate(dateString) {
    if (!dateString) return null;

    // Parse DB format to ISO date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;

    // Return YYYY-MM-DD format for OAG API
    return date.toISOString().split("T")[0];
  }

  static getUserName(user) {
    return `${user.FirstName || ""} ${user.LastName || ""}`.trim();
  }
}

export default FlightAlertUtils;
