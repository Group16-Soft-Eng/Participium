import { Body, Controller, Get, Post, Param, Query, Req } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ReportsApi } from '../api';
import { Report,  } from '../models';

@Controller()
export class ReportsApiController {
  constructor(private readonly reportsApi: ReportsApi) {}

  @Get('/Reports')
  getReports(@Req() request: Request): Array<Report> | Promise<Array<Report>> | Observable<Array<Report>> {
    return this.reportsApi.getReports(request);
  }

  @Post('/Reports')
  uploadReport(@Body() report: Report, @Req() request: Request): Report | Promise<Report> | Observable<Report> {
    return this.reportsApi.uploadReport(report, request);
  }

} 