import { Op } from "sequelize";
import MeetingUser from "../models/MeetingUser.js";
import Meeting from "../models/Meeting.js";
import "../models/associations.js";
import {
  buildSearchConditions,
  buildFilterConditions,
  buildSortOrder,
  buildMeetingInclude,
} from "../utils/meetingUserUtils.js";

const meetingInclude = {
  model: Meeting,
  as: "Meeting",
  attributes: ["Id", "MeetingName", "CreateDate"],
  required: false,
};

class MeetingUserService {
  // Get all meeting users with meeting details
  static async getAllMeetingUsers() {
    try {
      return await MeetingUser.findAll({
        where: { IsDeleted: false },
        order: [["CreateDate", "DESC"]],
        include: [meetingInclude],
      });
    } catch (error) {
      console.error("Service getAllMeetingUsers error:", error);
      throw error;
    }
  }

  // Get meeting user by ID with meeting details
  static async getMeetingUserById(id) {
    try {
      return await MeetingUser.findOne({
        where: { Id: id, IsDeleted: false },
        include: [meetingInclude],
      });
    } catch (error) {
      console.error("Service getMeetingUserById error:", error);
      throw error;
    }
  }

  // Get users by meeting ID
  static async getMeetingUsersByMeetingId(meetingId) {
    try {
      const whereClause = { IsDeleted: false };

      if (meetingId && meetingId !== 0) {
        whereClause.MeetingID = meetingId;
      }

      return await MeetingUser.findAll({
        where: whereClause,
        include: [meetingInclude],
        order: [["CreateDate", "DESC"]],
      });
    } catch (error) {
      console.error("💥 Service getMeetingUsersByMeetingId error:", error);
      throw error; // Let controller handle it
    }
  }

  // Create meeting user with validation
  static async createMeetingUser(data) {
    try {
      // Validate MeetingID if provided
      if (data.MeetingID) {
        const meetingExists = await Meeting.findByPk(data.MeetingID);
        if (!meetingExists) {
          throw new Error(`Meeting with ID ${data.MeetingID} does not exist`);
        }
      }

      return await MeetingUser.create(data);
    } catch (error) {
      console.error("Service createMeetingUser error:", error);
      throw error;
    }
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

  // Soft delete meeting user
  static async deleteMeetingUser(id) {
    try {
      const meetingUser = await MeetingUser.findByPk(id);
      if (meetingUser) {
        await meetingUser.update({
          IsDeleted: true,
          ModifiedDate: new Date(),
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Service deleteMeetingUser error:", error);
      throw error;
    }
  }

  // Bulk delete users by meeting ID
  static async bulkDeleteByMeetingId(meetingId) {
    try {
      const [affectedRows] = await MeetingUser.update(
        {
          IsDeleted: true,
          ModifiedDate: new Date(),
        },
        {
          where: {
            MeetingID: meetingId,
            IsDeleted: false,
          },
        }
      );
      return affectedRows;
    } catch (error) {
      console.error("Service bulkDeleteByMeetingId error:", error);
      throw error;
    }
  }

  static async getArchivedMeetingUsers(meetingId = 0) {
    try {
      const whereClause = { IsDeleted: true };

      if (meetingId && meetingId !== 0) {
        whereClause.MeetingID = meetingId;
      }

      return await MeetingUser.findAll({
        where: whereClause,
        include: [meetingInclude],
        order: [["ModifiedDate", "DESC"]],
      });
    } catch (error) {
      console.error("💥 Service getArchivedMeetingUsers error:", error);
      throw error;
    }
  }

  static async updateUserStatus(userId, statusData) {
    try {
      const [updated] = await MeetingUser.update(
        {
          State: statusData.state,
          Status: statusData.status,
          AlertId: statusData.alertId,
          ModifiedDate: statusData.lastUpdated || new Date(),
        },
        {
          where: { Id: userId, IsDeleted: false },
        }
      );

      return updated > 0;
    } catch (error) {
      console.error("Service updateUserStatus error:", error);
      throw new Error(`Update user status error: ${error.message}`);
    }
  }

  static async getMeetingUsersByAlertId(alertId) {
    try {
      return await MeetingUser.findAll({
        where: {
          AlertId: alertId,
          IsDeleted: false,
        },
        include: [meetingInclude],
      });
    } catch (error) {
      console.error("Service getMeetingUsersByAlertId error:", error);
      throw error;
    }
  }

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
      const limit = pageSize;
      const where = { IsDeleted: false };

      if (meetingId) where.MeetingID = meetingId;

      // Build include - Capital M
      const include = [buildMeetingInclude(filters.meetingName)];

      // Build search conditions
      const or = buildSearchConditions(search);

      // Build filter conditions
      const and = buildFilterConditions(filters);

      // Final where clause
      const finalWhere = {
        ...where,
        ...(or.length ? { [Op.or]: or } : {}),
        ...(and.length ? { [Op.and]: and } : {}),
      };

      // Build sort order
      const order = buildSortOrder(sortBy, sortOrder);

      // Execute query
      const { count, rows } = await MeetingUser.findAndCountAll({
        where: finalWhere,
        include,
        limit,
        offset,
        order,
        distinct: true,
        subQuery: false,
      });

      return {
        data: rows,
        pagination: {
          currentPage: page,
          pageSize,
          totalRecords: count,
          totalPages: Math.ceil(count / pageSize),
          hasNextPage: page < Math.ceil(count / pageSize),
          hasPreviousPage: page > 1,
        },
      };
    } catch (err) {
      console.error("❌ Service getPaginatedMeetingUsers error:", err);
      throw err;
    }
  }
}

export default MeetingUserService;
