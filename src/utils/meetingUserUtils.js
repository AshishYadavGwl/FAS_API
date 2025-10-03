import { Op } from "sequelize";
import { sequelize } from "../config/database.js";
import Meeting from "../models/Meeting.js";
import moment from "moment";

// Supported date formats for parsing
const DATE_FORMATS = [
  "YYYY-MM-DD HH:mm:ss",
  "YYYY-MM-DDTHH:mm:ss",
  "MM/DD/YYYY hh:mm A",
  "MM-DD-YYYY hh:mm A",
  "MM-DD-YYYY HH:mm",
  "MM-DD-YYYY HH:mm:ss",
  "DD-MM-YYYY HH:mm:ss",
  moment.ISO_8601,
];

export function parseDateTime(dateStr) {
  return dateStr ? moment(dateStr, DATE_FORMATS, true).toDate() : null;
}

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

// Validates array of meeting users for bulk creation
export function isValidateMeetingUser(users) {
  // Check if input is array
  if (!Array.isArray(users)) {
    return { valid: false, errors: ["Input must be an array"] };
  }

  const errors = [];

  // Regex patterns for validation
  const patterns = {
    email: /^[\w.-]+@[\w.-]+\.\w+$/,
    number: /^\d+$/,
    // Supports: YYYY-MM-DD HH:mm:ss, ISO 8601, MM/DD/YYYY hh:mm AM/PM
    date: /^\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}(:\d{2})?(\.\d{3})?Z?$|^\d{2}[-/]\d{2}[-/]\d{4}\s\d{2}:\d{2}(:\d{2})?(\s(AM|PM))?$/,
  };

  // Field configuration: [fields, validator, errorMsg]
  const validations = [
    // Required fields
    [
      ["MeetingID", "FirstName", "LastName", "EmailId", "PhoneNumber"],
      (u, f) => !u[f],
      (f, i) => `${f} required at index ${i}`,
    ],

    // Email validation
    [
      ["EmailId"],
      (u, f) => u[f] && !patterns.email.test(u[f]),
      (f, i) => `Invalid EmailId at index ${i}`,
    ],

    // Optional string fields
    [
      [
        "CarrierCode",
        "AttendeeType",
        "OriginAirport",
        "DestinationAirport",
        "FlightLabel",
      ],
      (u, f) => u[f] != null && typeof u[f] !== "string",
      (f, i) => `${f} must be string at index ${i}`,
    ],

    // Optional numeric fields
    [
      ["DepartureFlightNumber", "ArrivalFlightNumber"],
      (u, f) => u[f] != null && !patterns.number.test(String(u[f])),
      (f, i) => `${f} must be numeric at index ${i}`,
    ],

    // Date fields
    [
      ["DepartureDateTime", "ArrivalDateTime"],
      (u, f) => u[f] != null && !patterns.date.test(String(u[f])),
      (f, i) => `${f} format invalid at index ${i}`,
    ],
  ];

  // Run all validations
  users.forEach((user, i) => {
    validations.forEach(([fields, validator, errorMsg]) => {
      fields.forEach((field) => {
        if (validator(user, field)) {
          errors.push(errorMsg(field, i));
        }
      });
    });
  });

  return { valid: errors.length === 0, errors };
}
