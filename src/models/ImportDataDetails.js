import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const ImportDataDetails = sequelize.define(
  "ImportDataDetails",
  {
    Id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    FileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    FileFullPath: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    CreatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    CreateDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
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
  },
  {
    tableName: "ImportDataDetails",
    timestamps: false,
  }
);

export default ImportDataDetails;
