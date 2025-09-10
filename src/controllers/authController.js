import { Op } from "sequelize";
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

  static async sendResetOtp(req, res) {
    try {
      const { emailID } = req.body;

      if (!emailID || !/\S+@\S+\.\S+/.test(emailID)) {
        return ApiResponse.error(res, "Valid email is required", 400);
      }

      const user = await User.findOne({ where: { emailID, isActive: true } });
      if (!user) {
        return ApiResponse.success(
          res,
          null,
          "If account exists, OTP has been sent to your email"
        );
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await OtpVerification.destroy({
        where: { userId: user.id, purpose: "PASSWORD_RESET", isUsed: false },
      });

      await OtpVerification.create({
        userId: user.id,
        emailID,
        otp,
        purpose: "PASSWORD_RESET",
        expiresAt,
        ipAddress: req.ip || "unknown",
      });

      await EmailService.sendOtpEmail(
        emailID,
        otp,
        `${user.firstName} ${user.lastName}`
      );

      return ApiResponse.success(
        res,
        { expiresIn: "10 minutes" },
        "OTP sent to your email successfully"
      );
    } catch (error) {
      console.error("Send OTP error:", error);
      return ApiResponse.error(res, "Failed to send OTP", 500);
    }
  }

  static async resetPasswordWithOtp(req, res) {
    try {
      const { emailID, otp, newPassword } = req.body;

      if (!emailID || !/\S+@\S+\.\S+/.test(emailID)) {
        return ApiResponse.error(res, "Valid email is required", 400);
      }

      if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
        return ApiResponse.error(res, "Valid 6-digit OTP is required", 400);
      }

      if (!newPassword || newPassword.length < 6) {
        return ApiResponse.error(
          res,
          "Password must be at least 6 characters long",
          400
        );
      }

      const otpRecord = await OtpVerification.findOne({
        where: {
          emailID,
          otp,
          purpose: "PASSWORD_RESET",
          isUsed: false,
          expiresAt: { [Op.gt]: new Date() },
        },
      });

      if (!otpRecord) {
        return ApiResponse.error(res, "Invalid or expired OTP", 400);
      }

      const user = await User.findByPk(otpRecord.userId);
      if (!user) {
        return ApiResponse.error(res, "User not found", 404);
      }

      await user.update({ password: newPassword });
      await otpRecord.update({ isUsed: true });

      return ApiResponse.success(res, null, "Password reset successfully");
    } catch (error) {
      console.error("Reset password error:", error);
      return ApiResponse.error(res, "Failed to reset password", 500);
    }
  }
  
}

export default AuthController;
