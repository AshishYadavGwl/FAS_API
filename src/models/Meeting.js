import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Meeting = sequelize.define(
  "Meeting",
  {
    Id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    MeetingName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    IsDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    IsActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    CreatedBy: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    CreateDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    ModifiedBy: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    ModifiedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    EmailAlert: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    SmsAlert: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    EmailState: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    EmailStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    SmsState: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    SmsStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    tableName: "Meeting",
    timestamps: false,
    indexes: [
      {
        name: "idx_active_meetings",
        fields: ["IsDeleted", "IsActive"],
      },
      {
        name: "idx_meeting_name",
        fields: ["MeetingName", "IsDeleted"],
      },
      {
        name: "idx_alerts",
        fields: ["EmailAlert", "SmsAlert", "IsDeleted"],
      },
      {
        fields: ["CreatedBy", "IsDeleted"],
      },
      {
        fields: ["CreateDate"],
      },
    ],
  }
);

export default Meeting;
