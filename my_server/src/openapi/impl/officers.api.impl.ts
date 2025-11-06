import { Injectable } from '@nestjs/common';
import { OfficersApi } from '../api/OfficersApi';
import { Officer, Report } from '../models';

@Injectable()
export class OfficersApiImpl extends OfficersApi {
  
  async createOfficer(officer: Officer, request: Request): Promise<Officer> {
    throw new Error('Method not implemented');
  }

  async retrieveDocs(request: Request): Promise<Report> {
    throw new Error('Method not implemented');
  }

  async reviewDoc(idDoc: number, request: Request): Promise<Report> {
    throw new Error('Method not implemented');
  }
}