//! STATISTICS CONTROLLER

import { ReportRepository } from "@repositories/ReportRepository";
import { OfficeType } from "@models/enums/OfficeType";
import { BadRequestError } from "@utils/utils";

/**
 * Get public statistics about reports
 * Returns count by category and trends by period
 */
export async function getPublicStatistics(selectedPeriod: 'day' | 'week' | 'month' = 'day') {
  const reportRepo = new ReportRepository();
  
  // Validate period parameter if provided
  const validPeriods = ['day', 'week', 'month'];
  
  if (!validPeriods.includes(selectedPeriod)) {
    throw new BadRequestError(`Invalid period. Must be one of: ${validPeriods.join(', ')}`);
  }

  // Get statistics
  const [reportsByCategory, reportsByState, reportTrends] = await Promise.all([
    reportRepo.getReportCountByCategory(),
    reportRepo.getReportCountByState(),
    reportRepo.getReportTrendsByPeriod(selectedPeriod)
  ]);

  return {
    byCategory: reportsByCategory,
    byState: reportsByState,
    trends: {
      period: selectedPeriod,
      data: reportTrends
    }
  };
}

/**
 * Get report count by specific category
 */
export async function getReportCountByCategory(category: OfficeType): Promise<number> {
  const reportRepo = new ReportRepository();
  const stats = await reportRepo.getReportCountByCategory();
  
  const categoryStats = stats.find(s => s.category === category);
  return categoryStats ? categoryStats.count : 0;
}

/**
 * Get trend statistics for a specific period
 */
export async function getReportTrends(period: 'day' | 'week' | 'month') {
  const reportRepo = new ReportRepository();
  
  const validPeriods = ['day', 'week', 'month'];
  if (!validPeriods.includes(period)) {
    throw new BadRequestError(`Invalid period. Must be one of: ${validPeriods.join(', ')}`);
  }

  const trends = await reportRepo.getReportTrendsByPeriod(period);
  
  return {
    period,
    data: trends
  };
}
