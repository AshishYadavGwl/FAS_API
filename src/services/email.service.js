import sgMail from "@sendgrid/mail";
import TemplateService from "./template.service.js";

class EmailService {
  static initialized = false;

  // Initialize SendGrid API once
  static initialize() {
    if (!this.initialized) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.initialized = true;
    }
  }

  // Base method for sending emails
  static async sendEmail(to, subject, template, variables) {
    this.initialize();

    try {
      // Process HTML template with variables
      const html = await TemplateService.processTemplate(template, {
        ...variables,
        currentYear: new Date().getFullYear(),
        logoURL: `${
          process.env.BASE_URL || "http://localhost:3000"
        }/images/logo-with-text.png`,
      });

      // Send email via SendGrid
      await sgMail.send({
        to,
        from: {
          email: process.env.EMAIL_FROM,
          name: process.env.EMAIL_FROM_NAME,
        },
        subject,
        html,
      });

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Send OTP verification email
  static async sendOtpEmail(emailID, otp, userName) {
    return this.sendEmail(
      emailID,
      "Password Reset Verification Code - P Value",
      "otpVerificationTemplate.html",
      { fullName: userName, otp }
    );
  }

  // Send password reset link email
  static async sendResetPasswordEmail(emailID, resetLink, userName) {
    return this.sendEmail(
      emailID,
      "Password Reset Request - P Value",
      "resetPasswordTemplate.html",
      { fullName: userName, resetLink }
    );
  }
}

export default EmailService;
