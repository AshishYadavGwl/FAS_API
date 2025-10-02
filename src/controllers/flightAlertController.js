import FlightAlertService from "../services/flightAlertService.js";

class FlightAlertController {
  // Create alerts for meeting user IDs
  static async createForUsers(req, res) {
    try {
      const { userIds } = req.body;

      if (!Array.isArray(userIds) || !userIds.length) {
        return res.status(400).json({
          success: false,
          message: "userIds array is required",
        });
      }

      const result = await FlightAlertService.createAlertsForUsers(userIds);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Create alerts for meeting IDs
  static async createForMeetings(req, res) {
    try {
      const { meetingIds } = req.body;

      if (!Array.isArray(meetingIds) || !meetingIds.length) {
        return res.status(400).json({
          success: false,
          message: "meetingIds array is required",
        });
      }

      const result = await FlightAlertService.createAlertsForMeetings(
        meetingIds
      );
      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default FlightAlertController;
