import EventHubService from "../services/eventHubService.js";

class EventHubController {
  // Fetch events for meeting user IDs
  static async fetchForUsers(req, res) {
    try {
      const { userIds } = req.body;

      if (!Array.isArray(userIds) || !userIds.length) {
        return res.status(400).json({
          success: false,
          message: "userIds array is required",
        });
      }

      const result = await EventHubService.fetchEventsForUsers(userIds);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Fetch events for meeting IDs
  static async fetchForMeetings(req, res) {
    try {
      const { meetingIds } = req.body;

      if (!Array.isArray(meetingIds) || !meetingIds.length) {
        return res.status(400).json({
          success: false,
          message: "meetingIds array is required",
        });
      }

      const result = await EventHubService.fetchEventsForMeetings(meetingIds);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default EventHubController;
