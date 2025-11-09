import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { ReportDAO } from "@dao/ReportDAO";
import { UserDAO } from "@dao/UserDAO";
import { OfficeType } from "@models/enums/OfficeType";
import { ReportState } from "@models/enums/ReportState";
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
      where: { state: ReportState.APPROVED },
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
        assignedOfficerId: officerId,
        state: ReportState.PENDING
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
    return this.repo.save({
      title,
      location,
      author,
      anonymity,
      category,
      document,
      state: ReportState.PENDING,
      date: new Date()
    });
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
    
    return this.repo.save(report);
  }
}
