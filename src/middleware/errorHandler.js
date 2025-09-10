import ApiResponse from "../utils/response.js";
import { HTTP_STATUS } from "../utils/constants.js";

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  if (err.name === "SequelizeValidationError") {
    const errors = err.errors.map((error) => error.message);
    return ApiResponse.validationError(res, errors);
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    return ApiResponse.error(res, "Email already exists", HTTP_STATUS.CONFLICT);
  }

  if (err.name === "JsonWebTokenError") {
    return ApiResponse.error(res, "Invalid token", HTTP_STATUS.UNAUTHORIZED);
  }

  return ApiResponse.error(
    res,
    err.message || "Internal Server Error",
    HTTP_STATUS.INTERNAL_SERVER_ERROR
  );
};

export default errorHandler;
