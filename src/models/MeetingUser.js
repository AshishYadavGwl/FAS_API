import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const MeetingUser = sequelize.define(
  "MeetingUser",
  {
    Id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    FirstName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    LastName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    EmailId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    PhoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    AttendeeType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    DepartureAirline: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    ArrivalAirline: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    DepartureFlightNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    ArrivalFlightNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    DepartureDateTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ArrivalDateTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    OriginAirport: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    DestinationAirport: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    IsDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    IsActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    CreatedBy: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    CreateDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    ModifiedBy: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    ModifiedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    MeetingID: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Meeting",
        key: "Id",
      },
    },
    CarrierCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    CodeType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    FlightType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    FlightLabel: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    LastSyncDateTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    AlertId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    Status: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    State: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    EmailSend: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    SmsSend: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    CarrierName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    Notificationcount: {
      type: DataTypes.SMALLINT,
      defaultValue: 0,
      allowNull: false,
    },
    LastSyncDateTimeUtc: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    MessageTimestamp: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    MessageId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    LastSequenceNumber: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: 0,
    },
    LastEventOffset: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    tableName: "MeetingUser",
    timestamps: false,
    indexes: [
      {
        name: "idx_meeting_active",
        fields: ["MeetingID", "IsDeleted", "IsActive"],
      },
      {
        name: "idx_email_search",
        fields: ["EmailId", "IsDeleted"],
      },
      {
        name: "idx_departure_tracking",
        fields: ["DepartureFlightNumber", "DepartureDateTime", "IsDeleted"],
      },
      {
        name: "idx_arrival_tracking",
        fields: ["ArrivalFlightNumber", "ArrivalDateTime", "IsDeleted"],
      },
      {
        name: "idx_status_filter",
        fields: ["Status", "State", "IsDeleted"],
      },
      {
        name: "idx_notification",
        fields: ["EmailSend", "SmsSend", "IsDeleted"],
      },
      {
        name: "idx_alert",
        fields: ["AlertId", "IsDeleted"],
      },
      {
        name: "idx_alert_sequence",
        fields: ["AlertId", "LastSequenceNumber", "IsDeleted"],
      },
      {
        fields: ["CreateDate"],
      },
    ],
  }
);

export default MeetingUser;
