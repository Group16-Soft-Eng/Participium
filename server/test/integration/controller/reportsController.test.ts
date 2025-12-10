import "reflect-metadata";
import { initializeTestDatabase, closeTestDatabase, clearDatabase, TestDataSource } from "../../setup/test-datasource";
import { ReportRepository } from "../../../src/repositories/ReportRepository";
import { UserRepository } from "../../../src/repositories/UserRepository";
import * as reportController from "../../../src/controllers/reportController";
import { OfficeType } from "../../../src/models/enums/OfficeType";
import { ReportState } from "../../../src/models/enums/ReportState";

// Mock type for Multer files in tests
interface MockMulterFile {
  filename: string;
  path: string;
}

describe("Report Controller Integration Tests", () => {
  let reportRepo: ReportRepository;
  let userRepo: UserRepository;

  beforeAll(async () => {
    await initializeTestDatabase();
    reportRepo = new ReportRepository();
    userRepo = new UserRepository();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  // ===================== getReports =====================
  describe("getReports", () => {
    it("should return only approved reports", async () => {
      const user = await userRepo.createUser("testuser", "Test", "User", "test@example.com", "Test@1234");

      // Create reports with different states
      await reportRepo.createReport(
        "Pending Report",
        { Coordinates: { latitude: 45.0, longitude: 7.0 } },
        user,
        false,
        OfficeType.INFRASTRUCTURE,
        { Description: "Pending", Photos: ["/uploads/photo1.jpg"] }
      );

      const assignedReport = await reportRepo.createReport(
        "Assigned Report",
        { Coordinates: { latitude: 45.1, longitude: 7.1 } },
        user,
        false,
        OfficeType.ENVIRONMENT,
        { Description: "Assigned", Photos: ["/uploads/photo2.jpg"] }
      );
      await reportRepo.updateReportState(assignedReport.id, ReportState.ASSIGNED);

      const inProgressReport = await reportRepo.createReport(
        "In Progress Report",
        { Coordinates: { latitude: 45.2, longitude: 7.2 } },
        user,
        false,
        OfficeType.SAFETY,
        { Description: "In Progress", Photos: ["/uploads/photo3.jpg"] }
      );
      await reportRepo.updateReportState(inProgressReport.id, ReportState.IN_PROGRESS);

      const suspendedReport = await reportRepo.createReport(
        "Suspended Report",
        { Coordinates: { latitude: 45.3, longitude: 7.3 } },
        user,
        false,
        OfficeType.SANITATION,
        { Description: "Suspended", Photos: ["/uploads/photo4.jpg"] }
      );
      await reportRepo.updateReportState(suspendedReport.id, ReportState.SUSPENDED);

      const declinedReport = await reportRepo.createReport(
        "Declined Report",
        { Coordinates: { latitude: 45.4, longitude: 7.4 } },
        user,
        false,
        OfficeType.TRANSPORT,
        { Description: "Declined", Photos: ["/uploads/photo5.jpg"] }
      );
      await reportRepo.updateReportState(declinedReport.id, ReportState.DECLINED, "Not valid");

      const resolvedReport = await reportRepo.createReport(
        "Resolved Report",
        { Coordinates: { latitude: 45.5, longitude: 7.5 } },
        user,
        false,
        OfficeType.ORGANIZATION,
        { Description: "Resolved", Photos: ["/uploads/photo6.jpg"] }
      );
      await reportRepo.updateReportState(resolvedReport.id, ReportState.RESOLVED);

      const reports = await reportController.getReports();

      // Should return only ASSIGNED, IN_PROGRESS, SUSPENDED
      expect(reports.length).toBe(3);
      expect(reports.some(r => r.state === ReportState.ASSIGNED)).toBe(true);
      expect(reports.some(r => r.state === ReportState.IN_PROGRESS)).toBe(true);
      expect(reports.some(r => r.state === ReportState.SUSPENDED)).toBe(true);
      expect(reports.some(r => r.state === ReportState.PENDING)).toBe(false);
      expect(reports.some(r => r.state === ReportState.DECLINED)).toBe(false);
      expect(reports.some(r => r.state === ReportState.RESOLVED)).toBe(false);
    });

    it("should return empty array when no approved reports exist", async () => {
      const user = await userRepo.createUser("testuser2", "Test2", "User2", "test2@example.com", "Test@1234");

      await reportRepo.createReport(
        "Pending Report",
        { Coordinates: { latitude: 45.0, longitude: 7.0 } },
        user,
        false,
        OfficeType.INFRASTRUCTURE,
        { Description: "Pending", Photos: ["/uploads/photo1.jpg"] }
      );

      const reports = await reportController.getReports();

      expect(reports.length).toBe(0);
    });

    it("should map reports correctly with author information", async () => {
      const user = await userRepo.createUser("testuser3", "Test3", "User3", "test3@example.com", "Test@1234");

      const report = await reportRepo.createReport(
        "Test Report",
        { Coordinates: { latitude: 45.0, longitude: 7.0 } },
        user,
        false,
        OfficeType.INFRASTRUCTURE,
        { Description: "Test description", Photos: ["/uploads/photo1.jpg"] }
      );
      await reportRepo.updateReportState(report.id, ReportState.ASSIGNED);

      const reports = await reportController.getReports();

      expect(reports.length).toBe(1);
      expect(reports[0].title).toBe("Test Report");
      expect(reports[0].author).toBeDefined();
      expect(reports[0].author?.username).toBe("testuser3");
    });

    it("should handle anonymous reports correctly", async () => {
      const user = await userRepo.createUser("testuser4", "Test4", "User4", "test4@example.com", "Test@1234");

      const report = await reportRepo.createReport(
        "Anonymous Report",
        { Coordinates: { latitude: 45.0, longitude: 7.0 } },
        user,
        true,
        OfficeType.INFRASTRUCTURE,
        { Description: "Anonymous", Photos: ["/uploads/photo1.jpg"] }
      );
      await reportRepo.updateReportState(report.id, ReportState.ASSIGNED);

      const reports = await reportController.getReports();

      expect(reports.length).toBe(1);
      expect(reports[0].anonymity).toBe(true);
    });
  });

  // ===================== getReportsByOffice =====================
  describe("getReportsByOffice", () => {
    it("should return only reports for specific office", async () => {
      const user = await userRepo.createUser("testuser5", "Test5", "User5", "test5@example.com", "Test@1234");

      const infraReport = await reportRepo.createReport(
        "Infrastructure Report",
        { Coordinates: { latitude: 45.0, longitude: 7.0 } },
        user,
        false,
        OfficeType.INFRASTRUCTURE,
        { Description: "Infrastructure", Photos: ["/uploads/photo1.jpg"] }
      );
      await reportRepo.updateReportState(infraReport.id, ReportState.ASSIGNED);

      const envReport = await reportRepo.createReport(
        "Environment Report",
        { Coordinates: { latitude: 45.1, longitude: 7.1 } },
        user,
        false,
        OfficeType.ENVIRONMENT,
        { Description: "Environment", Photos: ["/uploads/photo2.jpg"] }
      );
      await reportRepo.updateReportState(envReport.id, ReportState.ASSIGNED);

      const reports = await reportController.getReportsByOffice(OfficeType.INFRASTRUCTURE);

      expect(reports.length).toBe(1);
      expect(reports[0].category).toBe(OfficeType.INFRASTRUCTURE);
    });

    it("should return empty array when no reports for office", async () => {
      const user = await userRepo.createUser("testuser6", "Test6", "User6", "test6@example.com", "Test@1234");

      const report = await reportRepo.createReport(
        "Infrastructure Report",
        { Coordinates: { latitude: 45.0, longitude: 7.0 } },
        user,
        false,
        OfficeType.INFRASTRUCTURE,
        { Description: "Infrastructure", Photos: ["/uploads/photo1.jpg"] }
      );
      await reportRepo.updateReportState(report.id, ReportState.ASSIGNED);

      const reports = await reportController.getReportsByOffice(OfficeType.SAFETY);

      expect(reports.length).toBe(0);
    });

    it("should filter approved reports by office", async () => {
      const user = await userRepo.createUser("testuser7", "Test7", "User7", "test7@example.com", "Test@1234");

      await reportRepo.createReport(
        "Pending Safety Report",
        { Coordinates: { latitude: 45.0, longitude: 7.0 } },
        user,
        false,
        OfficeType.SAFETY,
        { Description: "Pending", Photos: ["/uploads/photo1.jpg"] }
      );

      const assignedSafety = await reportRepo.createReport(
        "Assigned Safety Report",
        { Coordinates: { latitude: 45.1, longitude: 7.1 } },
        user,
        false,
        OfficeType.SAFETY,
        { Description: "Assigned", Photos: ["/uploads/photo2.jpg"] }
      );
      await reportRepo.updateReportState(assignedSafety.id, ReportState.ASSIGNED);

      const reports = await reportController.getReportsByOffice(OfficeType.SAFETY);

      expect(reports.length).toBe(1);
      expect(reports[0].state).toBe(ReportState.ASSIGNED);
    });
  });

  // ===================== getReport =====================
  describe("getReport", () => {
    it("should return a specific report by id", async () => {
      const user = await userRepo.createUser("testuser8", "Test8", "User8", "test8@example.com", "Test@1234");

      const report = await reportRepo.createReport(
        "Specific Report",
        { Coordinates: { latitude: 45.0, longitude: 7.0 } },
        user,
        false,
        OfficeType.INFRASTRUCTURE,
        { Description: "Specific", Photos: ["/uploads/photo1.jpg"] }
      );

      const result = await reportController.getReport(report.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(report.id);
      expect(result.title).toBe("Specific Report");
    });

    it("should throw error when report not found", async () => {
      await expect(reportController.getReport(9999)).rejects.toThrow("Report with id '9999' not found");
    });

    it("should include author information in report", async () => {
      const user = await userRepo.createUser("testuser9", "Test9", "User9", "test9@example.com", "Test@1234");

      const report = await reportRepo.createReport(
        "Report with Author",
        { Coordinates: { latitude: 45.0, longitude: 7.0 } },
        user,
        false,
        OfficeType.INFRASTRUCTURE,
        { Description: "With author", Photos: ["/uploads/photo1.jpg"] }
      );

      const result = await reportController.getReport(report.id);

      expect(result.author).toBeDefined();
      expect(result.author?.username).toBe("testuser9");
    });
  });

  // ===================== uploadReport =====================
  describe("uploadReport", () => {
    it("should create a new report successfully", async () => {
      const user = await userRepo.createUser("testuser10", "Test10", "User10", "test10@example.com", "Test@1234");

      const mockFiles = [
        { filename: "photo1.jpg", path: "/uploads/reports/photo1.jpg" }
      ] as any[];

      const reportDto: any = {
        title: "New Report",
        category: OfficeType.INFRASTRUCTURE,
        location: {
          Coordinates: { latitude: 45.0, longitude: 7.0 }
        },
        anonymity: false,
        document: {
          description: "Test description"
        }
      };

      const result = await reportController.uploadReport(reportDto, mockFiles, user.id);

      expect(result).toBeDefined();
      expect(result.title).toBe("New Report");
      expect(result.category).toBe(OfficeType.INFRASTRUCTURE);
      expect(result.state).toBe(ReportState.PENDING);
    });

    it("should create anonymous report", async () => {
      const mockFiles = [
        { filename: "photo1.jpg", path: "/uploads/reports/photo1.jpg" }
      ] as any[];

      const reportDto: any = {
        title: "Anonymous Report",
        category: OfficeType.ENVIRONMENT,
        location: {
          Coordinates: { latitude: 45.0, longitude: 7.0 }
        },
        anonymity: true,
        document: {
          description: "Anonymous description"
        }
      };

      const result = await reportController.uploadReport(reportDto, mockFiles);

      expect(result).toBeDefined();
      expect(result.anonymity).toBe(true);
      expect(result.author).toBeUndefined();
    });

    it("should throw error when report data is missing", async () => {
      const mockFiles = [
        { filename: "photo1.jpg", path: "/uploads/reports/photo1.jpg" }
      ] as any[];

      await expect(reportController.uploadReport(null as any, mockFiles)).rejects.toThrow("Missing report data");
    });

    it("should throw error when title is missing", async () => {
      const mockFiles = [
        { filename: "photo1.jpg", path: "/uploads/reports/photo1.jpg" }
      ] as any[];

      const reportDto: any = {
        category: OfficeType.INFRASTRUCTURE,
        location: {
          Coordinates: { latitude: 45.0, longitude: 7.0 }
        }
      };

      await expect(reportController.uploadReport(reportDto, mockFiles)).rejects.toThrow("Missing required field: title");
    });

    it("should throw error when category is missing", async () => {
      const mockFiles = [
        { filename: "photo1.jpg", path: "/uploads/reports/photo1.jpg" }
      ] as any[];

      const reportDto: any = {
        title: "Report without category",
        location: {
          Coordinates: { latitude: 45.0, longitude: 7.0 }
        }
      };

      await expect(reportController.uploadReport(reportDto, mockFiles)).rejects.toThrow("Missing required field: category");
    });

    it("should throw error when category is invalid", async () => {
      const mockFiles = [
        { filename: "photo1.jpg", path: "/uploads/reports/photo1.jpg" }
      ] as any[];

      const reportDto: any = {
        title: "Report with invalid category",
        category: "INVALID_CATEGORY",
        location: {
          Coordinates: { latitude: 45.0, longitude: 7.0 }
        }
      };

      await expect(reportController.uploadReport(reportDto, mockFiles)).rejects.toThrow("Invalid category value: INVALID_CATEGORY");
    });

    it("should throw error when location is missing", async () => {
      const mockFiles = [
        { filename: "photo1.jpg", path: "/uploads/reports/photo1.jpg" }
      ] as any[];

      const reportDto: any = {
        title: "Report without location",
        category: OfficeType.INFRASTRUCTURE
      };

      await expect(reportController.uploadReport(reportDto, mockFiles)).rejects.toThrow("Missing or invalid location coordinates");
    });

    it("should throw error when coordinates are invalid", async () => {
      const mockFiles = [
        { filename: "photo1.jpg", path: "/uploads/reports/photo1.jpg" }
      ] as any[];

      const reportDto: any = {
        title: "Report with invalid coords",
        category: OfficeType.INFRASTRUCTURE,
        location: {
          Coordinates: { latitude: "invalid", longitude: 7.0 }
        }
      };

      await expect(reportController.uploadReport(reportDto, mockFiles)).rejects.toThrow("Missing or invalid location coordinates");
    });

    it("should throw error when no photos provided", async () => {
      const user = await userRepo.createUser("testuser12", "Test12", "User12", "test12@example.com", "Test@1234");

      const reportDto: any = {
        title: "Report without photos",
        category: OfficeType.INFRASTRUCTURE,
        location: {
          Coordinates: { latitude: 45.0, longitude: 7.0 }
        }
      };

      await expect(reportController.uploadReport(reportDto, [], user.id)).rejects.toThrow("Error! Report must have between 1 and 3 photos.");
    });

    it("should throw error when more than 3 photos provided", async () => {
      const user = await userRepo.createUser("testuser13", "Test13", "User13", "test13@example.com", "Test@1234");

      const mockFiles = [
        { filename: "photo1.jpg", path: "/uploads/reports/photo1.jpg" },
        { filename: "photo2.jpg", path: "/uploads/reports/photo2.jpg" },
        { filename: "photo3.jpg", path: "/uploads/reports/photo3.jpg" },
        { filename: "photo4.jpg", path: "/uploads/reports/photo4.jpg" }
      ] as any[];

      const reportDto: any = {
        title: "Report with too many photos",
        category: OfficeType.INFRASTRUCTURE,
        location: {
          Coordinates: { latitude: 45.0, longitude: 7.0 }
        }
      };

      await expect(reportController.uploadReport(reportDto, mockFiles, user.id)).rejects.toThrow("Error! Report must have between 1 and 3 photos.");
    });

    it("should accept 1 to 3 photos", async () => {
      const user = await userRepo.createUser("testuser14", "Test14", "User14", "test14@example.com", "Test@1234");

      const mockFiles1 = [
        { filename: "photo1.jpg", path: "/uploads/reports/photo1.jpg" }
      ] as any[];

      const mockFiles2 = [
        { filename: "photo1.jpg", path: "/uploads/reports/photo1.jpg" },
        { filename: "photo2.jpg", path: "/uploads/reports/photo2.jpg" }
      ] as any[];

      const mockFiles3 = [
        { filename: "photo1.jpg", path: "/uploads/reports/photo1.jpg" },
        { filename: "photo2.jpg", path: "/uploads/reports/photo2.jpg" },
        { filename: "photo3.jpg", path: "/uploads/reports/photo3.jpg" }
      ] as any[];

      const reportDto1: any = {
        title: "Report 1 photo",
        category: OfficeType.INFRASTRUCTURE,
        location: { Coordinates: { latitude: 45.0, longitude: 7.0 } }
      };

      const reportDto2: any = {
        title: "Report 2 photos",
        category: OfficeType.ENVIRONMENT,
        location: { Coordinates: { latitude: 45.1, longitude: 7.1 } }
      };

      const reportDto3: any = {
        title: "Report 3 photos",
        category: OfficeType.SAFETY,
        location: { Coordinates: { latitude: 45.2, longitude: 7.2 } }
      };

      const result1 = await reportController.uploadReport(reportDto1, mockFiles1, user.id);
      const result2 = await reportController.uploadReport(reportDto2, mockFiles2, user.id);
      const result3 = await reportController.uploadReport(reportDto3, mockFiles3, user.id);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result3).toBeDefined();
      expect(result1.document?.photos?.length).toBe(1);
      expect(result2.document?.photos?.length).toBe(2);
      expect(result3.document?.photos?.length).toBe(3);
    });

    it("should store photo paths correctly", async () => {
      const user = await userRepo.createUser("testuser15", "Test15", "User15", "test15@example.com", "Test@1234");

      const mockFiles = [
        { filename: "photo1.jpg", path: "/uploads/reports/photo1.jpg" },
        { filename: "photo2.jpg", path: "/uploads/reports/photo2.jpg" }
      ] as any[];

      const reportDto: any = {
        title: "Report with photos",
        category: OfficeType.INFRASTRUCTURE,
        location: { Coordinates: { latitude: 45.0, longitude: 7.0 } }
      };

      const result = await reportController.uploadReport(reportDto, mockFiles, user.id);

      expect(result.document?.photos).toBeDefined();
expect(result.document?.photos?.length).toBe(2);
expect(result.document?.photos?.[0]).toBe("/uploads/reports/photo1.jpg");
expect(result.document?.photos?.[1]).toBe("/uploads/reports/photo2.jpg");    });
  });

  // ===================== deleteReport =====================
  describe("deleteReport", () => {
    it("should delete a report successfully", async () => {
      const user = await userRepo.createUser("testuser16", "Test16", "User16", "test16@example.com", "Test@1234");

      const report = await reportRepo.createReport(
        "Report to delete",
        { Coordinates: { latitude: 45.0, longitude: 7.0 } },
        user,
        false,
        OfficeType.INFRASTRUCTURE,
        { Description: "To be deleted", Photos: ["/uploads/photo1.jpg"] }
      );

      await reportController.deleteReport(report.id);

      await expect(reportRepo.getReportById(report.id)).rejects.toThrow(`Report with id '${report.id}' not found`);
    });

    it("should throw error when deleting non-existent report", async () => {
      await expect(reportController.deleteReport(9999)).rejects.toThrow("Report with id '9999' not found");
    });

    it("should delete report regardless of state", async () => {
      const user = await userRepo.createUser("testuser17", "Test17", "User17", "test17@example.com", "Test@1234");

      const report = await reportRepo.createReport(
        "Assigned Report to delete",
        { Coordinates: { latitude: 45.0, longitude: 7.0 } },
        user,
        false,
        OfficeType.INFRASTRUCTURE,
        { Description: "To be deleted", Photos: ["/uploads/photo1.jpg"] }
      );
      await reportRepo.updateReportState(report.id, ReportState.ASSIGNED);

      await reportController.deleteReport(report.id);

      await expect(reportRepo.getReportById(report.id)).rejects.toThrow(`Report with id '${report.id}' not found`);
    });
  });
});