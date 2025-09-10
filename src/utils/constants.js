export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

export const ERROR_MESSAGES = {
  USER_NOT_FOUND: "User not found",
  EMAIL_EXISTS: "Email already registered",
  INVALID_CREDENTIALS: "Invalid email or password",
  UNAUTHORIZED: "Access denied. No token provided",
  INVALID_TOKEN: "Invalid token",
  VALIDATION_ERROR: "Validation failed",
  SERVER_ERROR: "Internal server error",
};

export const SUCCESS_MESSAGES = {
  USER_REGISTERED: "User registered successfully",
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logout successful",
};
