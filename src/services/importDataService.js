import ImportDataDetails from "../models/ImportDataDetails.js";

class ImportDataService {
  // Add import data detail - equivalent to AddImportDataDetailAsync
  static async addImportDataDetailAsync(importDataDetails) {
    try {
      console.log("📋 Saving import data details...");

      const savedDetails = await ImportDataDetails.create({
        FileName: importDataDetails.FileName,
        FileFullPath: importDataDetails.FileFullPath,
        CreatedBy: importDataDetails.CreatedBy,
        CreateDate: importDataDetails.CreateDate || new Date(),
        IsDeleted: false,
        IsActive: true,
      });

      console.log(`✅ Import data details saved with ID: ${savedDetails.Id}`);

      return {
        message: "File Uploaded Successfully.",
        status: 200,
        data: savedDetails,
      };
    } catch (error) {
      console.error("❌ Error in addImportDataDetailAsync:", error);
      return {
        message: "Failed to save import details",
        status: 500,
        data: null,
      };
    }
  }
}

export default ImportDataService;
