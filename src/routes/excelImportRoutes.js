import { Router } from "express";
import ExcelImportController from "../controllers/excelImportController.js";
import upload from "../middleware/uploadMiddleware.js";

const router = Router();

// Excel import route
router.post(
  "/import",
  upload.single("formFile"), // Same field name as C# IFormFile formFile
  ExcelImportController.importDataReact
);

// Download route
router.get("/download/:meetingId", ExcelImportController.downloadMeetingData);

router.post(
  "/bulk-edit",
  upload.single("formFile"),
  ExcelImportController.bulkEditMeetingData
);

// Import history route
router.get("/history", ExcelImportController.getImportHistory);

export default router;
