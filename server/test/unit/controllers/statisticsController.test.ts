import { getStatistics } from '../../../src/controllers/statisticsController';
import { ReportRepository } from '../../../src/repositories/ReportRepository';
import { OfficeType } from '../../../src/models/enums/OfficeType';
import { BadRequestError } from '../../../src/utils/utils';

// Mock the repository
jest.mock('../../../src/repositories/ReportRepository');

describe('Statistics Controller - Unit Tests', () => {
  let mockReportRepo: jest.Mocked<ReportRepository>;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Create mock instance
    mockReportRepo = {
      getReportStatistics: jest.fn()
    } as any;
    
    // Mock the constructor to return our mock instance
    (ReportRepository as jest.Mock).mockImplementation(() => mockReportRepo);
  });

  describe('getStatistics - No filters', () => {
    it('should return all statistics when no parameters provided', async () => {
      const mockCategoryStats = [
        { category: OfficeType.WASTE, count: 10 },
        { category: OfficeType.PUBLIC_LIGHTING, count: 5 }
      ];
      const mockStateStats = [
        { state: 'PENDING', count: 3 },
        { state: 'ASSIGNED', count: 12 }
      ];

      mockReportRepo.getReportStatistics
        .mockResolvedValueOnce(mockCategoryStats)
        .mockResolvedValueOnce(mockStateStats);

      const result = await getStatistics();

      expect(mockReportRepo.getReportStatistics).toHaveBeenCalledTimes(2);
      expect(mockReportRepo.getReportStatistics).toHaveBeenCalledWith('category', undefined, undefined);
      expect(mockReportRepo.getReportStatistics).toHaveBeenCalledWith('state');
      
      expect('byCategory' in result).toBe(true);
      expect('byState' in result).toBe(true);
      expect((result as any).byCategory).toEqual(mockCategoryStats);
      expect((result as any).byState).toEqual(mockStateStats);
    });
  });

  describe('getStatistics - Period filter only', () => {
    it('should return category stats and trends when only period is provided', async () => {
      const mockCategoryStats = [
        { category: OfficeType.WASTE, count: 10 }
      ];
      const mockTrends = [
        { period: '2026-01', count: 15 },
        { period: '2025-12', count: 20 }
      ];

      mockReportRepo.getReportStatistics
        .mockResolvedValueOnce(mockCategoryStats)
        .mockResolvedValueOnce(mockTrends);

      const result = await getStatistics('month');

      expect(mockReportRepo.getReportStatistics).toHaveBeenCalledTimes(2);
      expect(mockReportRepo.getReportStatistics).toHaveBeenCalledWith('category', undefined, undefined);
      expect(mockReportRepo.getReportStatistics).toHaveBeenCalledWith('period', 'month', undefined);
      
      expect('byCategory' in result).toBe(true);
      expect((result as any).byCategory).toEqual(mockCategoryStats);
      expect(result.trends).toBeDefined();
      expect(result.trends?.period).toBe('month');
      expect(result.trends?.data).toEqual(mockTrends);
    });

    it('should work with day period', async () => {
      const mockCategoryStats = [{ category: OfficeType.WASTE, count: 5 }];
      const mockTrends = [{ period: '2026-01-05', count: 5 }];

      mockReportRepo.getReportStatistics
        .mockResolvedValueOnce(mockCategoryStats)
        .mockResolvedValueOnce(mockTrends);

      const result = await getStatistics('day');

      expect(mockReportRepo.getReportStatistics).toHaveBeenCalledWith('period', 'day', undefined);
      expect(result.trends).toBeDefined();
      expect(result.trends?.period).toBe('day');
    });

    it('should work with week period', async () => {
      const mockCategoryStats = [{ category: OfficeType.WASTE, count: 5 }];
      const mockTrends = [{ period: '2026-01', count: 5 }];

      mockReportRepo.getReportStatistics
        .mockResolvedValueOnce(mockCategoryStats)
        .mockResolvedValueOnce(mockTrends);

      const result = await getStatistics('week');

      expect(mockReportRepo.getReportStatistics).toHaveBeenCalledWith('period', 'week', undefined);
      expect(result.trends).toBeDefined();
      expect(result.trends?.period).toBe('week');
    });
  });

  describe('getStatistics - Category filter only', () => {
    it('should return count for specific category when only category is provided', async () => {
      const mockCategoryStats = [
        { category: OfficeType.WASTE, count: 25 }
      ];

      mockReportRepo.getReportStatistics.mockResolvedValueOnce(mockCategoryStats);

      const result = await getStatistics(undefined, OfficeType.WASTE);

      expect(mockReportRepo.getReportStatistics).toHaveBeenCalledTimes(1);
      expect(mockReportRepo.getReportStatistics).toHaveBeenCalledWith('category', undefined, OfficeType.WASTE);
      
      expect('category' in result).toBe(true);
      expect('count' in result).toBe(true);
      expect((result as any).category).toBe(OfficeType.WASTE);
      expect((result as any).count).toBe(25);
    });

    it('should return 0 when category has no reports', async () => {
      mockReportRepo.getReportStatistics.mockResolvedValueOnce([]);

      const result = await getStatistics(undefined, OfficeType.WATER_SUPPLY);

      expect('category' in result).toBe(true);
      expect('count' in result).toBe(true);
      expect((result as any).category).toBe(OfficeType.WATER_SUPPLY);
      expect((result as any).count).toBe(0);
    });

    it('should work with different category types', async () => {
      const categories = [
        OfficeType.WATER_SUPPLY,
        OfficeType.PUBLIC_LIGHTING,
        OfficeType.ROADS_AND_URBAN_FURNISHINGS,
        OfficeType.OTHER
      ];

      for (const category of categories) {
        mockReportRepo.getReportStatistics.mockResolvedValueOnce([
          { category, count: 10 }
        ]);

        const result = await getStatistics(undefined, category);

        expect('category' in result).toBe(true);
        expect('count' in result).toBe(true);
        expect((result as any).category).toBe(category);
        expect((result as any).count).toBe(10);
      }
    });
  });

  describe('getStatistics - Both period and category filters', () => {
    it('should return filtered count and trends when both parameters provided', async () => {
      const mockCategoryStats = [
        { category: OfficeType.WASTE, count: 15 }
      ];
      const mockTrends = [
        { period: '2026-01', count: 10 },
        { period: '2025-12', count: 5 }
      ];

      mockReportRepo.getReportStatistics
        .mockResolvedValueOnce(mockCategoryStats)
        .mockResolvedValueOnce(mockTrends);

      const result = await getStatistics('month', OfficeType.WASTE);

      expect(mockReportRepo.getReportStatistics).toHaveBeenCalledTimes(2);
      expect(mockReportRepo.getReportStatistics).toHaveBeenCalledWith('category', undefined, OfficeType.WASTE);
      expect(mockReportRepo.getReportStatistics).toHaveBeenCalledWith('period', 'month', OfficeType.WASTE);
      
      expect('category' in result).toBe(true);
      expect('count' in result).toBe(true);
      expect((result as any).category).toBe(OfficeType.WASTE);
      expect((result as any).count).toBe(15);
      expect(result.trends).toBeDefined();
      expect(result.trends?.period).toBe('month');
      expect(result.trends?.data).toEqual(mockTrends);
    });

    it('should handle all period types with category filter', async () => {
      const periods: ('day' | 'week' | 'month')[] = ['day', 'week', 'month'];

      for (const period of periods) {
        mockReportRepo.getReportStatistics
          .mockResolvedValueOnce([{ category: OfficeType.WASTE, count: 5 }])
          .mockResolvedValueOnce([{ period: '2026-01', count: 5 }]);

        const result = await getStatistics(period, OfficeType.WASTE);

        expect(result.trends).toBeDefined();
        expect(result.trends?.period).toBe(period);
        expect('category' in result).toBe(true);
        expect((result as any).category).toBe(OfficeType.WASTE);
      }
    });
  });

  describe('getStatistics - Input validation', () => {
    it('should throw BadRequestError for invalid period', async () => {
      await expect(getStatistics('invalid' as any)).rejects.toThrow(BadRequestError);
      await expect(getStatistics('invalid' as any)).rejects.toThrow('Invalid period. Must be one of: day, week, month');
    });

    it('should throw BadRequestError for invalid category', async () => {
      await expect(getStatistics(undefined, 'invalid_category' as any)).rejects.toThrow(BadRequestError);
      await expect(getStatistics(undefined, 'invalid_category' as any)).rejects.toThrow('Invalid category');
    });

    it('should validate period even with valid category', async () => {
      await expect(getStatistics('year' as any, OfficeType.WASTE)).rejects.toThrow(BadRequestError);
    });

    it('should validate category even with valid period', async () => {
      await expect(getStatistics('month', 'not_a_category' as any)).rejects.toThrow(BadRequestError);
    });
  });

  describe('getStatistics - Parallel execution', () => {
    it('should execute repository calls in parallel when multiple queries needed', async () => {
      const mockCategoryStats = [{ category: OfficeType.WASTE, count: 10 }];
      const mockTrends = [{ period: '2026-01', count: 10 }];

      // Track when each call is made
      const callOrder: string[] = [];
      
      mockReportRepo.getReportStatistics.mockImplementation(async (groupBy) => {
        callOrder.push(`start-${groupBy}`);
        await new Promise(resolve => setTimeout(resolve, 10));
        callOrder.push(`end-${groupBy}`);
        return groupBy === 'category' ? mockCategoryStats : mockTrends;
      });

      await getStatistics('month');

      // Both should start before either ends (parallel execution)
      expect(callOrder[0]).toBe('start-category');
      expect(callOrder[1]).toBe('start-period');
    });
  });

  describe('getStatistics - Edge cases', () => {
    it('should handle empty category stats gracefully', async () => {
      mockReportRepo.getReportStatistics
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ state: 'PENDING', count: 5 }]);

      const result = await getStatistics();

      expect('byCategory' in result).toBe(true);
      expect((result as any).byCategory).toEqual([]);
      expect('byState' in result).toBe(true);
      expect((result as any).byState).toBeDefined();
    });

    it('should handle empty trends gracefully', async () => {
      mockReportRepo.getReportStatistics
        .mockResolvedValueOnce([{ category: OfficeType.WASTE, count: 5 }])
        .mockResolvedValueOnce([]);

      const result = await getStatistics('month');

      expect(result.trends).toBeDefined();
      expect(result.trends?.data).toEqual([]);
    });

    it('should handle category with undefined count', async () => {
      mockReportRepo.getReportStatistics.mockResolvedValueOnce([
        { category: OfficeType.WASTE }
      ] as any);

      const result = await getStatistics(undefined, OfficeType.WASTE);

      expect('count' in result).toBe(true);
      expect((result as any).count).toBe(0);
    });
  });

  describe('getStatistics - Repository instantiation', () => {
    it('should create a new ReportRepository instance', async () => {
      mockReportRepo.getReportStatistics
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await getStatistics();

      expect(ReportRepository).toHaveBeenCalledTimes(1);
    });
  });
});
