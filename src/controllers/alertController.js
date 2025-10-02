import AlertService from "../services/alertService.js";

class AlertController {
  // Send alert for specific meeting users
  static async sendAlertForUsers(req, res) {
    try {
      const { userIds } = req.body;

      if (!Array.isArray(userIds) || !userIds.length) {
        return res.status(400).json({
          success: false,
          message: "userIds array is required",
        });
      }

      const result = await AlertService.sendAlertForUsers(userIds);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Send alert for all users in meetings
  static async sendAlertForMeetings(req, res) {
    try {
      const { meetingIds } = req.body;

      if (!Array.isArray(meetingIds) || !meetingIds.length) {
        return res.status(400).json({
          success: false,
          message: "meetingIds array is required",
        });
      }

      const result = await AlertService.sendAlertForMeetings(meetingIds);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default AlertController;
