import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class TemplateService {
  static async processTemplate(templateFileName, variables) {
    try {
      // Use your exact file name
      const templatePath = path.join(
        __dirname,
        "../templates",
        templateFileName
      );
      let templateContent = await fs.readFile(templatePath, "utf-8");

      // Replace variables
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
        templateContent = templateContent.replace(regex, value || "");
      }

      console.log(`✅ Template ${templateFileName} processed successfully`);
      return templateContent;
    } catch (error) {
      console.error(
        `❌ Template error for ${templateFileName}:`,
        error.message
      );
      throw error;
    }
  }
}

export default TemplateService;
