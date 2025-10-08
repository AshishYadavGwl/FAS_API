import AuthService from "../services/auth.service.js";
import User from "../models/User.js";
import ApiResponse from "../utils/response.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../utils/constants.js";

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : null;

    if (!token) {
      return ApiResponse.error(
        res,
        ERROR_MESSAGES.UNAUTHORIZED,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    const decoded = AuthService.verifyToken(token);

    const user = await User.findByPk(decoded.userId);

    if (!user || !user.isActive) {
      return ApiResponse.error(
        res,
        ERROR_MESSAGES.USER_NOT_FOUND,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    req.user = user;
    next();
  } catch (error) {
    return ApiResponse.error(
      res,
      ERROR_MESSAGES.INVALID_TOKEN,
      HTTP_STATUS.UNAUTHORIZED
    );
  }
};
