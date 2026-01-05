import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { ReportDAO } from "@dao/ReportDAO";
import { UserDAO } from "@dao/UserDAO";
import { OfficeType } from "@models/enums/OfficeType";
import { ReportState } from "@models/enums/ReportState";
import { findOrThrowNotFound } from "@utils/utils";

export class ReportRepository {
  private readonly repo: Repository<ReportDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(ReportDAO);
  }

  async getAllReports(): Promise<ReportDAO[]> {
    return this.repo.find({ relations: ["author"] });
  }


  async getApprovedReports(): Promise<ReportDAO[]> {
    return this.repo.find({
      where: [

        { state: ReportState.ASSIGNED },
        { state: ReportState.IN_PROGRESS },
        { state: ReportState.SUSPENDED }
      ],
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

  async getReportsByUserId(userId: number): Promise<ReportDAO[]> {
    const baseWhereConditions = [
      { state: ReportState.ASSIGNED },
      { state: ReportState.IN_PROGRESS },
      { state: ReportState.SUSPENDED }
    ];
    const where = baseWhereConditions.map(condition => ({
      ...condition,
      author: { id: userId }
    }));
    return this.repo.find({
      where,
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

  /**
   * Unified statistics method for reports
   * @param groupBy - What to group by: 'category', 'state', or 'period'
   * @param period - Time period for trends (required if groupBy === 'period')
   * @param category - Optional category filter
   */
  async getReportStatistics(
    groupBy: 'category' | 'state' | 'period',
    period?: 'day' | 'week' | 'month',
    category?: OfficeType
  ): Promise<Array<{ [key: string]: any; count: number }>> {
    const query = this.repo.createQueryBuilder("report");
    
    // Determine SELECT and GROUP BY based on groupBy parameter
    if (groupBy === 'category') {
      query.select("report.category", "category");
      query.groupBy("report.category");
    } else if (groupBy === 'state') {
      query.select("report.state", "state");
      query.groupBy("report.state");
    } else if (groupBy === 'period' && period) {
      const dateFormat = {
        'day': "%Y-%m-%d",
        'week': "%Y-%W",
        'month': "%Y-%m"
      }[period];
      query.select(`strftime('${dateFormat}', report.date)`, "period");
      query.groupBy("period");
      query.orderBy("period", "DESC");
      query.limit(30); // Last 30 periods
    }
    
    query.addSelect("COUNT(*)", "count");
    
    // Apply WHERE filters
    if (groupBy !== 'state') {
      // For category and period stats, only include approved reports
      query.where("report.state IN (:...states)", {
        states: [ReportState.ASSIGNED, ReportState.IN_PROGRESS, ReportState.SUSPENDED]
      });
    }
    
    // Apply category filter if specified
    if (category) {
      if (groupBy === 'state') {
        query.where("report.category = :category", { category });
      } else {
        query.andWhere("report.category = :category", { category });
      }
    }
    
    const result = await query.getRawMany();
    
    return result.map(r => ({
      ...r,
      count: Number.parseInt(r.count, 10)
    }));
  }

  async getReportsByAuthorId(authorId: number): Promise<ReportDAO[]> {
    return this.repo.find({
      where: { author: { id: authorId } },
      relations: ["author"],
      order: {
        date: "DESC" // Most recent first
      }
    });
  }
}
