import {
  getPublicStatistics,
  getReportCountByCategory,
  getReportTrends
} from "../../../src/controllers/statisticsController";
import { ReportRepository } from "../../../src/repositories/ReportRepository";
import { OfficeType } from "../../../src/models/enums/OfficeType";
import { BadRequestError } from "../../../src/utils/utils";

jest.mock("../../../src/repositories/ReportRepository");

describe("StatisticsController", () => {
  let mockReportRepo: jest.Mocked<ReportRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReportRepo = new ReportRepository() as jest.Mocked<ReportRepository>;
  });

  describe("getPublicStatistics", () => {
    it("should return complete statistics with default period (day)", async () => {
      const mockByCategory = [
        { category: OfficeType.WATER_SUPPLY, count: 10 },
        { category: OfficeType.WASTE, count: 15 }
      ];
      const mockByState = [
        { state: "PENDING", count: 5 },
        { state: "ASSIGNED", count: 20 }
      ];
      const mockTrends = [
        { period: "2026-01-05", count: 8 },
        { period: "2026-01-04", count: 12 }
      ];

      (ReportRepository.prototype.getReportCountByCategory as jest.Mock).mockResolvedValue(mockByCategory);
      (ReportRepository.prototype.getReportCountByState as jest.Mock).mockResolvedValue(mockByState);
      (ReportRepository.prototype.getReportTrendsByPeriod as jest.Mock).mockResolvedValue(mockTrends);

      const result = await getPublicStatistics();

      expect(ReportRepository.prototype.getReportCountByCategory).toHaveBeenCalled();
      expect(ReportRepository.prototype.getReportCountByState).toHaveBeenCalled();
      expect(ReportRepository.prototype.getReportTrendsByPeriod).toHaveBeenCalledWith("day");
      
      expect(result).toEqual({
        byCategory: mockByCategory,
        byState: mockByState,
        trends: {
          period: "day",
          data: mockTrends
        }
      });
    });

    it("should return statistics for period 'week'", async () => {
      const mockByCategory = [{ category: OfficeType.ROADS_AND_URBAN_FURNISHINGS, count: 5 }];
      const mockByState = [{ state: "IN_PROGRESS", count: 3 }];
      const mockTrends = [{ period: "2026-01", count: 25 }];

      (ReportRepository.prototype.getReportCountByCategory as jest.Mock).mockResolvedValue(mockByCategory);
      (ReportRepository.prototype.getReportCountByState as jest.Mock).mockResolvedValue(mockByState);
      (ReportRepository.prototype.getReportTrendsByPeriod as jest.Mock).mockResolvedValue(mockTrends);

      const result = await getPublicStatistics("week");

      expect(ReportRepository.prototype.getReportTrendsByPeriod).toHaveBeenCalledWith("week");
      expect(result.trends.period).toBe("week");
      expect(result.trends.data).toEqual(mockTrends);
    });

    it("should return statistics for period 'month'", async () => {
      const mockByCategory = [{ category: OfficeType.PUBLIC_LIGHTING, count: 7 }];
      const mockByState = [{ state: "SUSPENDED", count: 2 }];
      const mockTrends = [{ period: "2026-01", count: 30 }];

      (ReportRepository.prototype.getReportCountByCategory as jest.Mock).mockResolvedValue(mockByCategory);
      (ReportRepository.prototype.getReportCountByState as jest.Mock).mockResolvedValue(mockByState);
      (ReportRepository.prototype.getReportTrendsByPeriod as jest.Mock).mockResolvedValue(mockTrends);

      const result = await getPublicStatistics("month");

      expect(ReportRepository.prototype.getReportTrendsByPeriod).toHaveBeenCalledWith("month");
      expect(result.trends.period).toBe("month");
      expect(result.trends.data).toEqual(mockTrends);
    });

    it("should throw BadRequestError for invalid period", async () => {
      await expect(getPublicStatistics("invalid" as any)).rejects.toThrow(BadRequestError);
      await expect(getPublicStatistics("invalid" as any)).rejects.toThrow(
        "Invalid period. Must be one of: day, week, month"
      );
    });

    it("should throw BadRequestError for year period (not supported)", async () => {
      await expect(getPublicStatistics("year" as any)).rejects.toThrow(BadRequestError);
    });

    it("should handle empty statistics", async () => {
      (ReportRepository.prototype.getReportCountByCategory as jest.Mock).mockResolvedValue([]);
      (ReportRepository.prototype.getReportCountByState as jest.Mock).mockResolvedValue([]);
      (ReportRepository.prototype.getReportTrendsByPeriod as jest.Mock).mockResolvedValue([]);

      const result = await getPublicStatistics("day");

      expect(result.byCategory).toEqual([]);
      expect(result.byState).toEqual([]);
      expect(result.trends.data).toEqual([]);
    });

    it("should handle repository errors for getReportCountByCategory", async () => {
      (ReportRepository.prototype.getReportCountByCategory as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await expect(getPublicStatistics()).rejects.toThrow("Database error");
    });

    it("should handle repository errors for getReportCountByState", async () => {
      (ReportRepository.prototype.getReportCountByCategory as jest.Mock).mockResolvedValue([]);
      (ReportRepository.prototype.getReportCountByState as jest.Mock).mockRejectedValue(
        new Error("State query failed")
      );

      await expect(getPublicStatistics()).rejects.toThrow("State query failed");
    });

    it("should handle repository errors for getReportTrendsByPeriod", async () => {
      (ReportRepository.prototype.getReportCountByCategory as jest.Mock).mockResolvedValue([]);
      (ReportRepository.prototype.getReportCountByState as jest.Mock).mockResolvedValue([]);
      (ReportRepository.prototype.getReportTrendsByPeriod as jest.Mock).mockRejectedValue(
        new Error("Trends query failed")
      );

      await expect(getPublicStatistics()).rejects.toThrow("Trends query failed");
    });
  });

  describe("getReportCountByCategory", () => {
    it("should return count for existing category", async () => {
      const mockStats = [
        { category: OfficeType.WATER_SUPPLY, count: 10 },
        { category: OfficeType.WASTE, count: 15 },
        { category: OfficeType.PUBLIC_LIGHTING, count: 7 }
      ];

      (ReportRepository.prototype.getReportCountByCategory as jest.Mock).mockResolvedValue(mockStats);

      const count = await getReportCountByCategory(OfficeType.WASTE);

      expect(ReportRepository.prototype.getReportCountByCategory).toHaveBeenCalled();
      expect(count).toBe(15);
    });

    it("should return 0 for category with no reports", async () => {
      const mockStats = [
        { category: OfficeType.WATER_SUPPLY, count: 10 },
        { category: OfficeType.WASTE, count: 15 }
      ];

      (ReportRepository.prototype.getReportCountByCategory as jest.Mock).mockResolvedValue(mockStats);

      const count = await getReportCountByCategory(OfficeType.ARCHITECTURAL_BARRIERS);

      expect(count).toBe(0);
    });

    it("should return 0 when no statistics available", async () => {
      (ReportRepository.prototype.getReportCountByCategory as jest.Mock).mockResolvedValue([]);

      const count = await getReportCountByCategory(OfficeType.WATER_SUPPLY);

      expect(count).toBe(0);
    });

    it("should handle all OfficeType categories", async () => {
      const mockStats = [
        { category: OfficeType.WATER_SUPPLY, count: 5 },
        { category: OfficeType.ARCHITECTURAL_BARRIERS, count: 3 },
        { category: OfficeType.PUBLIC_LIGHTING, count: 8 },
        { category: OfficeType.WASTE, count: 12 },
        { category: OfficeType.ROAD_SIGNS_AND_TRAFFIC_LIGHTS, count: 6 },
        { category: OfficeType.ROADS_AND_URBAN_FURNISHINGS, count: 9 },
        { category: OfficeType.PUBLIC_GREEN_AREAS_AND_PLAYGROUNDS, count: 4 },
        { category: OfficeType.ORGANIZATION, count: 2 },
        { category: OfficeType.OTHER, count: 7 }
      ];

      (ReportRepository.prototype.getReportCountByCategory as jest.Mock).mockResolvedValue(mockStats);

      expect(await getReportCountByCategory(OfficeType.WATER_SUPPLY)).toBe(5);
      expect(await getReportCountByCategory(OfficeType.ARCHITECTURAL_BARRIERS)).toBe(3);
      expect(await getReportCountByCategory(OfficeType.PUBLIC_LIGHTING)).toBe(8);
      expect(await getReportCountByCategory(OfficeType.WASTE)).toBe(12);
      expect(await getReportCountByCategory(OfficeType.ROAD_SIGNS_AND_TRAFFIC_LIGHTS)).toBe(6);
      expect(await getReportCountByCategory(OfficeType.ROADS_AND_URBAN_FURNISHINGS)).toBe(9);
      expect(await getReportCountByCategory(OfficeType.PUBLIC_GREEN_AREAS_AND_PLAYGROUNDS)).toBe(4);
      expect(await getReportCountByCategory(OfficeType.ORGANIZATION)).toBe(2);
      expect(await getReportCountByCategory(OfficeType.OTHER)).toBe(7);
    });

    it("should handle repository errors", async () => {
      (ReportRepository.prototype.getReportCountByCategory as jest.Mock).mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(getReportCountByCategory(OfficeType.WATER_SUPPLY)).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  describe("getReportTrends", () => {
    it("should return trends for period 'day'", async () => {
      const mockTrends = [
        { period: "2026-01-05", count: 8 },
        { period: "2026-01-04", count: 12 },
        { period: "2026-01-03", count: 6 }
      ];

      (ReportRepository.prototype.getReportTrendsByPeriod as jest.Mock).mockResolvedValue(mockTrends);

      const result = await getReportTrends("day");

      expect(ReportRepository.prototype.getReportTrendsByPeriod).toHaveBeenCalledWith("day");
      expect(result).toEqual({
        period: "day",
        data: mockTrends
      });
    });

    it("should return trends for period 'week'", async () => {
      const mockTrends = [
        { period: "2026-01", count: 45 },
        { period: "2025-52", count: 38 }
      ];

      (ReportRepository.prototype.getReportTrendsByPeriod as jest.Mock).mockResolvedValue(mockTrends);

      const result = await getReportTrends("week");

      expect(ReportRepository.prototype.getReportTrendsByPeriod).toHaveBeenCalledWith("week");
      expect(result).toEqual({
        period: "week",
        data: mockTrends
      });
    });

    it("should return trends for period 'month'", async () => {
      const mockTrends = [
        { period: "2026-01", count: 180 },
        { period: "2025-12", count: 165 }
      ];

      (ReportRepository.prototype.getReportTrendsByPeriod as jest.Mock).mockResolvedValue(mockTrends);

      const result = await getReportTrends("month");

      expect(ReportRepository.prototype.getReportTrendsByPeriod).toHaveBeenCalledWith("month");
      expect(result).toEqual({
        period: "month",
        data: mockTrends
      });
    });

    it("should throw BadRequestError for invalid period", async () => {
      await expect(getReportTrends("invalid" as any)).rejects.toThrow(BadRequestError);
      await expect(getReportTrends("invalid" as any)).rejects.toThrow(
        "Invalid period. Must be one of: day, week, month"
      );
    });

    it("should throw BadRequestError for uppercase period", async () => {
      await expect(getReportTrends("DAY" as any)).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError for empty string period", async () => {
      await expect(getReportTrends("" as any)).rejects.toThrow(BadRequestError);
    });

    it("should handle empty trends data", async () => {
      (ReportRepository.prototype.getReportTrendsByPeriod as jest.Mock).mockResolvedValue([]);

      const result = await getReportTrends("day");

      expect(result.data).toEqual([]);
    });

    it("should handle repository errors", async () => {
      (ReportRepository.prototype.getReportTrendsByPeriod as jest.Mock).mockRejectedValue(
        new Error("Query timeout")
      );

      await expect(getReportTrends("day")).rejects.toThrow("Query timeout");
    });

    it("should handle network errors from repository", async () => {
      (ReportRepository.prototype.getReportTrendsByPeriod as jest.Mock).mockRejectedValue(
        new Error("Network error")
      );

      await expect(getReportTrends("week")).rejects.toThrow("Network error");
    });
  });
});
