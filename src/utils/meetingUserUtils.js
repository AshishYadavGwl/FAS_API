import { Op } from "sequelize";
import { sequelize } from "../config/database.js";
import Meeting from "../models/Meeting.js";

// Case-insensitive LIKE helper
export const ciLike = (col, val) =>
  sequelize.where(sequelize.fn("LOWER", col), {
    [Op.like]: `%${val.toLowerCase()}%`,
  });

// Exact date match helper
export const dateEq = (col, val) =>
  sequelize.where(sequelize.fn("DATE", col), sequelize.fn("DATE", val));

// Sort field mapping - CAPITAL M in alias
export const SORT_MAP = {
  meetingname: [{ model: Meeting, as: "Meeting" }, "MeetingName"], // ← Capital M
  emailid: ["EmailId"],
  status: ["Status"],
  state: ["State"],
  departureflightnumber: ["DepartureFlightNumber"],
  departuredatetime: ["DepartureDateTime"],
  arrivaldatetime: ["ArrivalDateTime"],
  originairport: ["OriginAirport"],
  destinationairport: ["DestinationAirport"],
  fullname: [
    sequelize.fn(
      "CONCAT",
      sequelize.col("MeetingUser.FirstName"),
      " ",
      sequelize.col("MeetingUser.LastName")
    ),
  ],
  attendeetype: ["AttendeeType"],
  phonenumber: ["PhoneNumber"],
  carriername: ["CarrierName"],
  createdby: ["CreatedBy"],
};

// Build search conditions
export const buildSearchConditions = (search) => {
  const or = [];
  if (!search) return or;

  const s = search.toLowerCase();

  or.push(
    ciLike(sequelize.col("MeetingUser.EmailId"), s),
    ciLike(sequelize.col("MeetingUser.Status"), s),
    ciLike(sequelize.col("MeetingUser.State"), s),
    ciLike(sequelize.col("MeetingUser.DepartureFlightNumber"), s),
    sequelize.where(
      sequelize.fn(
        "LOWER",
        sequelize.cast(sequelize.col("MeetingUser.DepartureDateTime"), "CHAR")
      ),
      { [Op.like]: `%${s}%` }
    ),
    sequelize.where(
      sequelize.fn(
        "LOWER",
        sequelize.cast(sequelize.col("MeetingUser.ArrivalDateTime"), "CHAR")
      ),
      { [Op.like]: `%${s}%` }
    ),
    ciLike(sequelize.col("MeetingUser.OriginAirport"), s),
    ciLike(sequelize.col("MeetingUser.DestinationAirport"), s),
    ciLike(
      sequelize.fn(
        "CONCAT",
        sequelize.col("MeetingUser.FirstName"),
        " ",
        sequelize.col("MeetingUser.LastName")
      ),
      s
    ),
    ciLike(sequelize.col("MeetingUser.AttendeeType"), s),
    ciLike(sequelize.col("MeetingUser.PhoneNumber"), s),
    ciLike(sequelize.col("MeetingUser.CarrierName"), s),
    ciLike(sequelize.col("MeetingUser.CreatedBy"), s),
    ciLike(sequelize.col("Meeting.MeetingName"), s) // ← Capital M
  );

  return or;
};

// Build filter conditions
export const buildFilterConditions = (filters) => {
  const and = [];

  if (filters.emailId)
    and.push(ciLike(sequelize.col("MeetingUser.EmailId"), filters.emailId));
  if (filters.status)
    and.push(ciLike(sequelize.col("MeetingUser.Status"), filters.status));
  if (filters.state)
    and.push(ciLike(sequelize.col("MeetingUser.State"), filters.state));
  if (filters.departureFlightNumber)
    and.push(
      ciLike(
        sequelize.col("MeetingUser.DepartureFlightNumber"),
        filters.departureFlightNumber
      )
    );
  if (filters.departureDateTime)
    and.push(
      dateEq(
        sequelize.col("MeetingUser.DepartureDateTime"),
        filters.departureDateTime
      )
    );
  if (filters.arrivalDateTime)
    and.push(
      dateEq(
        sequelize.col("MeetingUser.ArrivalDateTime"),
        filters.arrivalDateTime
      )
    );
  if (filters.originAirport)
    and.push(
      ciLike(sequelize.col("MeetingUser.OriginAirport"), filters.originAirport)
    );
  if (filters.destinationAirport)
    and.push(
      ciLike(
        sequelize.col("MeetingUser.DestinationAirport"),
        filters.destinationAirport
      )
    );
  if (filters.fullName)
    and.push(
      ciLike(
        sequelize.fn(
          "CONCAT",
          sequelize.col("MeetingUser.FirstName"),
          " ",
          sequelize.col("MeetingUser.LastName")
        ),
        filters.fullName
      )
    );
  if (filters.attendeeType)
    and.push(
      ciLike(sequelize.col("MeetingUser.AttendeeType"), filters.attendeeType)
    );
  if (filters.phoneNumber)
    and.push(
      ciLike(sequelize.col("MeetingUser.PhoneNumber"), filters.phoneNumber)
    );
  if (filters.carrierName)
    and.push(
      ciLike(sequelize.col("MeetingUser.CarrierName"), filters.carrierName)
    );
  if (filters.createdBy)
    and.push(ciLike(sequelize.col("MeetingUser.CreatedBy"), filters.createdBy));

  return and;
};

// Build sort order
export const buildSortOrder = (sortBy, sortOrder) => {
  const key = (sortBy || "departureDateTime").toString().toLowerCase();
  const dir = sortOrder === "ASC" ? "ASC" : "DESC";

  if (key === "fullname") {
    return [[SORT_MAP.fullname[0], dir]];
  } else if (key === "meetingname") {
    return [[{ model: Meeting, as: "Meeting" }, "MeetingName", dir]]; // ← Capital M
  } else if (SORT_MAP[key]) {
    return [[SORT_MAP[key][0], dir]];
  }

  return [["DepartureDateTime", "DESC"]];
};

// Build Meeting include
export const buildMeetingInclude = (meetingNameFilter) => {
  return {
    model: Meeting,
    as: "Meeting", // ← Capital M
    required: !!meetingNameFilter,
    attributes: ["Id", "MeetingName"],
    ...(meetingNameFilter && {
      where: ciLike(sequelize.col("Meeting.MeetingName"), meetingNameFilter), // ← Capital M
    }),
  };
};
