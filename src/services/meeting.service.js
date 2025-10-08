import Meeting from "../models/Meeting.js";
import { Op } from "sequelize";

class MeetingService {
  // Create meeting
  // AY
  static async createMeeting(data) {
    return await Meeting.create(data);
  }

  // Get paginated meetings with search, filter, sort
  // AY
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
    const offset = (page - 1) * limit;
    const where = { IsDeleted: false };
    const searchOr = [];
    const filterAnd = [];

    // Global search (OR logic)
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      searchOr.push(
        { MeetingName: { [Op.iLike]: term } },
        { CreatedBy: { [Op.iLike]: term } }
      );
    }

    // Individual filters (AND logic)
    if (filterMeetingName?.trim()) {
      filterAnd.push({
        MeetingName: { [Op.iLike]: `%${filterMeetingName.trim()}%` },
      });
    }

    if (filterCreatedBy?.trim()) {
      filterAnd.push({
        CreatedBy: { [Op.iLike]: `%${filterCreatedBy.trim()}%` },
      });
    }

    if (filterCreateDate?.trim()) {
      const term = filterCreateDate.trim();
      filterAnd.push({ CreateDate: { [Op.gte]: new Date(term) } });
    }

    // Combine conditions
    if (searchOr.length) where[Op.or] = searchOr;
    if (filterAnd.length) where[Op.and] = filterAnd;

    // Validate sort column
    const validCols = ["MeetingName", "CreateDate", "CreatedBy"];
    const sortCol = validCols.includes(sortBy) ? sortBy : "CreateDate";
    const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Execute query
    const { count, rows } = await Meeting.findAndCountAll({
      where,
      order: [[sortCol, order]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const totalPages = Math.ceil(count / limit);
    const currentPage = parseInt(page);
    const pageSize = parseInt(limit);

    return {
      meetings: rows,
      pagination: {
        total: count,
        totalRecords: count,
        page: currentPage,
        currentPage: currentPage,
        limit: pageSize,
        pageSize: pageSize,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    };
  }

  // Get all meetings
  // AY
  static async getAllMeetings() {
    return await Meeting.findAll({
      where: { IsDeleted: false },
      attributes: [
        "Id",
        "MeetingName",
        "CreatedBy",
        "CreateDate",
        "EmailAlert",
        "SmsAlert",
        "IsActive",
      ],
      order: [["CreateDate", "DESC"]],
    });
  }
}

export default MeetingService;
