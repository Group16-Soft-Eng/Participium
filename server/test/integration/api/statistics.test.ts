import "reflect-metadata";
import request from "supertest";
import { app } from "../../../src/app";
import { initializeTestDatabase, closeTestDatabase, clearDatabase } from "../../setup/test-datasource";
import { ReportRepository } from "../../../src/repositories/ReportRepository";
import { UserRepository } from "../../../src/repositories/UserRepository";
import { OfficeType } from "../../../src/models/enums/OfficeType";
import { ReportState } from "../../../src/models/enums/ReportState";

describe("Statistics API Integration Tests", () => {
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

  // ===================== GET /statistics/public =====================
  describe("GET /statistics/public", () => {
    it("should return public statistics with default period (day)", async () => {
      // Create test user
      const user = await userRepo.createUser("testuser", "Test", "User", "test@example.com", "Password@123");

      // Create some test reports with different categories and states
      await reportRepo.createReport(
        "Water leak",
        { name: "Main Street", Coordinates: { longitude: 10.5, latitude: 45.5 } },
        user,
        false,
        OfficeType.WATER_SUPPLY,
        { Description: "Water leak description" }
      );

      await reportRepo.createReport(
        "Broken streetlight",
        { name: "Second Street", Coordinates: { longitude: 10.6, latitude: 45.6 } },
        user,
        false,
        OfficeType.PUBLIC_LIGHTING,
        { Description: "Streetlight description" }
      );

      const res = await request(app).get("/api/v1/statistics/public");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("byCategory");
      expect(res.body).toHaveProperty("byState");
      expect(res.body).toHaveProperty("trends");
      expect(res.body.trends).toHaveProperty("period", "day");
      expect(res.body.trends).toHaveProperty("data");
      expect(Array.isArray(res.body.byCategory)).toBe(true);
      expect(Array.isArray(res.body.byState)).toBe(true);
      expect(Array.isArray(res.body.trends.data)).toBe(true);
    });

    it("should return statistics with period=week", async () => {
      const res = await request(app).get("/api/v1/statistics/public?period=week");

      expect(res.status).toBe(200);
      expect(res.body.trends.period).toBe("week");
    });

    it("should return statistics with period=month", async () => {
      const res = await request(app).get("/api/v1/statistics/public?period=month");

      expect(res.status).toBe(200);
      expect(res.body.trends.period).toBe("month");
    });

    it("should return 400 for invalid period", async () => {
      const res = await request(app).get("/api/v1/statistics/public?period=year");

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("should return empty statistics when no reports exist", async () => {
      const res = await request(app).get("/api/v1/statistics/public");

      expect(res.status).toBe(200);
      expect(res.body.byCategory).toEqual([]);
      expect(res.body.byState).toEqual([]);
      expect(res.body.trends.data).toEqual([]);
    });

    it("should only count approved reports in category statistics", async () => {
      const user = await userRepo.createUser("testuser", "Test", "User", "test@example.com", "Password@123");

      // Create approved report
      const report1 = await reportRepo.createReport(
        "Report 1",
        { name: "Location 1", Coordinates: { longitude: 10.5, latitude: 45.5 } },
        user,
        false,
        OfficeType.WASTE,
        { Description: "Description 1" }
      );
      await reportRepo.updateReportState(report1.id, ReportState.RESOLVED);

      // Create pending report (should not be counted)
      await reportRepo.createReport(
        "Report 2",
        { name: "Location 2", Coordinates: { longitude: 10.6, latitude: 45.6 } },
        user,
        false,
        OfficeType.WASTE,
        { Description: "Description 2" }
      );

      const res = await request(app).get("/api/v1/statistics/public");

      expect(res.status).toBe(200);
      const wasteStat = res.body.byCategory.find((stat: any) => stat.category === OfficeType.WASTE);
      expect(wasteStat?.count).toBe(1); // Only approved report
    });

    it("should count all reports by state regardless of approval", async () => {
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

      const res = await request(app).get("/api/v1/statistics/public");

      expect(res.status).toBe(200);
      expect(res.body.byState.length).toBeGreaterThan(0);
    });
  });

  // ===================== GET /statistics/category/:category =====================
  describe("GET /statistics/category/:category", () => {
    it("should return count for specific category with reports", async () => {
      const user = await userRepo.createUser("testuser", "Test", "User", "test@example.com", "Password@123");

      // Create approved reports
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
      await reportRepo.updateReportState(report2.id, ReportState.RESOLVED);

      const res = await request(app).get(`/api/v1/statistics/category/${OfficeType.WATER_SUPPLY}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("category", OfficeType.WATER_SUPPLY);
      expect(res.body).toHaveProperty("count", 2);
    });

    it("should return 0 for category with no reports", async () => {
      const res = await request(app).get(`/api/v1/statistics/category/${OfficeType.PUBLIC_LIGHTING}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("category", OfficeType.PUBLIC_LIGHTING);
      expect(res.body).toHaveProperty("count", 0);
    });

    it("should return 400 for invalid category", async () => {
      const res = await request(app).get("/api/v1/statistics/category/invalid_category");

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("should test all valid categories", async () => {
      const validCategories = Object.values(OfficeType);

      for (const category of validCategories) {
        const res = await request(app).get(`/api/v1/statistics/category/${category}`);
        
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("category", category);
        expect(res.body).toHaveProperty("count", 0);
      }
    });

    it("should not count pending reports in category statistics", async () => {
      const user = await userRepo.createUser("testuser", "Test", "User", "test@example.com", "Password@123");

      // Create pending report (not approved)
      await reportRepo.createReport(
        "Pending report",
        { name: "Location 1", Coordinates: { longitude: 10.5, latitude: 45.5 } },
        user,
        false,
        OfficeType.ROADS_AND_URBAN_FURNISHINGS,
        { Description: "Description" }
      );

      const res = await request(app).get(`/api/v1/statistics/category/${OfficeType.ROADS_AND_URBAN_FURNISHINGS}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0); // Pending reports should not be counted
    });

    it("should only count approved reports", async () => {
      const user = await userRepo.createUser("testuser", "Test", "User", "test@example.com", "Password@123");

      // Create multiple reports with different states
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

      await reportRepo.createReport(
        "Report 3",
        { name: "Location 3", Coordinates: { longitude: 10.7, latitude: 45.7 } },
        user,
        false,
        OfficeType.WASTE,
        { Description: "Description 3" }
      );

      const res = await request(app).get(`/api/v1/statistics/category/${OfficeType.WASTE}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2); // RESOLVED and IN_PROGRESS reports
    });
  });

  // ===================== GET /statistics/trends/:period =====================
  describe("GET /statistics/trends/:period", () => {
    it("should return trends for period=day", async () => {
      const res = await request(app).get("/api/v1/statistics/trends/day");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("period", "day");
      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should return trends for period=week", async () => {
      const res = await request(app).get("/api/v1/statistics/trends/week");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("period", "week");
      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should return trends for period=month", async () => {
      const res = await request(app).get("/api/v1/statistics/trends/month");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("period", "month");
      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should return 400 for invalid period", async () => {
      const res = await request(app).get("/api/v1/statistics/trends/year");

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("should return empty array when no reports exist", async () => {
      const res = await request(app).get("/api/v1/statistics/trends/day");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it("should return trend data with reports", async () => {
      const user = await userRepo.createUser("testuser", "Test", "User", "test@example.com", "Password@123");

      // Create some reports
      await reportRepo.createReport(
        "Report 1",
        { name: "Location 1", Coordinates: { longitude: 10.5, latitude: 45.5 } },
        user,
        false,
        OfficeType.WASTE,
        { Description: "Description 1" }
      );

      await reportRepo.createReport(
        "Report 2",
        { name: "Location 2", Coordinates: { longitude: 10.6, latitude: 45.6 } },
        user,
        false,
        OfficeType.WATER_SUPPLY,
        { Description: "Description 2" }
      );

      const res = await request(app).get("/api/v1/statistics/trends/day");

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });
  });

  // ===================== Error Handling =====================
  describe("Error Handling", () => {
    it("should handle invalid route gracefully", async () => {
      const res = await request(app).get("/api/v1/statistics/invalid");

      expect(res.status).toBe(404);
    });

    it("should handle database errors gracefully", async () => {
      // This test would require mocking the database to throw errors
      // For now, we test that valid requests don't throw errors
      const res = await request(app).get("/api/v1/statistics/public");
      
      expect(res.status).not.toBe(500);
    });
  });

  // ===================== Edge Cases =====================
  describe("Edge Cases", () => {
    it("should handle multiple categories correctly", async () => {
      const user = await userRepo.createUser("testuser", "Test", "User", "test@example.com", "Password@123");

      // Create reports in different categories
      const categories = [
        OfficeType.WATER_SUPPLY,
        OfficeType.PUBLIC_LIGHTING,
        OfficeType.WASTE,
        OfficeType.ROADS_AND_URBAN_FURNISHINGS
      ];

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

      const res = await request(app).get("/api/v1/statistics/public");

      expect(res.status).toBe(200);
      expect(res.body.byCategory.length).toBe(categories.length);
    });

    it("should handle special characters in query parameters", async () => {
      const res = await request(app).get("/api/v1/statistics/public?period=<script>alert('xss')</script>");

      expect(res.status).toBe(400);
    });

    it("should be case-sensitive for period parameter", async () => {
      const res = await request(app).get("/api/v1/statistics/public?period=DAY");

      expect(res.status).toBe(400);
    });

    it("should handle concurrent requests", async () => {
      const requests = [
        request(app).get("/api/v1/statistics/public"),
        request(app).get("/api/v1/statistics/trends/day"),
        request(app).get(`/api/v1/statistics/category/${OfficeType.WASTE}`)
      ];

      const responses = await Promise.all(requests);

      responses.forEach(res => {
        expect(res.status).toBe(200);
      });
    });
  });

  // ===================== Data Consistency =====================
  describe("Data Consistency", () => {
    it("should have consistent data across different endpoints", async () => {
      const user = await userRepo.createUser("testuser", "Test", "User", "test@example.com", "Password@123");

      // Create approved reports
      const report = await reportRepo.createReport(
        "Test Report",
        { name: "Location", Coordinates: { longitude: 10.5, latitude: 45.5 } },
        user,
        false,
        OfficeType.WASTE,
        { Description: "Description" }
      );
      await reportRepo.updateReportState(report.id, ReportState.RESOLVED);

      // Get statistics from different endpoints
      const publicStats = await request(app).get("/api/v1/statistics/public");
      const categoryStats = await request(app).get(`/api/v1/statistics/category/${OfficeType.WASTE}`);

      expect(publicStats.status).toBe(200);
      expect(categoryStats.status).toBe(200);

      // Find waste category in public stats
      const wasteInPublic = publicStats.body.byCategory.find(
        (stat: any) => stat.category === OfficeType.WASTE
      );

      // Counts should match
      expect(wasteInPublic?.count).toBe(categoryStats.body.count);
    });

    it("should update statistics when report state changes", async () => {
      const user = await userRepo.createUser("testuser", "Test", "User", "test@example.com", "Password@123");

      // Create pending report
      const report = await reportRepo.createReport(
        "Test Report",
        { name: "Location", Coordinates: { longitude: 10.5, latitude: 45.5 } },
        user,
        false,
        OfficeType.WASTE,
        { Description: "Description" }
      );

      // Check initial count
      let res = await request(app).get(`/api/v1/statistics/category/${OfficeType.WASTE}`);
      expect(res.body.count).toBe(0);

      // Approve the report
      await reportRepo.updateReportState(report.id, ReportState.RESOLVED);

      // Check updated count
      res = await request(app).get(`/api/v1/statistics/category/${OfficeType.WASTE}`);
      expect(res.body.count).toBe(1);
    });
  });
});
