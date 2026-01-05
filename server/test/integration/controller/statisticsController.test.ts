import "reflect-metadata";
import { initializeTestDatabase, closeTestDatabase, clearDatabase } from "../../setup/test-datasource";
import { UserRepository } from "../../../src/repositories/UserRepository";
import { ReportRepository } from "../../../src/repositories/ReportRepository";
import { getStatistics } from "../../../src/controllers/statisticsController";
import { OfficeType } from "../../../src/models/enums/OfficeType";
import { ReportState } from "../../../src/models/enums/ReportState";
import { BadRequestError } from "../../../src/utils/utils";

describe("StatisticsController - Integration Tests", () => {
  let userRepo: UserRepository;
  let reportRepo: ReportRepository;
  let userId: number;

  beforeAll(async () => {
    await initializeTestDatabase();
    userRepo = new UserRepository();
    reportRepo = new ReportRepository();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Create a test user
    const user = await userRepo.createUser(
      "testuser",
      "Test",
      "User",
      "test@example.com",
      "Password@123"
    );
    userId = user.id;
  });

  // ===================== getStatistics - No filters =====================
  describe("getStatistics - No filters", () => {
    it("should return empty statistics when no reports exist", async () => {
      const result = await getStatistics();

      expect('byCategory' in result).toBe(true);
      expect('byState' in result).toBe(true);
      expect((result as any).byCategory).toEqual([]);
      expect((result as any).byState).toEqual([]);
    });

    it("should return statistics with all categories and states when reports exist", async () => {
      // Create reports in different categories and states
      const user = await userRepo.getUserById(userId);

      // WASTE - ASSIGNED
      const report1 = await reportRepo.createReport(
        "Waste Report",
        { name: "Location 1", Coordinates: { longitude: 10.5, latitude: 45.5 } },
        user,
        false,
        OfficeType.WASTE,
        { Description: "Waste issue" }
      );
      report1.state = ReportState.ASSIGNED;
      await reportRepo.updateReport(report1);

      // PUBLIC_LIGHTING - IN_PROGRESS
      const report2 = await reportRepo.createReport(
        "Lighting Report",
        { name: "Location 2", Coordinates: { longitude: 10.6, latitude: 45.6 } },
        user,
        false,
        OfficeType.PUBLIC_LIGHTING,
        { Description: "Lighting issue" }
      );
      report2.state = ReportState.IN_PROGRESS;
      await reportRepo.updateReport(report2);

      // WASTE - SUSPENDED
      const report3 = await reportRepo.createReport(
        "Another Waste Report",
        { name: "Location 3", Coordinates: { longitude: 10.7, latitude: 45.7 } },
        user,
        false,
        OfficeType.WASTE,
        { Description: "Another waste issue" }
      );
      report3.state = ReportState.SUSPENDED;
      await reportRepo.updateReport(report3);

      // PENDING report - should not be included in category stats
      await reportRepo.createReport(
        "Pending Report",
        { name: "Location 4", Coordinates: { longitude: 10.8, latitude: 45.8 } },
        user,
        false,
        OfficeType.WATER_SUPPLY,
        { Description: "Pending issue" }
      );

      const result = await getStatistics();

      expect('byCategory' in result).toBe(true);
      expect('byState' in result).toBe(true);

      const byCategory = (result as any).byCategory;
      const byState = (result as any).byState;

      // Check category stats (only ASSIGNED, IN_PROGRESS, SUSPENDED)
      expect(byCategory).toHaveLength(2);
      expect(byCategory).toContainEqual({ category: OfficeType.WASTE, count: 2 });
      expect(byCategory).toContainEqual({ category: OfficeType.PUBLIC_LIGHTING, count: 1 });

      // Check state stats (all states)
      expect(byState.length).toBeGreaterThan(0);
      const assignedState = byState.find((s: any) => s.state === ReportState.ASSIGNED);
      const inProgressState = byState.find((s: any) => s.state === ReportState.IN_PROGRESS);
      const suspendedState = byState.find((s: any) => s.state === ReportState.SUSPENDED);
      const pendingState = byState.find((s: any) => s.state === ReportState.PENDING);

      expect(assignedState?.count).toBe(1);
      expect(inProgressState?.count).toBe(1);
      expect(suspendedState?.count).toBe(1);
      expect(pendingState?.count).toBe(1);
    });
  });

  // ===================== getStatistics - Period filter only =====================
  describe("getStatistics - Period filter only", () => {
    it("should return category stats and trends for day period", async () => {
      const user = await userRepo.getUserById(userId);

      // Create reports
      const report1 = await reportRepo.createReport(
        "Report 1",
        { name: "Location 1", Coordinates: { longitude: 10.5, latitude: 45.5 } },
        user,
        false,
        OfficeType.WASTE,
        { Description: "Issue 1" }
      );
      report1.state = ReportState.ASSIGNED;
      await reportRepo.updateReport(report1);

      const result = await getStatistics('day');

      expect('byCategory' in result).toBe(true);
      expect('trends' in result).toBe(true);
      expect((result as any).trends.period).toBe('day');
      expect((result as any).trends.data).toBeDefined();
      expect(Array.isArray((result as any).trends.data)).toBe(true);
    });

    it("should return category stats and trends for week period", async () => {
      const user = await userRepo.getUserById(userId);

      const report = await reportRepo.createReport(
        "Report",
        { name: "Location", Coordinates: { longitude: 10.5, latitude: 45.5 } },
        user,
        false,
        OfficeType.PUBLIC_LIGHTING,
        { Description: "Issue" }
      );
      report.state = ReportState.IN_PROGRESS;
      await reportRepo.updateReport(report);

      const result = await getStatistics('week');

      expect('trends' in result).toBe(true);
      expect((result as any).trends.period).toBe('week');
    });

    it("should return category stats and trends for month period", async () => {
      const user = await userRepo.getUserById(userId);

      const report = await reportRepo.createReport(
        "Report",
        { name: "Location", Coordinates: { longitude: 10.5, latitude: 45.5 } },
        user,
        false,
        OfficeType.ROADS_AND_URBAN_FURNISHINGS,
        { Description: "Issue" }
      );
      report.state = ReportState.SUSPENDED;
      await reportRepo.updateReport(report);

      const result = await getStatistics('month');

      expect('trends' in result).toBe(true);
      expect((result as any).trends.period).toBe('month');
    });

    it("should not include byState when period is specified", async () => {
      const result = await getStatistics('day');

      expect('byState' in result).toBe(false);
    });
  });

  // ===================== getStatistics - Category filter only =====================
  describe("getStatistics - Category filter only", () => {
    it("should return count for specific category when reports exist", async () => {
      const user = await userRepo.getUserById(userId);

      // Create 3 WASTE reports
      for (let i = 0; i < 3; i++) {
        const report = await reportRepo.createReport(
          `Waste Report ${i + 1}`,
          { name: `Location ${i + 1}`, Coordinates: { longitude: 10.5 + i, latitude: 45.5 + i } },
          user,
          false,
          OfficeType.WASTE,
          { Description: `Waste issue ${i + 1}` }
        );
        report.state = ReportState.ASSIGNED;
        await reportRepo.updateReport(report);
      }

      // Create 1 PUBLIC_LIGHTING report (should not be counted)
      const otherReport = await reportRepo.createReport(
        "Lighting Report",
        { name: "Other Location", Coordinates: { longitude: 11.0, latitude: 46.0 } },
        user,
        false,
        OfficeType.PUBLIC_LIGHTING,
        { Description: "Lighting issue" }
      );
      otherReport.state = ReportState.IN_PROGRESS;
      await reportRepo.updateReport(otherReport);

      const result = await getStatistics(undefined, OfficeType.WASTE);

      expect('category' in result).toBe(true);
      expect('count' in result).toBe(true);
      expect((result as any).category).toBe(OfficeType.WASTE);
      expect((result as any).count).toBe(3);
    });

    it("should return 0 when category has no reports", async () => {
      const result = await getStatistics(undefined, OfficeType.WATER_SUPPLY);

      expect((result as any).category).toBe(OfficeType.WATER_SUPPLY);
      expect((result as any).count).toBe(0);
    });

    it("should not include byState when category is specified", async () => {
      const result = await getStatistics(undefined, OfficeType.WASTE);

      expect('byState' in result).toBe(false);
    });

    it("should work with all category types", async () => {
      const user = await userRepo.getUserById(userId);

      // Test multiple categories
      const categories = [
        OfficeType.WATER_SUPPLY,
        OfficeType.ARCHITECTURAL_BARRIERS,
        OfficeType.PUBLIC_LIGHTING,
        OfficeType.WASTE,
        OfficeType.ROADS_AND_URBAN_FURNISHINGS,
        OfficeType.OTHER
      ];

      for (const category of categories) {
        await clearDatabase();
        const newUser = await userRepo.createUser(
          `user_${category}`,
          "Test",
          "User",
          `test_${category}@example.com`,
          "Password@123"
        );

        const report = await reportRepo.createReport(
          `Report for ${category}`,
          { name: "Location", Coordinates: { longitude: 10.5, latitude: 45.5 } },
          newUser,
          false,
          category,
          { Description: "Issue" }
        );
        report.state = ReportState.ASSIGNED;
        await reportRepo.updateReport(report);

        const result = await getStatistics(undefined, category);

        expect((result as any).category).toBe(category);
        expect((result as any).count).toBe(1);
      }
    });
  });

  // ===================== getStatistics - Both period and category =====================
  describe("getStatistics - Both period and category filters", () => {
    it("should return filtered count and trends when both parameters provided", async () => {
      const user = await userRepo.getUserById(userId);

      // Create WASTE reports
      for (let i = 0; i < 5; i++) {
        const report = await reportRepo.createReport(
          `Waste Report ${i + 1}`,
          { name: `Location ${i + 1}`, Coordinates: { longitude: 10.5 + i, latitude: 45.5 + i } },
          user,
          false,
          OfficeType.WASTE,
          { Description: `Waste issue ${i + 1}` }
        );
        report.state = ReportState.ASSIGNED;
        await reportRepo.updateReport(report);
      }

      // Create PUBLIC_LIGHTING reports (should not be counted)
      const otherReport = await reportRepo.createReport(
        "Lighting Report",
        { name: "Other Location", Coordinates: { longitude: 11.0, latitude: 46.0 } },
        user,
        false,
        OfficeType.PUBLIC_LIGHTING,
        { Description: "Lighting issue" }
      );
      otherReport.state = ReportState.IN_PROGRESS;
      await reportRepo.updateReport(otherReport);

      const result = await getStatistics('month', OfficeType.WASTE);

      expect('category' in result).toBe(true);
      expect('count' in result).toBe(true);
      expect('trends' in result).toBe(true);
      
      expect((result as any).category).toBe(OfficeType.WASTE);
      expect((result as any).count).toBe(5);
      expect((result as any).trends.period).toBe('month');
      expect((result as any).trends.data).toBeDefined();
    });

    it("should handle all period types with category filter", async () => {
      const periods: ('day' | 'week' | 'month')[] = ['day', 'week', 'month'];

      for (const period of periods) {
        const user = await userRepo.getUserById(userId);
        
        const report = await reportRepo.createReport(
          `Report for ${period}`,
          { name: "Location", Coordinates: { longitude: 10.5, latitude: 45.5 } },
          user,
          false,
          OfficeType.WASTE,
          { Description: "Issue" }
        );
        report.state = ReportState.ASSIGNED;
        await reportRepo.updateReport(report);

        const result = await getStatistics(period, OfficeType.WASTE);

        expect((result as any).category).toBe(OfficeType.WASTE);
        expect((result as any).trends.period).toBe(period);

        // Clean up for next iteration
        await clearDatabase();
        const newUser = await userRepo.createUser(
          `user_${period}`,
          "Test",
          "User",
          `test_${period}@example.com`,
          "Password@123"
        );
        userId = newUser.id;
      }
    });
  });

  // ===================== getStatistics - Input validation =====================
  describe("getStatistics - Input validation", () => {
    it("should throw BadRequestError for invalid period", async () => {
      await expect(getStatistics('invalid' as any)).rejects.toThrow(BadRequestError);
      await expect(getStatistics('invalid' as any)).rejects.toThrow('Invalid period. Must be one of: day, week, month');
    });

    it("should throw BadRequestError for invalid category", async () => {
      await expect(getStatistics(undefined, 'invalid_category' as any)).rejects.toThrow(BadRequestError);
      await expect(getStatistics(undefined, 'invalid_category' as any)).rejects.toThrow('Invalid category');
    });

    it("should validate period even with valid category", async () => {
      await expect(getStatistics('year' as any, OfficeType.WASTE)).rejects.toThrow(BadRequestError);
    });

    it("should validate category even with valid period", async () => {
      await expect(getStatistics('month', 'not_a_category' as any)).rejects.toThrow(BadRequestError);
    });
  });

  // ===================== getStatistics - Edge cases =====================
  describe("getStatistics - Edge cases", () => {
    it("should handle reports with only PENDING state correctly", async () => {
      const user = await userRepo.getUserById(userId);

      // Create only PENDING reports
      await reportRepo.createReport(
        "Pending Report 1",
        { name: "Location 1", Coordinates: { longitude: 10.5, latitude: 45.5 } },
        user,
        false,
        OfficeType.WASTE,
        { Description: "Pending issue" }
      );

      const result = await getStatistics();

      // Category stats should be empty (PENDING not included)
      expect((result as any).byCategory).toEqual([]);
      
      // State stats should include PENDING
      const byState = (result as any).byState;
      const pendingState = byState.find((s: any) => s.state === ReportState.PENDING);
      expect(pendingState?.count).toBe(1);
    });

    it("should handle anonymous reports correctly", async () => {
      const user = await userRepo.getUserById(userId);

      const report = await reportRepo.createReport(
        "Anonymous Report",
        { name: "Location", Coordinates: { longitude: 10.5, latitude: 45.5 } },
        null, // Anonymous
        true,
        OfficeType.WASTE,
        { Description: "Anonymous issue" }
      );
      report.state = ReportState.ASSIGNED;
      await reportRepo.updateReport(report);

      const result = await getStatistics(undefined, OfficeType.WASTE);

      expect((result as any).count).toBe(1);
    });

    it("should handle multiple reports on same day for trends", async () => {
      const user = await userRepo.getUserById(userId);

      // Create multiple reports on the same day
      for (let i = 0; i < 5; i++) {
        const report = await reportRepo.createReport(
          `Report ${i + 1}`,
          { name: `Location ${i + 1}`, Coordinates: { longitude: 10.5 + i, latitude: 45.5 + i } },
          user,
          false,
          OfficeType.WASTE,
          { Description: `Issue ${i + 1}` }
        );
        report.state = ReportState.ASSIGNED;
        await reportRepo.updateReport(report);
      }

      const result = await getStatistics('day');

      expect((result as any).trends.data.length).toBeGreaterThan(0);
      // All reports should be counted in today's trend
      const todayCount = (result as any).trends.data[0]?.count;
      expect(todayCount).toBe(5);
    });

    it("should limit trends to 30 periods", async () => {
      const user = await userRepo.getUserById(userId);

      // Create a report
      const report = await reportRepo.createReport(
        "Report",
        { name: "Location", Coordinates: { longitude: 10.5, latitude: 45.5 } },
        user,
        false,
        OfficeType.WASTE,
        { Description: "Issue" }
      );
      report.state = ReportState.ASSIGNED;
      await reportRepo.updateReport(report);

      const result = await getStatistics('day');

      expect((result as any).trends.data.length).toBeLessThanOrEqual(30);
    });
  });

  // ===================== getStatistics - Real data scenarios =====================
  describe("getStatistics - Real data scenarios", () => {
    it("should correctly aggregate mixed state reports", async () => {
      const user = await userRepo.getUserById(userId);

      // Create reports in all states
      const states = [
        ReportState.PENDING,
        ReportState.ASSIGNED,
        ReportState.IN_PROGRESS,
        ReportState.SUSPENDED,
        ReportState.RESOLVED,
        ReportState.DECLINED
      ];

      for (const state of states) {
        const report = await reportRepo.createReport(
          `Report ${state}`,
          { name: "Location", Coordinates: { longitude: 10.5, latitude: 45.5 } },
          user,
          false,
          OfficeType.WASTE,
          { Description: "Issue" }
        );
        report.state = state;
        await reportRepo.updateReport(report);
      }

      const result = await getStatistics();

      // Only ASSIGNED, IN_PROGRESS, SUSPENDED should be in category stats
      expect((result as any).byCategory).toHaveLength(1);
      expect((result as any).byCategory[0].count).toBe(3);

      // All states should be in state stats
      expect((result as any).byState.length).toBe(6);
    });

  });
});
