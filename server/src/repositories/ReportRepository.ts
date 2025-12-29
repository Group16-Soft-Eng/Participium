import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { ReportDAO } from "@dao/ReportDAO";
import { UserDAO } from "@dao/UserDAO";
import { OfficeType } from "@models/enums/OfficeType";
import { ReportState } from "@models/enums/ReportState";
import { ReviewStatus } from "@models/enums/ReviewStatus";
import { findOrThrowNotFound } from "@utils/utils";

export class ReportRepository {
  private repo: Repository<ReportDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(ReportDAO);
  }

  async getAllReports(): Promise<ReportDAO[]> {
    return this.repo.find({ relations: ["author"] });
  }


  async getApprovedReports(): Promise<ReportDAO[]> {
    return this.repo.find({
      where: {
        reviewStatus: ReviewStatus.APPROVED
      },
      relations: ["author"],
      order: {
        date: "DESC" // Most recent first
      }
    });
  }

  async getReportsByState(state: ReportState): Promise<ReportDAO[]> {
    return this.repo.find({
      where: { state },
      relations: ["author"]
    });
  }

  async getReportById(id: number): Promise<ReportDAO> {
    return findOrThrowNotFound(
      await this.repo.find({ where: { id }, relations: ["author"] }),
      () => true,
      `Report with id '${id}' not found`
    );
  }

  async getReportsByCategory(category: OfficeType): Promise<ReportDAO[]> {
    return this.repo.find({
      where: { category },
      relations: ["author"]
    });
  }

  async getReportsByAssignedOfficer(officerId: number): Promise<ReportDAO[]> {
    return this.repo.find({
      where: { 
        assignedOfficerId: officerId
      },
      relations: ["author"]
    });
  }
  async getReportsByMaintainerId(maintainerId: number): Promise<ReportDAO[]> {
    return this.repo.find({
      where: { 
        assignedMaintainerId: maintainerId
      },
      relations: ["author"]
    });
  }


  async createReport(
    title: string,
    location: {
      id?: number;
      name?: string;
      Coordinates?: { longitude: number; latitude: number };
    },
    author: UserDAO | null,
    anonymity: boolean,
    category: OfficeType,
    document: {
      Description?: string;
      Photos?: string[];
    }
  ): Promise<ReportDAO> {
    // Ensure category is not null (DB constraint). Default to OTHER when missing.
    const safeCategory = category || (OfficeType as any).OTHER || 'other';
    return this.repo.save({
      title,
      location,
      author,
      anonymity,
      category: safeCategory,
      document,
      state: ReportState.PENDING,
      date: new Date()
    });
  }


  async resetReportsAssignmentByOfficer(officerId: number): Promise<void> {
    const reports = await this.getReportsByAssignedOfficer(officerId);
    for (const report of reports) {
      if (report.state === ReportState.ASSIGNED || report.state === ReportState.IN_PROGRESS || report.state === ReportState.SUSPENDED) {
        report.state = ReportState.PENDING
        report.assignedOfficerId = null;
        report.assignedMaintainerId = null;
        await this.repo.save(report);
      }
    }
  }
  async resetPartialReportsAssignmentByOfficer(officerId: number, office: OfficeType): Promise<void> {
    if (office == null) return;
    await this.repo
      .createQueryBuilder()
      .update(ReportDAO)
      .set({ state: ReportState.PENDING, assignedOfficerId: () => 'NULL', assignedMaintainerId: () => 'NULL' })
      .where('assignedOfficerId = :officerId', { officerId })
      .andWhere('category = :office', { office })
      .andWhere('state IN (:...states)', { states: [ReportState.ASSIGNED, ReportState.IN_PROGRESS, ReportState.SUSPENDED] })
      .execute();
  }

  async resetReportsAssignmentByMaintainer(maintainerId: number): Promise<void> {
    const reports = await this.getReportsByMaintainerId(maintainerId);
    for (const report of reports) {
      if (report.state === ReportState.ASSIGNED || report.state === ReportState.IN_PROGRESS) {
        report.state = ReportState.PENDING;
        report.assignedMaintainerId = null;
        await this.repo.save(report);
      }
    }
  }

  async updateReportState(
    id: number,
    state: ReportState,
    reason?: string
  ): Promise<ReportDAO> {
    const report = await this.getReportById(id);
    
    report.state = state;
    if (state === ReportState.DECLINED && reason) {
      report.reason = reason;
    }

    return this.repo.save(report);
  }

  async deleteReport(id: number): Promise<void> {
    const report = await this.getReportById(id);
    await this.repo.remove(report);
  }

  async assignReportToOfficer(reportId: number, officerId: number): Promise<ReportDAO> {
    const report = await this.getReportById(reportId);
    report.assignedOfficerId = officerId;
    report.state = ReportState.ASSIGNED;
    return this.repo.save(report);
  }

  async assignReportToMaintainer(reportId: number, maintainerId: number): Promise<ReportDAO> {
    const report = await this.getReportById(reportId);
    report.assignedMaintainerId = maintainerId;
    report.state = ReportState.ASSIGNED;
    return this.repo.save(report);
  }

  async updateReport(report: ReportDAO): Promise<ReportDAO> {
    return this.repo.save(report);
  }

  async getPublicStatistics(): Promise<{
    totalReports: number;
    byCategory: { category: string; count: number }[];
    byState: { state: string; count: number }[];
    dailyTrend: { date: string; count: number }[];
    weeklyTrend: { week: string; count: number }[];
    monthlyTrend: { month: string; count: number }[];
  }> {
    const allReports = await this.getAllReports();

    // Total reports
    const totalReports = allReports.length;

    // By category
    const categoryMap = new Map<string, number>();
    allReports.forEach(report => {
      const category = report.category || 'other';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    const byCategory = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count
    }));

    // By state
    const stateMap = new Map<string, number>();
    allReports.forEach(report => {
      const state = report.state || 'PENDING';
      stateMap.set(state, (stateMap.get(state) || 0) + 1);
    });
    const byState = Array.from(stateMap.entries()).map(([state, count]) => ({
      state,
      count
    }));

    // Daily trend (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dailyMap = new Map<string, number>();

    allReports
      .filter(report => new Date(report.date) >= thirtyDaysAgo)
      .forEach(report => {
        const dateStr = new Date(report.date).toISOString().split('T')[0];
        dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);
      });

    const dailyTrend = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Weekly trend (last 12 weeks)
    const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
    const weeklyMap = new Map<string, number>();

    allReports
      .filter(report => new Date(report.date) >= twelveWeeksAgo)
      .forEach(report => {
        const date = new Date(report.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekStr = weekStart.toISOString().split('T')[0];
        weeklyMap.set(weekStr, (weeklyMap.get(weekStr) || 0) + 1);
      });

    const weeklyTrend = Array.from(weeklyMap.entries())
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week));

    // Monthly trend (last 12 months)
    const twelveMonthsAgo = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
    const monthlyMap = new Map<string, number>();

    allReports
      .filter(report => new Date(report.date) >= twelveMonthsAgo)
      .forEach(report => {
        const date = new Date(report.date);
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(monthStr, (monthlyMap.get(monthStr) || 0) + 1);
      });

    const monthlyTrend = Array.from(monthlyMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalReports,
      byCategory,
      byState,
      dailyTrend,
      weeklyTrend,
      monthlyTrend
    };
  }
}
