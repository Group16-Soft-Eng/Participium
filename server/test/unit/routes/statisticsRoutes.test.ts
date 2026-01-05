import request from "supertest";
import express from "express";
import { statisticsRouter } from "../../../src/routes/StatisticsRoutes";
import * as statisticsController from "../../../src/controllers/statisticsController";
import { OfficeType } from "../../../src/models/enums/OfficeType";
import { BadRequestError } from "../../../src/utils/utils";

jest.mock("../../../src/controllers/statisticsController");

const app = express();
app.use(express.json());
app.use("/statistics", statisticsRouter);

// Error handler middleware
app.use((err: any, req: any, res: any, next: any) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || "Internal server error"
  });
});

describe("StatisticsRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /statistics/public", () => {
    it("should return public statistics with default period", async () => {
      const mockStatistics = {
        byCategory: [
          { category: OfficeType.WATER_SUPPLY, count: 10 },
          { category: OfficeType.WASTE, count: 5 }
        ],
        byState: [
          { state: "OPEN", count: 8 },
          { state: "CLOSED", count: 7 }
        ],
        trends: {
          period: "day",
          data: [
            { date: "2026-01-05", count: 3 },
            { date: "2026-01-04", count: 5 }
          ]
        }
      };

      (statisticsController.getPublicStatistics as jest.Mock).mockResolvedValue(mockStatistics);

      const res = await request(app).get("/statistics/public");
      
      expect(statisticsController.getPublicStatistics).toHaveBeenCalledWith(undefined);
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockStatistics);
      expect(res.body.trends.period).toBe("day");
    });

    it("should return statistics with specified period (week)", async () => {
      const mockStatistics = {
        byCategory: [{ category: OfficeType.ROADS_AND_URBAN_FURNISHINGS, count: 15 }],
        byState: [{ state: "OPEN", count: 15 }],
        trends: {
          period: "week",
          data: [{ date: "2026-W01", count: 15 }]
        }
      };

      (statisticsController.getPublicStatistics as jest.Mock).mockResolvedValue(mockStatistics);

      const res = await request(app).get("/statistics/public?period=week");
      
      expect(statisticsController.getPublicStatistics).toHaveBeenCalledWith("week");
      expect(res.status).toBe(200);
      expect(res.body.trends.period).toBe("week");
    });

    it("should return statistics with specified period (month)", async () => {
      const mockStatistics = {
        byCategory: [],
        byState: [],
        trends: {
          period: "month",
          data: []
        }
      };

      (statisticsController.getPublicStatistics as jest.Mock).mockResolvedValue(mockStatistics);

      const res = await request(app).get("/statistics/public?period=month");
      
      expect(statisticsController.getPublicStatistics).toHaveBeenCalledWith("month");
      expect(res.status).toBe(200);
      expect(res.body.trends.period).toBe("month");
    });

    it("should handle invalid period parameter", async () => {
      (statisticsController.getPublicStatistics as jest.Mock).mockRejectedValue(
        new BadRequestError("Invalid period. Must be one of: day, week, month")
      );

      const res = await request(app).get("/statistics/public?period=invalid");
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid period");
    });

    it("should handle errors in getPublicStatistics", async () => {
      (statisticsController.getPublicStatistics as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const res = await request(app).get("/statistics/public");
      
      expect(res.status).toBe(500);
    });

    it("should return empty arrays when no data available", async () => {
      const mockStatistics = {
        byCategory: [],
        byState: [],
        trends: {
          period: "day",
          data: []
        }
      };

      (statisticsController.getPublicStatistics as jest.Mock).mockResolvedValue(mockStatistics);

      const res = await request(app).get("/statistics/public");
      
      expect(res.status).toBe(200);
      expect(res.body.byCategory).toEqual([]);
      expect(res.body.byState).toEqual([]);
      expect(res.body.trends.data).toEqual([]);
    });
  });

  describe("GET /statistics/category/:category", () => {
    it("should return count for valid category (WATER_SUPPLY)", async () => {
      (statisticsController.getReportCountByCategory as jest.Mock).mockResolvedValue(12);

      const res = await request(app).get("/statistics/category/water_supply");
      
      expect(statisticsController.getReportCountByCategory).toHaveBeenCalledWith(OfficeType.WATER_SUPPLY);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ category: "water_supply", count: 12 });
    });

    it("should return count for valid category (WASTE)", async () => {
      (statisticsController.getReportCountByCategory as jest.Mock).mockResolvedValue(8);

      const res = await request(app).get("/statistics/category/waste");
      
      expect(statisticsController.getReportCountByCategory).toHaveBeenCalledWith(OfficeType.WASTE);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ category: "waste", count: 8 });
    });

    it("should return count for valid category (PUBLIC_LIGHTING)", async () => {
      (statisticsController.getReportCountByCategory as jest.Mock).mockResolvedValue(5);

      const res = await request(app).get("/statistics/category/public_lighting");
      
      expect(statisticsController.getReportCountByCategory).toHaveBeenCalledWith(OfficeType.PUBLIC_LIGHTING);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ category: "public_lighting", count: 5 });
    });

    it("should return zero count for category with no reports", async () => {
      (statisticsController.getReportCountByCategory as jest.Mock).mockResolvedValue(0);

      const res = await request(app).get("/statistics/category/architectural_barriers");
      
      expect(statisticsController.getReportCountByCategory).toHaveBeenCalledWith(OfficeType.ARCHITECTURAL_BARRIERS);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ category: "architectural_barriers", count: 0 });
    });

    it("should return 400 for invalid category", async () => {
      const res = await request(app).get("/statistics/category/invalid_category");
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid category");
    });

    it("should handle all valid OfficeType categories", async () => {
      const categories = [
        OfficeType.WATER_SUPPLY,
        OfficeType.ARCHITECTURAL_BARRIERS,
        OfficeType.PUBLIC_LIGHTING,
        OfficeType.WASTE,
        OfficeType.ROAD_SIGNS_AND_TRAFFIC_LIGHTS,
        OfficeType.ROADS_AND_URBAN_FURNISHINGS,
        OfficeType.PUBLIC_GREEN_AREAS_AND_PLAYGROUNDS,
        OfficeType.ORGANIZATION,
        OfficeType.OTHER
      ];

      for (const category of categories) {
        (statisticsController.getReportCountByCategory as jest.Mock).mockResolvedValue(1);
        
        const res = await request(app).get(`/statistics/category/${category}`);
        
        expect(res.status).toBe(200);
        expect(res.body.category).toBe(category);
      }
    });

    it("should handle errors in getReportCountByCategory", async () => {
      (statisticsController.getReportCountByCategory as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const res = await request(app).get("/statistics/category/waste");
      
      expect(res.status).toBe(500);
    });
  });

  describe("GET /statistics/trends/:period", () => {
    it("should return trends for day period", async () => {
      const mockTrends = {
        period: "day",
        data: [
          { date: "2026-01-05", count: 3 },
          { date: "2026-01-04", count: 5 },
          { date: "2026-01-03", count: 2 }
        ]
      };

      (statisticsController.getReportTrends as jest.Mock).mockResolvedValue(mockTrends);

      const res = await request(app).get("/statistics/trends/day");
      
      expect(statisticsController.getReportTrends).toHaveBeenCalledWith("day");
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockTrends);
      expect(res.body.period).toBe("day");
    });

    it("should return trends for week period", async () => {
      const mockTrends = {
        period: "week",
        data: [
          { date: "2026-W01", count: 10 },
          { date: "2025-W52", count: 8 }
        ]
      };

      (statisticsController.getReportTrends as jest.Mock).mockResolvedValue(mockTrends);

      const res = await request(app).get("/statistics/trends/week");
      
      expect(statisticsController.getReportTrends).toHaveBeenCalledWith("week");
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockTrends);
      expect(res.body.period).toBe("week");
    });

    it("should return trends for month period", async () => {
      const mockTrends = {
        period: "month",
        data: [
          { date: "2026-01", count: 25 },
          { date: "2025-12", count: 30 }
        ]
      };

      (statisticsController.getReportTrends as jest.Mock).mockResolvedValue(mockTrends);

      const res = await request(app).get("/statistics/trends/month");
      
      expect(statisticsController.getReportTrends).toHaveBeenCalledWith("month");
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockTrends);
      expect(res.body.period).toBe("month");
    });

    it("should return empty data when no trends available", async () => {
      const mockTrends = {
        period: "day",
        data: []
      };

      (statisticsController.getReportTrends as jest.Mock).mockResolvedValue(mockTrends);

      const res = await request(app).get("/statistics/trends/day");
      
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it("should handle invalid period parameter", async () => {
      (statisticsController.getReportTrends as jest.Mock).mockRejectedValue(
        new BadRequestError("Invalid period. Must be one of: day, week, month")
      );

      const res = await request(app).get("/statistics/trends/invalid");
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid period");
    });

    it("should handle errors in getReportTrends", async () => {
      (statisticsController.getReportTrends as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const res = await request(app).get("/statistics/trends/day");
      
      expect(res.status).toBe(500);
    });
  });

  describe("Route validation", () => {
    it("should not require authentication for public statistics", async () => {
      const mockStatistics = {
        byCategory: [],
        byState: [],
        trends: { period: "day", data: [] }
      };

      (statisticsController.getPublicStatistics as jest.Mock).mockResolvedValue(mockStatistics);

      const res = await request(app).get("/statistics/public");
      
      expect(res.status).toBe(200);
    });

    it("should not require authentication for category statistics", async () => {
      (statisticsController.getReportCountByCategory as jest.Mock).mockResolvedValue(0);

      const res = await request(app).get("/statistics/category/waste");
      
      expect(res.status).toBe(200);
    });

    it("should not require authentication for trends", async () => {
      const mockTrends = { period: "day", data: [] };
      (statisticsController.getReportTrends as jest.Mock).mockResolvedValue(mockTrends);

      const res = await request(app).get("/statistics/trends/day");
      
      expect(res.status).toBe(200);
    });

    it("should return 404 for non-existent routes", async () => {
      const res = await request(app).get("/statistics/nonexistent");
      
      expect(res.status).toBe(404);
    });
  });
});
