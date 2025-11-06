import { Injectable } from '@nestjs/common';
import { ReportsApi } from '../api/ReportsApi';
import { Report } from '../models';

@Injectable()
export class ReportsApiImpl extends ReportsApi {
  
  async getReports(request: Request): Promise<Array<Report>> {
    throw new Error('Method not implemented');
  }

  async uploadReport(report: Report, request: Request): Promise<Report> {
    throw new Error('Method not implemented');
  }
}