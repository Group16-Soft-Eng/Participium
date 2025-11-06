import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Officer, Report,  } from '../models';


@Injectable()
export abstract class OfficersApi {

  abstract createOfficer(officer: Officer,  request: Request): Officer | Promise<Officer> | Observable<Officer>;


  abstract retrieveDocs( request: Request): Report | Promise<Report> | Observable<Report>;


  abstract reviewDoc(idDoc: number,  request: Request): Report | Promise<Report> | Observable<Report>;

} 