import { Op } from "sequelize";
import crypto from "node:crypto";
import { sequelize } from "../config/database.js";
import User from "../models/User.js";
import OtpVerification from "../models/OtpVerification.js";
import AuthService from "../services/auth.service.js";
import EmailService from "../services/email.service.js";
import ApiResponse from "../utils/response.utils.js";
import {
  validateLogin,
  validateRegister,
  validateResetPassword,
} from "../utils/auth.utils.js";

class AuthController {
  // Login user
  // AY
  static async login(req, res) {
    const { emailID, password } = req.body;
    const validation = validateLogin(emailID, password);

    if (!validation.isValid)
      return ApiResponse.error(res, validation.error, 400);

    try {
      const { user, token } = await AuthService.login(emailID, password);
      return ApiResponse.success(res, { user, token }, "Login successful");
    } catch (error) {
      return ApiResponse.error(
        res,
        error.message,
        error.message === "Invalid credentials" ? 401 : 500
      );
    }
  }

  // Register User
  // AY
  static async register(req, res) {
    const validation = validateRegister(req.body);

    if (!validation.isValid)
      return ApiResponse.error(res, validation.error, 400);

    try {
      const { user, token } = await AuthService.register(req.body);
      return ApiResponse.success(res, { user, token }, "User registered", 201);
    } catch (error) {
      return ApiResponse.error(
        res,
        error.message,
        error.message === "Email exists" ? 409 : 500
      );
    }
  }

  // Send Reset Link
  static async sendResetLink(req, res) {
    const { emailID } = req.body;

    if (!emailID?.trim()) return ApiResponse.error(res, "Email required", 400);

    try {
      const user = await User.findOne({
        where: { emailID, isActive: true },
        attributes: ["id", "firstName", "lastName"],
      });

      if (!user) {
        return ApiResponse.success(
          res,
          null,
          "Reset link sent if account exists"
        );
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 1800000);

      await sequelize.transaction(async (t) => {
        await OtpVerification.destroy({
          where: { userId: user.id, purpose: "PASSWORD_RESET", isUsed: false },
          transaction: t,
        });

        await OtpVerification.create(
          {
            userId: user.id,
            emailID,
            otp: token,
            purpose: "PASSWORD_RESET",
            expiresAt,
            ipAddress: req.ip || "unknown",
            userAgent: req.get("user-agent"),
          },
          { transaction: t }
        );
      });

      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      EmailService.sendResetPasswordEmail(
        emailID,
        resetLink,
        `${user.firstName} ${user.lastName}`
      ).catch(() => {});

      return ApiResponse.success(
        res,
        { expiresIn: "30 minutes" },
        "Reset link sent"
      );
    } catch (error) {
      return ApiResponse.error(res, "Failed to send reset link", 500);
    }
  }

  // Reset Password
  static async resetPassword(req, res) {
    const { token, newPassword } = req.body;
    const validation = validateResetPassword(token, newPassword);

    if (!validation.isValid)
      return ApiResponse.error(res, validation.error, 400);

    try {
      const tokenRecord = await OtpVerification.findOne({
        where: {
          otp: token,
          purpose: "PASSWORD_RESET",
          isUsed: false,
          expiresAt: { [Op.gt]: new Date() },
        },
        attributes: ["id", "userId"],
      });

      if (!tokenRecord) {
        return ApiResponse.error(res, "Invalid or expired token", 400);
      }

      const user = await User.findByPk(tokenRecord.userId);
      if (!user) {
        return ApiResponse.error(res, "User not found", 404);
      }

      await sequelize.transaction(async (t) => {
        await Promise.all([
          user.update({ password: newPassword }, { transaction: t }),
          tokenRecord.update({ isUsed: true }, { transaction: t }),
        ]);
      });

      return ApiResponse.success(res, null, "Password reset successful");
    } catch (error) {
      return ApiResponse.error(res, "Failed to reset password", 500);
    }
  }
}

export default AuthController;
