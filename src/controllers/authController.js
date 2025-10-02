import { Op } from "sequelize";
import crypto from "node:crypto";
import User from "../models/User.js";
import OtpVerification from "../models/OtpVerification.js";
import AuthService from "../services/authService.js";
import EmailService from "../services/emailService.js";
import ApiResponse from "../utils/response.js";
import {
  HTTP_STATUS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
} from "../utils/constants.js";

class AuthController {
  static async register(req, res) {
    try {
      const { user, token } = await AuthService.register(req.body);

      return ApiResponse.success(
        res,
        { user, token },
        SUCCESS_MESSAGES.USER_REGISTERED,
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      if (error.message === ERROR_MESSAGES.EMAIL_EXISTS) {
        return ApiResponse.error(res, error.message, HTTP_STATUS.CONFLICT);
      }

      return ApiResponse.error(
        res,
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  static async login(req, res) {
    try {
      const { emailID, password } = req.body;
      const { user, token } = await AuthService.login(emailID, password);

      return ApiResponse.success(
        res,
        { user, token },
        SUCCESS_MESSAGES.LOGIN_SUCCESS
      );
    } catch (error) {
      if (error.message === ERROR_MESSAGES.INVALID_CREDENTIALS) {
        return ApiResponse.error(res, error.message, HTTP_STATUS.UNAUTHORIZED);
      }

      return ApiResponse.error(
        res,
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  static async getProfile(req, res) {
    try {
      return ApiResponse.success(
        res,
        { user: req.user },
        "Profile retrieved successfully"
      );
    } catch (error) {
      return ApiResponse.error(
        res,
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  static async getRoles(req, res) {
    try {
      const roles = await AuthService.getAllRoles();

      return ApiResponse.success(
        res,
        { roles },
        "Roles retrieved successfully"
      );
    } catch (error) {
      return ApiResponse.error(
        res,
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  // NEW: Send Reset Link
  static async sendResetLink(req, res) {
    try {
      const { emailID } = req.body;

      // if (!emailID || !/\S+@\S+\.\S+/.test(emailID)) {
      //   return ApiResponse.error(res, "Valid email is required", 400);
      // }

      const user = await User.findOne({ where: { emailID, isActive: true } });
      if (!user) {
        return ApiResponse.success(
          res,
          null,
          "If account exists, a reset link has been sent to your email"
        );
      }

      // Generate unique token (64 characters)
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      // Delete old tokens
      await OtpVerification.destroy({
        where: { userId: user.id, purpose: "PASSWORD_RESET", isUsed: false },
      });

      // Store token
      await OtpVerification.create({
        userId: user.id,
        emailID,
        otp: resetToken, // Using 'otp' field to store token
        purpose: "PASSWORD_RESET",
        expiresAt,
        ipAddress: req.ip || "unknown",
      });

      // Send email with reset link
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await EmailService.sendResetPasswordEmail(
        emailID,
        resetLink,
        `${user.firstName} ${user.lastName}`
      );

      return ApiResponse.success(
        res,
        { expiresIn: "30 minutes" },
        "Password reset link sent to your email"
      );
    } catch (error) {
      console.error("Send reset link error:", error);
      return ApiResponse.error(res, "Failed to send reset link", 500);
    }
  }

  // NEW: Reset Password with Token
  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token) {
        return ApiResponse.error(res, "Reset token is required", 400);
      }

      if (!newPassword || newPassword.length < 6) {
        return ApiResponse.error(
          res,
          "Password must be at least 6 characters long",
          400
        );
      }

      // Find valid token
      const tokenRecord = await OtpVerification.findOne({
        where: {
          otp: token,
          purpose: "PASSWORD_RESET",
          isUsed: false,
          expiresAt: { [Op.gt]: new Date() },
        },
      });

      if (!tokenRecord) {
        return ApiResponse.error(res, "Invalid or expired reset link", 400);
      }

      const user = await User.findByPk(tokenRecord.userId);
      if (!user) {
        return ApiResponse.error(res, "User not found", 404);
      }

      // Update password (will be hashed by User model hook)
      await user.update({ password: newPassword });
      await tokenRecord.update({ isUsed: true });

      return ApiResponse.success(res, null, "Password reset successfully");
    } catch (error) {
      console.error("Reset password error:", error);
      return ApiResponse.error(res, "Failed to reset password", 500);
    }
  }
}

export default AuthController;
