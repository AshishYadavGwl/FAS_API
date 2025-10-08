class OagUtils {
  // Convert date to YYYY-MM-DD format
  static formatDate(dateTime) {
    if (!dateTime) return null;
    try {
      return new Date(dateTime).toISOString().split("T")[0];
    } catch {
      return null;
    }
  }

  // Check if required flight fields exist
  static isValidFlightData(user) {
    return !!(
      user.CarrierCode?.trim() &&
      user.DepartureFlightNumber?.trim() &&
      user.DepartureDateTime
    );
  }

  // Compare old vs new flight data
  static hasFlightDataChanged(oldData, newData) {
    return (
      oldData.CarrierCode !== newData.CarrierCode ||
      oldData.DepartureFlightNumber !== newData.DepartureFlightNumber ||
      this.formatDate(oldData.DepartureDateTime) !==
        this.formatDate(newData.DepartureDateTime)
    );
  }

  // Extract alert ID from duplicate error
  static extractAlertIdFromError(error) {
    if (error.response?.data?.message?.includes("already exists")) {
      const match = error.response.data.message.match(/[a-f0-9-]{36}/i);
      return match ? match[0] : null;
    }
    return null;
  }

  // Build OAG API request payload
  static buildOagPayload(carrierCode, flightNumber, departureDate) {
    const code = carrierCode.trim().toUpperCase();

    const payload = {
      accountId: process.env.OAG_ACCOUNT_ID,
      name: "Flight Alert",
      alertType: "Carrier",
      flightNumber: flightNumber,
      departureDate: departureDate,
      schedules: true,
      status: true,
      statusChangeFilters: {
        gates: true,
        terminal: true,
        aircraftType: true,
      },
    };

    // IATA uses 2 chars, ICAO uses 3 chars
    if (code.length === 2) {
      payload.iataCarrierCode = code;
    } else {
      payload.icaoCarrierCode = code;
    }

    return payload;
  }
}

export default OagUtils;
