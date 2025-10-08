import jwt from "jsonwebtoken";
import User, { ROLES } from "../models/User.js";
import config from "../config/config.js";

class AuthService {
  // Register user
  static async register(data) {
    const {
      firstName,
      lastName,
      emailID,
      password,
      mobileNo,
      role = ROLES.VIEWER,
    } = data;

    const existingUser = await User.findOne({
      where: { emailID },
      attributes: ["id"],
    });
    if (existingUser) throw new Error("Email exists");

    if (![1, 2, 3].includes(role)) throw new Error("Invalid role");

    const user = await User.create({
      firstName,
      lastName,
      emailID,
      password,
      mobileNo,
      role,
    });
    const token = this.generateToken(user.id, user.role);

    return { user, token };
  }

  // Login user
  static async login(emailID, password) {
    const user = await User.findOne({
      where: { emailID, isActive: true },
    });

    if (!user || !(await user.comparePassword(password))) {
      throw new Error("Invalid credentials");
    }

    const token = this.generateToken(user.id, user.role);

    return { user, token };
  }

  // Generate jwt auth token
  static generateToken(userId, role) {
    return jwt.sign({ userId, role }, config.jwt.secret, {
      expiresIn: config.jwt.expire,
    });
  }

  // Verify Jwt token
  static verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch {
      throw new Error("Invalid token");
    }
  }
}

export default AuthService;
