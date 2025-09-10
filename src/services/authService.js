import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Role from "../models/Role.js";
import config from "../config/config.js";
import { ERROR_MESSAGES } from "../utils/constants.js";

class AuthService {
  static generateToken(userId) {
    return jwt.sign({ userId }, config.jwt.secret, {
      expiresIn: config.jwt.expire,
    });
  }

  static async register(userData) {
    const { firstName, lastName, emailID, password, mobileNo, roleId } =
      userData;

    const existingUser = await User.findOne({ where: { emailID } });
    if (existingUser) {
      throw new Error(ERROR_MESSAGES.EMAIL_EXISTS);
    }

    const user = await User.create({
      firstName,
      lastName,
      emailID,
      password,
      mobileNo,
      roleId,
    });

    const token = this.generateToken(user.id);

    return { user, token };
  }

  static async login(emailID, password) {
    const user = await User.findOne({
      where: { emailID, isActive: true },
    });

    if (!user) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    await user.update({ lastLogin: new Date() });

    const token = this.generateToken(user.id);

    return { user, token };
  }

  static async getAllRoles() {
    const roles = await Role.findAll({
      attributes: ["id", "name", "description"],
      order: [["name", "ASC"]],
    });
    return roles;
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new Error(ERROR_MESSAGES.INVALID_TOKEN);
    }
  }
}

export default AuthService;
