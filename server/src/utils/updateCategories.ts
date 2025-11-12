import { AppDataSource } from "@database";
import { ReportDAO } from "@models/dao/ReportDAO";
import { OfficeType } from "@models/enums/OfficeType";

async function updateCategories() {
  try {
    console.log("🔧 Updating report categories...");
    
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const reportRepo = AppDataSource.getRepository(ReportDAO);
    
    // Get all reports
    const reports = await reportRepo.find();
    
    console.log(`Found ${reports.length} reports to update`);
    
    // Update each report's category
    // Map old office-based categories to new descriptive ones
    const categoryMapping: { [key: string]: OfficeType } = {
      "Office 1": OfficeType.INFRASTRUCTURE,
      "Office 2": OfficeType.SAFETY,
      "Office 3": OfficeType.ENVIRONMENT
    };
    
    for (const report of reports) {
      const oldCategory = report.category as any;
      const newCategory = categoryMapping[oldCategory];
      
      if (newCategory) {
        report.category = newCategory;
        await reportRepo.save(report);
        console.log(`✅ Updated report ${report.id}: ${oldCategory} -> ${report.category}`);
      } else {
        console.log(`⚠️  Category already updated or unknown: ${report.category} for report ${report.id}`);
      }
    }
    
    console.log("✅ All categories updated successfully!");
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error("❌ Error updating categories:", error);
    process.exit(1);
  }
}

updateCategories();
