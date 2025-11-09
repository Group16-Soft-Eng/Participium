//! OFFICER CONTROLLER

import { Officer } from "@dto/Officer";
import { Report } from "@dto/Report";
import { OfficerRepository } from "@repositories/OfficerRepository";
import { ReportRepository } from "@repositories/ReportRepository";
import { mapOfficerDAOToDTO, mapReportDAOToDTO } from "@services/mapperService";
import { ReportState } from "@models/enums/ReportState";


export async function getAllOfficers(): Promise<Officer[]> {
  const officerRepo = new OfficerRepository();
  const officers = await officerRepo.getAllOfficers();
  return officers.map(mapOfficerDAOToDTO);
}

export async function getOfficer(email: string): Promise<Officer> {
  const officerRepo = new OfficerRepository();
  const officer = await officerRepo.getOfficerByEmail(email);
  return mapOfficerDAOToDTO(officer);
}


export async function createOfficer(officerDto: Officer): Promise<Officer> {
  const officerRepo = new OfficerRepository();
  const createdOfficer = await officerRepo.createOfficer(
    officerDto.name!,
    officerDto.surname!,
    officerDto.email!,
    officerDto.password!, // come per user, plain password qui, poi hashed
    officerDto.role as any,
    officerDto.office as any
  );
  return mapOfficerDAOToDTO(createdOfficer);
}


export async function updateOfficer(officerDto: Officer): Promise<Officer> {
  const officerRepo = new OfficerRepository();
  const updatedOfficer = await officerRepo.updateOfficer(
    officerDto.id!,
    officerDto.name!,
    officerDto.surname!,
    officerDto.email!,
    officerDto.role as any,
    officerDto.office as any
  );
  return mapOfficerDAOToDTO(updatedOfficer);
}



export async function retrieveDocs(officerId: number): Promise<Report[]> {
  const officerRepo = new OfficerRepository();
  const reportRepo = new ReportRepository();

  // qui ottengo l'Officer mediante il suo ID passato come param
  const officer = await officerRepo.getOfficerById(officerId);
  // qui prendo i reports relativi all'ufficio dell'Officer
  const reports = await reportRepo.getReportsByCategory(officer.office);

  return reports.map(mapReportDAOToDTO);
}


export async function reviewDoc(idDoc: number, state: ReportState, reason?: string): Promise<Report> {
  const reportRepo = new ReportRepository();
  const updatedReport = await reportRepo.updateReportState(idDoc, state, reason);
  return mapReportDAOToDTO(updatedReport);
}

export async function deleteOfficer(email: string): Promise<void> {
  const officerRepo = new OfficerRepository();
  await officerRepo.deleteOfficer(email);
}
