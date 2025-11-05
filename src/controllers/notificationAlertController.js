import NotificationAlertSetting from "../models/NotificationAlertSetting.js";

class NotificationAlertController {
  /**
   * Get all alert settings by Meeting ID
   */
  static async getByMeetingId(req, res) {
    try {
      const { id } = req.params;

      const alerts = await NotificationAlertSetting.findAll({
        where: { MeetingId: id },
      });

      if (!alerts || alerts.length === 0) {
        return res.status(404).json({ message: "No records found for this Meeting ID" });
      }

      return res.status(200).json(alerts);
    } catch (error) {
      console.error("Error fetching alerts by MeetingId:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  /**
   * Get all alert settings by Attendee ID
   */
  static async getByAttendeeId(req, res) {
    try {
      const { id } = req.params;

      const alerts = await NotificationAlertSetting.findAll({
        where: { AttendeeId: id },
      });

      if (!alerts || alerts.length === 0) {
        return res.status(404).json({ message: "No records found for this Attendee ID" });
      }

      return res.status(200).json(alerts);
    } catch (error) {
      console.error("Error fetching alerts by AttendeeId:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  /**
   * Get all alert settings by Attendee Type
   */
  static async getByAttendeeType(req, res) {
    try {
      const { type } = req.params;

      const alerts = await NotificationAlertSetting.findAll({
        where: { AttendeeType: type },
      });

      if (!alerts || alerts.length === 0) {
        return res.status(404).json({ message: "No records found for this Attendee Type" });
      }

      return res.status(200).json(alerts);
    } catch (error) {
      console.error("Error fetching alerts by AttendeeType:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

export default NotificationAlertController;
