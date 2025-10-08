import moment from "moment";

class EmailUtils {
  // Format date as-is (no timezone conversion)
  static formatDateTime(dt) {
    if (!dt) return "N/A";
    const str = (dt instanceof Date ? dt.toISOString() : String(dt))
      .split(/[+Z]/)[0]
      .replace("T", " ");
    return moment(str, "YYYY-MM-DD HH:mm:ss").format("MMM DD, YYYY, hh:mm A");
  }

  // Build full name from first and last
  static getFullName(firstName, lastName) {
    return `${firstName || ""} ${lastName || ""}`.trim();
  }

  // Format flight identifier
  static getFlightId(carrierCode, flightNumber) {
    return `${carrierCode}${flightNumber}`;
  }
}

export default EmailUtils;
