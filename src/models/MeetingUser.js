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
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    LastName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    EmailId: {
      type: DataTypes.STRING(255),
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
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    DepartureAirline: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    ArrivalAirline: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    DepartureFlightNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ArrivalFlightNumber: {
      type: DataTypes.STRING(50),
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
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    CreateDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    ModifiedBy: {
      type: DataTypes.STRING(255),
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
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
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
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    Status: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    State: {
      type: DataTypes.STRING(100),
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
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    Notificationcount: {
      type: DataTypes.INTEGER,
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
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "MeetingUser",
    timestamps: false,
    indexes: [
      {
        fields: ["MeetingID"],
      },
      {
        fields: ["EmailId"],
      },
      {
        fields: ["IsDeleted", "IsActive"],
      },
    ],
  }
);

export default MeetingUser;
