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
      order: [["CreatedAt", "DESC"]],
      raw: false,
      nest: true,
    });
  }

  // Update meeting user
  static async updateMeetingUser(id, data) {
    try {
      const meetingUser = await MeetingUser.findByPk(id);
      if (meetingUser && !meetingUser.IsDeleted) {
        data.ModifiedDate = new Date();
        return await meetingUser.update(data);
      }
      return null;
    } catch (error) {
      console.error("Service updateMeetingUser error:", error);
      throw error;
    }
  }
}

export default MeetingUserService;
