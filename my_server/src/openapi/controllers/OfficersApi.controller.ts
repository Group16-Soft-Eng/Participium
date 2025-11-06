import { Body, Controller, Get, Patch, Post, Param, Query, Req } from '@nestjs/common';
import { Observable } from 'rxjs';
import { OfficersApi } from '../api';
import { Officer, Report,  } from '../models';

@Controller()
export class OfficersApiController {
  constructor(private readonly officersApi: OfficersApi) {}

  @Post('/officers')
  createOfficer(@Body() officer: Officer, @Req() request: Request): Officer | Promise<Officer> | Observable<Officer> {
    return this.officersApi.createOfficer(officer, request);
  }

  @Get('/officers/retrievedocs')
  retrieveDocs(@Req() request: Request): Report | Promise<Report> | Observable<Report> {
    return this.officersApi.retrieveDocs(request);
  }

  @Patch('/officers/reviewdocs/:id_doc')
  reviewDoc(@Param('idDoc') idDoc: number, @Req() request: Request): Report | Promise<Report> | Observable<Report> {
    return this.officersApi.reviewDoc(idDoc, request);
  }

} 