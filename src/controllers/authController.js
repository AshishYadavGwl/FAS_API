import AuthService from "../services/authService.js";
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
}

export default AuthController;
