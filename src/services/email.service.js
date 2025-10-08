import sgMail from "@sendgrid/mail";
import TemplateService from "./template.service.js";
import EmailUtils from "../utils/email.utils.js";

class EmailService {
  static initialized = false;

  static initialize() {
    if (!this.initialized) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.initialized = true;
    }
  }

  // Send Mail
  static async sendEmail(to, subject, template, variables) {
    this.initialize();
    const html = await TemplateService.processTemplate(template, {
      ...variables,
      currentYear: new Date().getFullYear(),
    });

    await sgMail.send({
      to,
      from: {
        email: process.env.EMAIL_FROM,
        name: process.env.EMAIL_FROM_NAME,
      },
      subject,
      html,
    });
  }

  // Alert created email
  static async sendAlertCreatedEmail(userData) {
    const flightId = EmailUtils.getFlightId(
      userData.carrierCode,
      userData.flightNumber
    );

    await this.sendEmail(
      userData.emailId,
      `✈️ Flight Alert - ${flightId}`,
      "alertCreatedTemplate.html",
      {
        fullName: EmailUtils.getFullName(userData.firstName, userData.lastName),
        carrierCode: userData.carrierCode,
        flightNumber: userData.flightNumber,
        originAirport: userData.originAirport,
        destinationAirport: userData.destinationAirport,
        departureDateTime: EmailUtils.formatDateTime(
          userData.departureDateTime
        ),
      }
    );
  }

  // Status update email
  static async sendStatusUpdateEmail(userData, statusData) {
    const flightId = EmailUtils.getFlightId(
      userData.CarrierCode,
      userData.DepartureFlightNumber
    );

    await this.sendEmail(
      userData.EmailId,
      `Flight Update: ${flightId} - ${statusData.status}`,
      "flightStatusUpdateTemplate.html",
      {
        fullName: EmailUtils.getFullName(userData.FirstName, userData.LastName),
        carrierCode: userData.CarrierCode,
        flightNumber: userData.DepartureFlightNumber,
        originAirport: userData.OriginAirport,
        destinationAirport: userData.DestinationAirport,
        status: statusData.status,
        state: statusData.state,
        timeVariation: statusData.time,
        departureDateTime: EmailUtils.formatDateTime(
          userData.DepartureDateTime
        ),
      }
    );
  }

  // OTP email
  static async sendOtpEmail(emailID, otp, userName) {
    await this.sendEmail(
      emailID,
      "Password Reset Code - P Value",
      "otpVerificationTemplate.html",
      { fullName: userName, otp }
    );
  }

  // Reset password email
  static async sendResetPasswordEmail(emailID, resetLink, userName) {
    await this.sendEmail(
      emailID,
      "Password Reset - P Value",
      "resetPasswordTemplate.html",
      { fullName: userName, resetLink }
    );
  }
}

export default EmailService;
