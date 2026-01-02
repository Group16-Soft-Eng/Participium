import { Router } from "express";
import { 
  getPublicStatistics, 
  getReportCountByCategory, 
  getReportTrends 
} from "@controllers/statisticsController";
import { OfficeType } from "@models/enums/OfficeType";
import { BadRequestError } from "@utils/utils";

const router = Router({ mergeParams: true });

/**
 * GET /statistics/public
 * Get public statistics about reports (no authentication required)
 * Query params:
 *   - period: 'day' | 'week' | 'month' (default: 'day')
 */
router.get("/public", async (req, res, next) => {
  try {
    const period = req.query.period as 'day' | 'week' | 'month' | undefined;
    const statistics = await getPublicStatistics(period);
    res.status(200).json(statistics);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /statistics/category/:category
 * Get report count for a specific category (no authentication required)
 * Params:
 *   - category: Office type category
 */
router.get("/category/:category", async (req, res, next) => {
  try {
    const category = req.params.category as OfficeType;
    
    // Validate category
    if (!Object.values(OfficeType).includes(category)) {
      throw new BadRequestError(`Invalid category. Must be one of: ${Object.values(OfficeType).join(', ')}`);
    }
    
    const count = await getReportCountByCategory(category);
    res.status(200).json({ category, count });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /statistics/trends/:period
 * Get report trends for a specific period (no authentication required)
 * Params:
 *   - period: 'day' | 'week' | 'month'
 */
router.get("/trends/:period", async (req, res, next) => {
  try {
    const period = req.params.period as 'day' | 'week' | 'month';
    const trends = await getReportTrends(period);
    res.status(200).json(trends);
  } catch (error) {
    next(error);
  }
});

export const statisticsRouter = router;
