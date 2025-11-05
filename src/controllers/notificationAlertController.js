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
  static async saveOrUpdate(req, res) {
    try {
      const {
        MeetingId,
        AttendeeId,
        AttendeeType,
        EmailAlert,
        SmsAlert,
        EmailStatus,
        EmailStates,
        SmsStatus,
        SmsStates,
      } = req.body;

      // Validate required identifiers
      if (!MeetingId && !AttendeeId && !AttendeeType) {
        return res.status(400).json({ message: "MeetingId, AttendeeId, or AttendeeType is required." });
      }

      // Build unique where condition
      const where = {
        [Op.and]: [
          MeetingId ? { MeetingId } : { MeetingId: null },
          AttendeeId ? { AttendeeId } : { AttendeeId: null },
          AttendeeType ? { AttendeeType } : { AttendeeType: null },
          { IsDeleted: false },
        ],
      };

      // Check if record exists
      const existing = await NotificationAlertSetting.findOne({ where });

      const payload = {
        MeetingId,
        AttendeeId,
        AttendeeType,
        EmailAlert,
        SmsAlert,
        EmailStatus,
        EmailStates,
        SmsStatus,
        SmsStates,
        IsActive: true,
        IsDeleted: false,
      };

      if (existing) {
        await existing.update(payload);
        return res.status(200).json({ message: "Notification setting updated successfully." });
      } else {
        await NotificationAlertSetting.create(payload);
        return res.status(201).json({ message: "Notification setting saved successfully." });
      }
    } catch (error) {
      console.error("Error saving/updating notification setting:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

export default NotificationAlertController;
