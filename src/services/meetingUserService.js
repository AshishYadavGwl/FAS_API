import { Op } from "sequelize";
import MeetingUser from "../models/MeetingUser.js";
import Meeting from "../models/Meeting.js";
import "../models/associations.js";
import {
  buildSearchConditions,
  buildFilterConditions,
  buildSortOrder,
  buildMeetingInclude,
  parseDateTime,
} from "../utils/meetingUserUtils.js";
import { sequelize } from "../config/database.js";

const meetingInclude = {
  model: Meeting,
  as: "Meeting",
  attributes: ["Id", "MeetingName", "CreateDate"],
  required: false,
};

class MeetingUserService {
  // Create bulk meeting user
  // AY
  static async createMeetingUsers(usersData) {
    try {
      const processedData = usersData.map((user) => ({
        ...user,
        DepartureDateTime: parseDateTime(user.DepartureDateTime),
        ArrivalDateTime: parseDateTime(user.ArrivalDateTime),
        IsActive: user.IsActive ?? true,
        IsDeleted: user.IsDeleted ?? false,
        CreateDate: new Date(),
      }));

      return await MeetingUser.bulkCreate(processedData, { validate: true });
    } catch (error) {
      console.error("Service createMeetingUsers error:", error);
      throw error;
    }
  }

  // Get all meeting user paginated,filter,search,sort
  // AY
  static async getPaginatedMeetingUsers({
    page,
    pageSize,
    search,
    meetingId,
    sortBy,
    sortOrder,
    filters,
  }) {
    try {
      const offset = (page - 1) * pageSize;
      const where = { IsDeleted: false };

      if (meetingId) where.MeetingID = meetingId;

      // Build include
      const include = [buildMeetingInclude(filters.meetingName)];

      // Build search and filter conditions
      const or = buildSearchConditions(search);
      const and = buildFilterConditions(filters);

      // Final where clause
      const finalWhere = {
        ...where,
        ...(or.length && { [Op.or]: or }),
        ...(and.length && { [Op.and]: and }),
      };

      // Build sort order
      const order = buildSortOrder(sortBy, sortOrder);

      const [count, rows] = await Promise.all([
        MeetingUser.count({
          where: finalWhere,
          include,
          distinct: true,
        }),
        MeetingUser.findAll({
          where: finalWhere,
          include,
          limit: pageSize,
          offset,
          order,
          subQuery: false,
        }),
      ]);

      const totalPages = Math.ceil(count / pageSize);

      return {
        data: rows,
        pagination: {
          currentPage: page,
          pageSize,
          totalRecords: count,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (err) {
      throw err;
    }
  }

  // Get meeting user by id
  // AY
  static async getMeetingUserById(id) {
    return await MeetingUser.findByPk(id, {
      where: { IsDeleted: false },
      include: [meetingInclude],
    });
  }

  // Get meeting user by meeting id
  // AY
  static async getMeetingUsersByMeetingId(meetingId) {
    const where = {
      IsDeleted: false,
      ...(meetingId && { MeetingID: meetingId }),
    };

    return await MeetingUser.findAll({
      where,
      include: [meetingInclude],
      order: [["CreateDate", "DESC"]],
      raw: false,
      nest: true,
    });
  }

  // Update meeting user
  // AY
  static async updateMeetingUser(meetingId, usersData) {
    const t = await sequelize.transaction();

    try {
      const toUpdate = usersData.filter((u) => u.ID);
      const toCreate = usersData.filter((u) => !u.ID);

      // Step 1: Validate IDs
      if (toUpdate.length > 0) {
        const ids = toUpdate.map((u) => u.ID);
        const existing = await MeetingUser.findAll({
          where: { Id: ids, IsDeleted: false },
          attributes: ["Id"],
          transaction: t,
          raw: true,
        });

        const missingIds = ids.filter(
          (id) => !existing.find((e) => e.Id === id)
        );
        if (missingIds.length > 0) {
          const err = new Error("Attendee Not Found");
          err.missingIds = missingIds;
          throw err;
        }
        // Step 2: Bulk update
        const d = {
          ids,
          fn: toUpdate.map((u) => u.FirstName || ""),
          ln: toUpdate.map((u) => u.LastName || ""),
          em: toUpdate.map((u) => u.EmailId || ""),
          ph: toUpdate.map((u) => String(u.PhoneNumber || "")),
          at: toUpdate.map((u) => u.AttendeeType || ""),
          cc: toUpdate.map((u) => u.CarrierCode || ""),
          df: toUpdate.map((u) => String(u.DepartureFlightNumber || "")),
          dt: toUpdate.map((u) => parseDateTime(u.DepartureDateTime)),
          art: toUpdate.map((u) => parseDateTime(u.ArrivalDateTime)),
          oa: toUpdate.map((u) => u.OriginAirport || ""),
          da: toUpdate.map((u) => u.DestinationAirport || ""),
          fl: toUpdate.map((u) => u.FlightLabel || ""),
        };

        await sequelize.query(
          `
        UPDATE "MeetingUser" m SET 
          "FirstName" = u.fn, "LastName" = u.ln, "EmailId" = u.em,
          "PhoneNumber" = u.ph, "AttendeeType" = u.at, "CarrierCode" = u.cc,
          "DepartureFlightNumber" = u.df,
          "DepartureDateTime" = u.dt::timestamptz, "ArrivalDateTime" = u.art::timestamptz,
          "OriginAirport" = u.oa, "DestinationAirport" = u.da, "FlightLabel" = u.fl,
          "ModifiedDate" = NOW(), "MeetingID" = ${meetingId}
        FROM (SELECT * FROM UNNEST(
          $1::int[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[],
          $7::text[], $8::text[], $9::text[], $10::text[], $11::text[], $12::text[], $13::text[]
        ) AS t(id, fn, ln, em, ph, at, cc, df, dt, art, oa, da, fl)) u
        WHERE m."Id" = u.id
      `,
          {
            bind: [
              d.ids,
              d.fn,
              d.ln,
              d.em,
              d.ph,
              d.at,
              d.cc,
              d.df,
              d.dt,
              d.art,
              d.oa,
              d.da,
              d.fl,
            ],
            transaction: t,
          }
        );
      }

      // Step 3: Bulk create (removed ArrivalFlightNumber)
      const created =
        toCreate.length > 0
          ? await MeetingUser.bulkCreate(
              toCreate.map((u) => ({
                FirstName: u.FirstName,
                LastName: u.LastName,
                EmailId: u.EmailId,
                PhoneNumber: String(u.PhoneNumber || ""),
                AttendeeType: u.AttendeeType,
                CarrierCode: u.CarrierCode,
                DepartureFlightNumber: String(u.DepartureFlightNumber || ""),
                DepartureDateTime: parseDateTime(u.DepartureDateTime),
                ArrivalDateTime: parseDateTime(u.ArrivalDateTime),
                OriginAirport: u.OriginAirport,
                DestinationAirport: u.DestinationAirport,
                FlightLabel: u.FlightLabel,
                CreatedBy: u.CreatedBy,
                IsActive: true,
                IsDeleted: false,
                CreateDate: new Date(),
                MeetingID: meetingId,
              })),
              { validate: true, transaction: t }
            )
          : [];

      await t.commit();
      return { updated: toUpdate.length, created: created.length };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

export default MeetingUserService;
