import ApiResponse from "../utils/response.js";

export const validateRegister = (req, res, next) => {
  const { firstName, lastName, emailID, password, roleId } = req.body;
  const errors = [];

  if (!firstName || firstName.trim().length < 2) {
    errors.push("First name must be at least 2 characters long");
  }

  if (!lastName || lastName.trim().length < 2) {
    errors.push("Last name must be at least 2 characters long");
  }

  if (!emailID || !/\S+@\S+\.\S+/.test(emailID)) {
    errors.push("Valid email is required");
  }

  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (!roleId) {
    errors.push("Role selection is required");
  }

  if (
    req.body.mobileNo &&
    (req.body.mobileNo.length < 10 || req.body.mobileNo.length > 15)
  ) {
    errors.push("Mobile number must be between 10-15 digits");
  }

  if (errors.length > 0) {
    return ApiResponse.validationError(res, errors);
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { emailID, password } = req.body;
  const errors = [];

  if (!emailID || !/\S+@\S+\.\S+/.test(emailID)) {
    errors.push("Valid email is required");
  }

  if (!password) {
    errors.push("Password is required");
  }

  if (errors.length > 0) {
    return ApiResponse.validationError(res, errors);
  }

  next();
};
