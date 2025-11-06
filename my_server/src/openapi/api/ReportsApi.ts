import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Report,  } from '../models';


@Injectable()
export abstract class ReportsApi {

  abstract getReports( request: Request): Array<Report> | Promise<Array<Report>> | Observable<Array<Report>>;


  abstract uploadReport(report: Report,  request: Request): Report | Promise<Report> | Observable<Report>;

} 