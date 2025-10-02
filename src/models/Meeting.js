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
      type: DataTypes.STRING,
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
      type: DataTypes.STRING,
      allowNull: false,
    },
    CreateDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    ModifiedBy: {
      type: DataTypes.STRING,
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
      type: DataTypes.STRING,
      allowNull: true,
    },
    EmailStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    SmsState: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    SmsStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "Meeting",
    timestamps: false,
  }
);

export default Meeting;
