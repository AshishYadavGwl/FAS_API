import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const OtpVerification = sequelize.define(
  "OtpVerification",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    emailID: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    otp: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    purpose: {
      type: DataTypes.ENUM("PASSWORD_RESET", "EMAIL_VERIFICATION"),
      allowNull: false,
      defaultValue: "PASSWORD_RESET",
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "otp_verifications",
    timestamps: false,
    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["emailID"],
      },
      {
        fields: ["otp"],
      },
      {
        fields: ["expiresAt"],
      },
    ],
  }
);

export default OtpVerification;
