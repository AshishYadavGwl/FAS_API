import Meeting from "../models/Meeting.js";
import { literal, Op } from "sequelize";

class MeetingService {
  // Create new meeting
  static async createMeeting(data) {
    return await Meeting.create(data);
  }

  // Get all non-deleted meetings
  static async getAllMeetings() {
    return await Meeting.findAll({
      where: {
        IsDeleted: false,
      },
      order: [["CreateDate", "DESC"]], // Latest meetings first
    });
  }

  // Get meeting by ID
  static async getMeetingById(id) {
    return await Meeting.findOne({
      where: {
        Id: id,
        IsDeleted: false,
      },
    });
  }

  // Update meeting
  static async updateMeeting(id, data) {
    const meeting = await Meeting.findByPk(id);
    if (meeting && !meeting.IsDeleted) {
      // Add modification timestamp
      data.ModifiedDate = new Date();
      return await meeting.update(data);
    }
    return null;
  }

  // Soft delete meeting
  static async deleteMeeting(id) {
    const meeting = await Meeting.findByPk(id);
    if (meeting) {
      await meeting.update({
        IsDeleted: true,
        ModifiedDate: new Date(),
      });
      return true;
    }
    return false;
  }

  static async searchMeetingsByName(meetingName) {
    try {
      return await Meeting.findAll({
        where: {
          MeetingName: meetingName,
          IsDeleted: false,
        },
        limit: 1,
      });
    } catch (error) {
      console.error("Service searchMeetingsByName error:", error);
      throw error;
    }
  }

  // Paginated meetings with search, filter & sort
  static async getPaginatedMeetings({
    page = 1,
    limit = 10,
    search = "",
    filterMeetingName = "",
    filterCreatedBy = "",
    filterCreateDate = "",
    sortBy = "CreateDate",
    sortOrder = "DESC",
  }) {
    try {
      const offset = (page - 1) * limit;
      const whereClause = { IsDeleted: false };
      const searchConditions = [];
      const filterConditions = [];

      // === SEARCH (Global search - OR logic) ===
      if (search && search.trim()) {
        const term = search.trim().toLowerCase().replace(/'/g, "''");

        searchConditions.push(
          literal(`LOWER("MeetingName") LIKE '%${term}%'`),
          literal(`LOWER("CreatedBy") LIKE '%${term}%'`),
          literal(
            `LOWER(TO_CHAR("CreateDate", 'DD/MM/YYYY HH12:MI AM')) LIKE '%${term}%'`
          )
        );
      }

      // === FILTER (Individual column filters - AND logic) ===

      // Filter by Meeting Name
      if (filterMeetingName && filterMeetingName.trim()) {
        const term = filterMeetingName.trim().toLowerCase().replace(/'/g, "''");
        filterConditions.push(literal(`LOWER("MeetingName") LIKE '%${term}%'`));
      }

      // Filter by Created By
      if (filterCreatedBy && filterCreatedBy.trim()) {
        const term = filterCreatedBy.trim().toLowerCase().replace(/'/g, "''");
        filterConditions.push(literal(`LOWER("CreatedBy") LIKE '%${term}%'`));
      }

      // Filter by Create Date (supports partial date/time)
      if (filterCreateDate && filterCreateDate.trim()) {
        const term = filterCreateDate.trim().toLowerCase().replace(/'/g, "''");
        filterConditions.push(
          literal(
            `LOWER(TO_CHAR("CreateDate", 'DD/MM/YYYY HH12:MI AM')) LIKE '%${term}%'`
          )
        );
      }

      // === Combine Search OR and Filter AND ===
      if (searchConditions.length > 0) {
        whereClause[Op.or] = searchConditions;
      }

      if (filterConditions.length > 0) {
        whereClause[Op.and] = filterConditions;
      }

      // === SORT ===
      const validCols = ["MeetingName", "CreateDate", "CreatedBy"];
      const sortCol = validCols.includes(sortBy) ? sortBy : "CreateDate";
      const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

      // Execute query
      const { count, rows } = await Meeting.findAndCountAll({
        where: whereClause,
        order: [[sortCol, order]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      return {
        meetings: rows,
        pagination: {
          total: count,
          totalRecords: count, // Added for display
          page: parseInt(page),
          currentPage: parseInt(page), // Added for consistency
          limit: parseInt(limit),
          pageSize: parseInt(limit), // Added for consistency
          totalPages: Math.ceil(count / limit),
          hasNextPage: parseInt(page) < Math.ceil(count / limit),
          hasPreviousPage: parseInt(page) > 1,
        },
      };
    } catch (error) {
      console.error("Service getPaginatedMeetings error:", error);
      throw error;
    }
  }
}

export default MeetingService;
