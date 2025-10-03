import User from "./User.js";
import OtpVerification from "./OtpVerification.js";
import Meeting from "./Meeting.js";
import MeetingUser from "./MeetingUser.js";

// User -> OTP (One-to-Many) - User can have multiple OTP records
User.hasMany(OtpVerification, {
  foreignKey: "userId",
  as: "otpRecords",
  onDelete: "CASCADE",
});

OtpVerification.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// Meeting -> MeetingUser (One-to-Many) - Meeting has attendees
Meeting.hasMany(MeetingUser, {
  foreignKey: "MeetingID",
  as: "MeetingUsers",
  onDelete: "CASCADE",
});

MeetingUser.belongsTo(Meeting, {
  foreignKey: "MeetingID",
  as: "Meeting",
});

export { User, OtpVerification, Meeting, MeetingUser };
