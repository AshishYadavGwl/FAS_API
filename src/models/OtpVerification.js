import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const OtpVerification = sequelize.define(
  "OtpVerification",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    emailID: {
      type: DataTypes.STRING(100),
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
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "PASSWORD_RESET",
      validate: {
        isIn: [["PASSWORD_RESET", "EMAIL_VERIFICATION"]],
      },
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
      type: DataTypes.SMALLINT,
      defaultValue: 0,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    tableName: "otp_verifications",
    timestamps: true,
    createdAt: true,
    updatedAt: false,
    indexes: [
      {
        name: "idx_otp_lookup",
        fields: ["otp", "purpose", "isUsed", "expiresAt"],
      },
      {
        name: "idx_user_purpose",
        fields: ["userId", "purpose", "isUsed"],
      },
      {
        fields: ["expiresAt", "isUsed"],
      },
      {
        fields: ["userId"],
      },
    ],
  }
);

export default OtpVerification;
