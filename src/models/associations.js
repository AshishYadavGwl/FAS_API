import Meeting from "./Meeting.js";
import MeetingUser from "./MeetingUser.js";

// Define associations here to avoid circular imports
Meeting.hasMany(MeetingUser, {
  foreignKey: "MeetingID",
  as: "MeetingUsers",
});

MeetingUser.belongsTo(Meeting, {
  foreignKey: "MeetingID",
  as: "Meeting",
});

export { Meeting, MeetingUser };
