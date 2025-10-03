import { DataTypes } from "sequelize";
import bcrypt from "bcryptjs";
import { sequelize } from "../config/database.js";

// Role mapping constants
export const ROLES = {
  ADMIN: 1,
  MANAGER: 2,
  VIEWER: 3,
};

export const ROLE_NAMES = {
  1: "Admin",
  2: "Manager",
  3: "Viewer",
};

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [2, 50],
        notEmpty: true,
      },
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [2, 50],
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [6, 100],
        notEmpty: true,
      },
    },
    emailID: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    mobileNo: {
      type: DataTypes.STRING(15),
      allowNull: true,
      validate: {
        len: [10, 15],
      },
    },
    role: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: ROLES.VIEWER,
      validate: {
        isIn: [[1, 2, 3]],
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    createdAt: "createDate",
    updatedAt: false,
    tableName: "users",
    indexes: [
      { fields: ["emailID"], unique: true },
      { fields: ["role"] },
      { fields: ["isActive"] },
    ],
  }
);

// Hooks
User.beforeCreate(async (user) => {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed("password")) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

// Instance methods
User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  values.roleName = ROLE_NAMES[values.role];
  return values;
};

User.prototype.isAdmin = function () {
  return this.role === ROLES.ADMIN;
};

User.prototype.isManager = function () {
  return this.role === ROLES.MANAGER;
};

User.prototype.isViewer = function () {
  return this.role === ROLES.VIEWER;
};

export default User;
