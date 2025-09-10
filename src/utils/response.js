class ApiResponse {
  static success(res, data = null, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  static error(
    res,
    message = "Internal Server Error",
    statusCode = 500,
    errors = null
  ) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  static validationError(res, errors) {
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors,
      timestamp: new Date().toISOString(),
    });
  }
}

export default ApiResponse;
