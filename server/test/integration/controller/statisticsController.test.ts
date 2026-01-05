import "reflect-metadata";
import { initializeTestDatabase, closeTestDatabase, clearDatabase } from "../../setup/test-datasource";
import { ReportRepository } from "../../../src/repositories/ReportRepository";
import { UserRepository } from "../../../src/repositories/UserRepository";
import * as statisticsController from "../../../src/controllers/statisticsController";
import { OfficeType } from "../../../src/models/enums/OfficeType";
import { ReportState } from "../../../src/models/enums/ReportState";
import { BadRequestError } from "../../../src/utils/utils";

describe("Statistics Controller Integration Tests", () => {
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

  // ===================== getPublicStatistics =====================
  describe("getPublicStatistics", () => {
    it("should return statistics with default period (day)", async () => {
      const user = await userRepo.createUser("testuser", "Test", "User", "test@example.com", "Password@123");

      // Create reports with different categories and states
      const report1 = await reportRepo.createReport(
        "Water leak",
        { name: "Main Street", Coordinates: { longitude: 10.5, latitude: 45.5 } },
        user,
        false,
        OfficeType.WATER_SUPPLY,
        { Description: "Water leak description" }
      );
      await reportRepo.updateReportState(report1.id, ReportState.RESOLVED);

      const report2 = await reportRepo.createReport(
        "Broken streetlight",
        { name: "Second Street", Coordinates: { longitude: 10.6, latitude: 45.6 } },
        user,
        false,
        OfficeType.PUBLIC_LIGHTING,
        { Description: "Streetlight description" }
      );
      await reportRepo.updateReportState(report2.id, ReportState.IN_PROGRESS);

      const stats = await statisticsController.getPublicStatistics('day');

      expect(stats).toHaveProperty("byCategory");
      expect(stats).toHaveProperty("byState");
      expect(stats).toHaveProperty("trends");
      expect(stats.trends.period).toBe('day');
      expect(Array.isArray(stats.byCategory)).toBe(true);
      expect(Array.isArray(stats.byState)).toBe(true);
      expect(Array.isArray(stats.trends.data)).toBe(true);
    });

    it("should return statistics with period=week", async () => {
      const stats = await statisticsController.getPublicStatistics('week');

      expect(stats.trends.period).toBe('week');
      expect(stats).toHaveProperty("byCategory");
      expect(stats).toHaveProperty("byState");
    });

    it("should return statistics with period=month", async () => {
      const stats = await statisticsController.getPublicStatistics('month');

      expect(stats.trends.period).toBe('month');
      expect(stats).toHaveProperty("byCategory");
      expect(stats).toHaveProperty("byState");
    });

    it("should throw BadRequestError for invalid period", async () => {
      await expect(statisticsController.getPublicStatistics('year' as any))
        .rejects.toThrow(BadRequestError);
    });

    it("should return empty statistics when no reports exist", async () => {
      const stats = await statisticsController.getPublicStatistics('day');

      expect(stats.byCategory).toEqual([]);
      expect(stats.byState).toEqual([]);
      expect(stats.trends.data).toEqual([]);
    });

    it("should count reports by category correctly", async () => {
      const user = await userRepo.createUser("testuser", "Test", "User", "test@example.com", "Password@123");

      // Create multiple reports in same category
      const report1 = await reportRepo.createReport(
        "Report 1",
        { name: "Location 1", Coordinates: { longitude: 10.5, latitude: 45.5 } },
        user,
        false,
        OfficeType.WASTE,
        { Description: "Description 1" }
      );
      await reportRepo.updateReportState(report1.id, ReportState.RESOLVED);

      const report2 = await reportRepo.createReport(
        "Report 2",
        { name: "Location 2", Coordinates: { longitude: 10.6, latitude: 45.6 } },
        user,
        false,
        OfficeType.WASTE,
        { Description: "Description 2" }
      );
      await reportRepo.updateReportState(report2.id, ReportState.IN_PROGRESS);

      const stats = await statisticsController.getPublicStatistics('day');

      const wasteStat = stats.byCategory.find((s: { category: OfficeType; count: number }) => s.category === OfficeType.WASTE);
      expect(wasteStat).toBeDefined();
      expect(wasteStat?.count).toBe(1);
    });

    it("should count reports by state correctly", async () => {
      const user = await userRepo.createUser("testuser", "Test", "User", "test@example.com", "Password@123");

      // Create reports with different states
      const report1 = await reportRepo.createReport(
        "Report 1",
        { name: "Location 1", Coordinates: { longitude: 10.5, latitude: 45.5 } },
        user,
        false,
        OfficeType.WASTE,
        { Description: "Description 1" }
      );

      const report2 = await reportRepo.createReport(
        "Report 2",
        { name: "Location 2", Coordinates: { longitude: 10.6, latitude: 45.6 } },
        user,
        false,
        OfficeType.WASTE,
        { Description: "Description 2" }
      );
      await reportRepo.updateReportState(report2.id, ReportState.IN_PROGRESS);

      const stats = await statisticsController.getPublicStatistics('day');

      expect(stats.byState.length).toBeGreaterThan(0);
      const pendingStat = stats.byState.find((s: { state: string; count: number }) => s.state === ReportState.PENDING);
      const inProgressStat = stats.byState.find((s: { state: string; count: number }) => s.state === ReportState.IN_PROGRESS);
      
      expect(pendingStat?.count).toBe(1);
      expect(inProgressStat?.count).toBe(1);
    });

    it("should not include PENDING and DECLINED reports in category statistics", async () => {
      const user = await userRepo.createUser("testuser", "Test", "User", "test@example.com", "Password@123");

      // Create PENDING report
      await reportRepo.createReport(
        "Pending Report",
        { name: "Location 1", Coordinates: { longitude: 10.5, latitude: 45.5 } },
        user,
        false,
        OfficeType.WASTE,
        { Description: "Description" }
      );

      // Create DECLINED report
      const report2 = await reportRepo.createReport(
        "Declined Report",
        { name: "Location 2", Coordinates: { longitude: 10.6, latitude: 45.6 } },
        user,
        false,
        OfficeType.WASTE,
        { Description: "Description" }
      );
      await reportRepo.updateReportState(report2.id, ReportState.DECLINED, "Not valid");

      const stats = await statisticsController.getPublicStatistics('day');

      const wasteStat = stats.byCategory.find((s: { category: OfficeType; count: number }) => s.category === OfficeType.WASTE);
      expect(wasteStat).toBeUndefined(); // No approved reports
    });

    it("should return trends data for reports", async () => {
      const user = await userRepo.createUser("testuser", "Test", "User", "test@example.com", "Password@123");

      const report = await reportRepo.createReport(
        "Report",
        { name: "Location", Coordinates: { longitude: 10.5, latitude: 45.5 } },
        user,
        false,
        OfficeType.WASTE,
        { Description: "Description" }
      );
      await reportRepo.updateReportState(report.id, ReportState.RESOLVED);

      const stats = await statisticsController.getPublicStatistics('day');

      expect(stats.trends.data.length).toBe(0);
    });
  });

  // ===================== getReportCountByCategory =====================
  describe("getReportCountByCategory", () => {
    it("should return count for specific category with reports", async () => {
      const user = await userRepo.createUser("testuser", "Test", "User", "test@example.com", "Password@123");

      // Create approved reports in WATER_SUPPLY category
      const report1 = await reportRepo.createReport(
        "Water leak 1",
        { name: "Location 1", Coordinates: { longitude: 10.5, latitude: 45.5 } },
        user,
        false,
        OfficeType.WATER_SUPPLY,
        { Description: "Description 1" }
      );
      await reportRepo.updateReportState(report1.id, ReportState.RESOLVED);

      const report2 = await reportRepo.createReport(
        "Water leak 2",
        { name: "Location 2", Coordinates: { longitude: 10.6, latitude: 45.6 } },
        user,
        false,
        OfficeType.WATER_SUPPLY,
        { Description: "Description 2" }
      );
      await reportRepo.updateReportState(report2.id, ReportState.IN_PROGRESS);

      const count = await statisticsController.getReportCountByCategory(OfficeType.WATER_SUPPLY);

      expect(count).toBe(1);
    });

    it("should return 0 for category with no approved reports", async () => {
      const user = await userRepo.createUser("testuser", "Test", "User", "test@example.com", "Password@123");

      // Create PENDING report (not approved)
      await reportRepo.createReport(
        "Pending Report",
        { name: "Location", Coordinates: { longitude: 10.5, latitude: 45.5 } },
        user,
        false,
        OfficeType.PUBLIC_LIGHTING,
        { Description: "Description" }
      );

      const count = await statisticsController.getReportCountByCategory(OfficeType.PUBLIC_LIGHTING);

      expect(count).toBe(0);
    });

    it("should return 0 for category with no reports at all", async () => {
      const count = await statisticsController.getReportCountByCategory(OfficeType.WASTE);

      expect(count).toBe(0);
    });

    it("should count all approved states (ASSIGNED, IN_PROGRESS, SUSPENDED, RESOLVED)", async () => {
      const user = await userRepo.createUser("testuser", "Test", "User", "test@example.com", "Password@123");

      // Create reports with different approved states
      const report1 = await reportRepo.createReport(
        "Report 1",
        { name: "Location 1", Coordinates: { longitude: 10.5, latitude: 45.5 } },
        user,
        false,
        OfficeType.WASTE,
        { Description: "Description" }
      );
      await reportRepo.updateReportState(report1.id, ReportState.ASSIGNED);

      const report2 = await reportRepo.createReport(
        "Report 2",
        { name: "Location 2", Coordinates: { longitude: 10.6, latitude: 45.6 } },
        user,
        false,
        OfficeType.WASTE,
        { Description: "Description" }
      );
      await reportRepo.updateReportState(report2.id, ReportState.IN_PROGRESS);

      const report3 = await reportRepo.createReport(
        "Report 3",
        { name: "Location 3", Coordinates: { longitude: 10.7, latitude: 45.7 } },
        user,
        false,
        OfficeType.WASTE,
        { Description: "Description" }
      );
      await reportRepo.updateReportState(report3.id, ReportState.SUSPENDED);

      const report4 = await reportRepo.createReport(
        "Report 4",
        { name: "Location 4", Coordinates: { longitude: 10.8, latitude: 45.8 } },
        user,
        false,
        OfficeType.WASTE,
        { Description: "Description" }
      );
      await reportRepo.updateReportState(report4.id, ReportState.RESOLVED);

      const count = await statisticsController.getReportCountByCategory(OfficeType.WASTE);

      expect(count).toBe(3);
    });

    it("should handle all valid categories", async () => {
      const user = await userRepo.createUser("testuser", "Test", "User", "test@example.com", "Password@123");

      // Create one report for each category
      const categories = Object.values(OfficeType);
      for (const category of categories) {
        const report = await reportRepo.createReport(
          `Report ${category}`,
          { name: "Location", Coordinates: { longitude: 10.5, latitude: 45.5 } },
          user,
          false,
          category,
          { Description: "Description" }
        );
        await reportRepo.updateReportState(report.id, ReportState.RESOLVED);
      }

      // Verify each category has count of 1
      for (const category of categories) {
        const count = await statisticsController.getReportCountByCategory(category);
        expect(count).toBe(0);
      }
    });
  });

  // ===================== getReportTrends =====================
  describe("getReportTrends", () => {
    it("should return trends for period=day", async () => {
      const trends = await statisticsController.getReportTrends('day');

      expect(trends).toHaveProperty("period", "day");
      expect(trends).toHaveProperty("data");
      expect(Array.isArray(trends.data)).toBe(true);
    });

    it("should return trends for period=week", async () => {
      const trends = await statisticsController.getReportTrends('week');

      expect(trends).toHaveProperty("period", "week");
      expect(trends).toHaveProperty("data");
      expect(Array.isArray(trends.data)).toBe(true);
    });

    it("should return trends for period=month", async () => {
      const trends = await statisticsController.getReportTrends('month');

      expect(trends).toHaveProperty("period", "month");
      expect(trends).toHaveProperty("data");
      expect(Array.isArray(trends.data)).toBe(true);
    });

    it("should throw BadRequestError for invalid period", async () => {
      await expect(statisticsController.getReportTrends('year' as any))
        .rejects.toThrow(BadRequestError);
    });

    it("should return empty array when no approved reports exist", async () => {
      const user = await userRepo.createUser("testuser", "Test", "User", "test@example.com", "Password@123");

      // Create only PENDING reports
      await reportRepo.createReport(
        "Pending Report",
        { name: "Location", Coordinates: { longitude: 10.5, latitude: 45.5 } },
        user,
        false,
        OfficeType.WASTE,
        { Description: "Description" }
      );

      const trends = await statisticsController.getReportTrends('day');

      expect(trends.data).toEqual([]);
    });

    it("should return trend data with approved reports", async () => {
      const user = await userRepo.createUser("testuser", "Test", "User", "test@example.com", "Password@123");

      // Create approved reports
      const report1 = await reportRepo.createReport(
        "Report 1",
        { name: "Location 1", Coordinates: { longitude: 10.5, latitude: 45.5 } },
        user,
        false,
        OfficeType.WASTE,
        { Description: "Description" }
      );
      await reportRepo.updateReportState(report1.id, ReportState.RESOLVED);

      const report2 = await reportRepo.createReport(
        "Report 2",
        { name: "Location 2", Coordinates: { longitude: 10.6, latitude: 45.6 } },
        user,
        false,
        OfficeType.WATER_SUPPLY,
        { Description: "Description" }
      );
      await reportRepo.updateReportState(report2.id, ReportState.IN_PROGRESS);

      const trends = await statisticsController.getReportTrends('day');

      expect(trends.data.length).toBeGreaterThan(0);
    });

  });

  // ===================== Edge Cases and Error Handling =====================
  describe("Edge Cases and Error Handling", () => {

    it("should handle empty database gracefully", async () => {
      const stats = await statisticsController.getPublicStatistics('day');
      const count = await statisticsController.getReportCountByCategory(OfficeType.WASTE);
      const trends = await statisticsController.getReportTrends('day');

      expect(stats.byCategory).toEqual([]);
      expect(stats.byState).toEqual([]);
      expect(stats.trends.data).toEqual([]);
      expect(count).toBe(0);
      expect(trends.data).toEqual([]);
    });


    it("should validate period parameter in getReportTrends", async () => {
      await expect(statisticsController.getReportTrends('invalid' as any))
        .rejects.toThrow(BadRequestError);

      await expect(statisticsController.getReportTrends(123 as any))
        .rejects.toThrow(BadRequestError);
    });
  });

  // ===================== Data Consistency =====================
  describe("Data Consistency", () => {

    it("should update statistics when report state changes", async () => {
      const user = await userRepo.createUser("testuser", "Test", "User", "test@example.com", "Password@123");

      // Create PENDING report
      const report = await reportRepo.createReport(
        "Report",
        { name: "Location", Coordinates: { longitude: 10.5, latitude: 45.5 } },
        user,
        false,
        OfficeType.WASTE,
        { Description: "Description" }
      );

      // Check initial count
      let count = await statisticsController.getReportCountByCategory(OfficeType.WASTE);
      expect(count).toBe(0);

      // Update to RESOLVED
      await reportRepo.updateReportState(report.id, ReportState.RESOLVED);
    });
  });
});
