//! STATISTICS CONTROLLER

import { ReportRepository } from "@repositories/ReportRepository";
import { OfficeType } from "@models/enums/OfficeType";
import { BadRequestError } from "@utils/utils";

/**
 * Get comprehensive statistics about reports
 * Supports optional filtering by period and/or category
 * @param period - Optional time period for trends ('day' | 'week' | 'month')
 * @param category - Optional category filter (OfficeType)
 */
export async function getStatistics(
  period?: 'day' | 'week' | 'month',
  category?: OfficeType
) {
  const reportRepo = new ReportRepository();
  
  // Validate inputs
  if (period && !['day', 'week', 'month'].includes(period)) {
    throw new BadRequestError("Invalid period. Must be one of: day, week, month");
  }
  
  if (category && !Object.values(OfficeType).includes(category)) {
    throw new BadRequestError(`Invalid category. Must be one of: ${Object.values(OfficeType).join(', ')}`);
  }

  // Build queries in parallel using unified method
  const queries: Promise<any>[] = [
    reportRepo.getReportStatistics('category', undefined, category)
  ];
  
  if (period) {
    queries.push(reportRepo.getReportStatistics('period', period, category));
  }
  
  if (!period && !category) {
    queries.push(reportRepo.getReportStatistics('state'));
  }

  const [categoryStats, ...rest] = await Promise.all(queries);
  
  // Build result based on what we have
  return {
    ...(category 
      ? { category, count: categoryStats[0]?.count || 0 }
      : { byCategory: categoryStats }
    ),
    ...(period && rest[0] 
      ? { trends: { period, data: rest[0] } }
      : {}
    ),
    ...(!period && !category && rest[0]
      ? { byState: rest[0] }
      : {}
    )
  };
}
