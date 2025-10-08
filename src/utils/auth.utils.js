const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateLogin = (emailID, password) => {
  if (!emailID?.trim()) return { isValid: false, error: "Email required" };
  if (!EMAIL_REGEX.test(emailID))
    return { isValid: false, error: "Invalid email" };
  if (!password || password.length < 6)
    return { isValid: false, error: "Password must be 6+ characters" };
  return { isValid: true };
};

export const validateRegister = (data) => {
  const { firstName, lastName, emailID, password, mobileNo, role } = data;

  if (!firstName?.trim() || firstName.length < 2)
    return { isValid: false, error: "First name (2-50 chars)" };
  if (!lastName?.trim() || lastName.length < 2)
    return { isValid: false, error: "Last name (2-50 chars)" };
  if (!emailID?.trim() || !EMAIL_REGEX.test(emailID))
    return { isValid: false, error: "Valid email required" };
  if (!password || password.length < 6)
    return { isValid: false, error: "Password (6+ chars)" };
  if (mobileNo && !/^[0-9]{10,15}$/.test(mobileNo))
    return { isValid: false, error: "Invalid mobile (10-15 digits)" };
  if (role && ![1, 2, 3].includes(role))
    return { isValid: false, error: "Role: 1=Admin, 2=Manager, 3=Viewer" };

  return { isValid: true };
};

export const validateResetPassword = (token, password) => {
  if (!token?.trim()) return { isValid: false, error: "Token required" };
  if (!password || password.length < 6)
    return { isValid: false, error: "Password (6+ chars)" };
  return { isValid: true };
};
