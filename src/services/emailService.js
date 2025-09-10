import sgMail from "@sendgrid/mail";
import TemplateService from "./templateService.js";

class EmailService {
  static initialized = false;

  static initialize() {
    if (!this.initialized) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.initialized = true;
    }
  }

  static getLogoURL() {
    const baseURL = process.env.BASE_URL || "http://localhost:3000";
    return `${baseURL}/images/logo-with-text.png`;
  }

  static async sendOtpEmail(emailID, otp, userName) {
    this.initialize();

    // Variables for your exact template
    const variables = {
      fullName: userName,
      otp: otp,
      currentYear: new Date().getFullYear(),
      logoURL: this.getLogoURL(), 
    };

    try {
      const htmlContent = await TemplateService.processTemplate(
        "otpVerificationTemplate.html",
        variables
      );

      const message = {
        to: emailID,
        from: {
          email: process.env.EMAIL_FROM,
          name: process.env.EMAIL_FROM_NAME,
        },
        subject: "🔐 Password Reset Verification Code - P Value",
        html: htmlContent,
      };

      await sgMail.send(message);
      console.log(`✅ P-Value OTP email sent to ${emailID}`);
      return true;
    } catch (error) {
      console.error(`❌ Email send failed:`, error.message);
      throw error;
    }
  }
}

export default EmailService;
