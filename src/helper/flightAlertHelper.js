import axios from "axios";
import FlightAlertUtils from "../utils/flightAlertUtils.js";

class FlightAlertHelper {
  constructor() {
    this.client = axios.create({
      timeout: 30000,
      headers: {
        "Subscription-Key": process.env.OAG_SUBSCRIPTION_KEY,
        "Content-Type": "application/json",
      },
    });
  }

  buildPayload(carrierCode, flightNumber, departureDate) {
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

    if (code.length === 2) {
      payload.iataCarrierCode = code;
    } else {
      payload.icaoCarrierCode = code;
    }

    return payload;
  }

  async callOAG(payload) {
    const response = await this.client.post(process.env.OAG_BASE_URL, payload);
    return (
      response.data?.alertId || response.data?.data || response.data?.AlertId
    );
  }

  async createAlert(carrierCode, flightNumber, departureDate) {
    try {
      const payload = this.buildPayload(
        carrierCode,
        flightNumber,
        departureDate
      );
      const alertId = await this.callOAG(payload);
      return { success: true, alertId };
    } catch (error) {
      const alertId = FlightAlertUtils.extractAlertIdFromError(error);
      if (alertId) {
        return { success: true, alertId, isDuplicate: true };
      }
      throw error;
    }
  }
}

export default FlightAlertHelper;
