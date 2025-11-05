import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const NotificationAlertSetting = sequelize.define(
  "NotificationAlertSetting",
  {
    Id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    MeetingId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    AttendeeType: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    AttendeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    EmailAlert: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    SmsAlert: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    EmailStatus: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    EmailStates: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    SmsStatus: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    SmsStates: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  },
  {
    tableName: "NotificationAlertSetting",
    timestamps: false,
  }
);

export default NotificationAlertSetting;
