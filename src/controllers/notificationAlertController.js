import NotificationAlertSetting from "../models/NotificationAlertSetting.js";

// Get NotificationAlertSetting by ID
export const getNotificationAlertById = async (req, res) => {
  try {
    const { id } = req.params; // /api/notification/:id

    const alert = await NotificationAlertSetting.findOne({
      where: { Id: id },
    });

    if (!alert) {
      return res.status(404).json({ message: "Record not found" });
    }

    return res.status(200).json(alert);
  } catch (error) {
    console.error("Error fetching NotificationAlertSetting:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
