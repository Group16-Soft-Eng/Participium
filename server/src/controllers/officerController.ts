//! OFFICER CONTROLLER

import { Officer } from "@dto/Officer";
import { Report } from "@dto/Report";
import { OfficerRepository } from "@repositories/OfficerRepository";
import { ReportRepository } from "@repositories/ReportRepository";
import { mapOfficerDAOToDTO, mapReportDAOToDTO } from "@services/mapperService";
import { ReportState } from "@models/enums/ReportState";
import { NotificationRepository } from "@repositories/NotificationRepository";
import { OfficerRole } from "@models/enums/OfficerRole";

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
    officerDto.username!,
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
    officerDto.username!,
    officerDto.name!,
    officerDto.surname!,
    officerDto.email!,
    officerDto.role as any,
    officerDto.office as any
  );
  return mapOfficerDAOToDTO(updatedOfficer);
}



export async function assignReportToOfficer(reportId: number, officerId: number): Promise<void> {
  const reportRepo = new ReportRepository();
  const officerRepo = new OfficerRepository();
  
  // Verifica che il report sia in stato PENDING
  const report = await reportRepo.getReportById(reportId);
  if (report.state !== ReportState.PENDING) {
    throw new Error("Only PENDING reports can be assigned");
  }
  
  // Verifica che l'officer esista
  const officer = await officerRepo.getOfficerById(officerId);
  if (!officer) {
    throw new Error("Officer not found");
  }
  
  // Assegna il report all'officer
  await reportRepo.assignReportToOfficer(reportId, officerId);
}

export async function retrieveDocs(officerId: number): Promise<Report[]> {
  const reportRepo = new ReportRepository();
  
  // Get all PENDING reports that need review (not yet assigned or assigned to this officer)
  const allPending = await reportRepo.getReportsByState(ReportState.PENDING);
  // filter: only unassigned or assigned to this officer
  const reports = allPending.filter(r => r.assignedOfficerId === null || r.assignedOfficerId === officerId);
  
  return reports.map(mapReportDAOToDTO);
}


export async function getAssignedReports(officerId: number): Promise<Report[]> {
  const reportRepo = new ReportRepository();
  const reports = await reportRepo.getReportsByAssignedOfficer(officerId);
  return reports.map(mapReportDAOToDTO);
}

//? added for story 8 (officer can see all assigned reports, also the non-pending ones)
export async function getAllAssignedReportsOfficer(officerId: number): Promise<Report[]> {
  const reportRepo = new ReportRepository();
  const reports = await reportRepo.getReportsByAssignedOfficer(officerId);
  return reports.map(mapReportDAOToDTO);
}


export async function reviewDoc(officerId: number, idDoc: number, state: ReportState, reason?: string): Promise<Report> {
  const reportRepo = new ReportRepository();
  const officerRepo = new OfficerRepository();
  const notificationRepo = new NotificationRepository();
  
  // Get the report
  const report = await reportRepo.getReportById(idDoc);
  
  // Only check assignment if the report is already assigned
  // PENDING reports that are not assigned can be reviewed by any officer
  if (report.assignedOfficerId !== null && report.assignedOfficerId !== officerId) {
    throw new Error("You can only review reports assigned to you");
  }
  
  // update report state
  let updatedReport = await reportRepo.updateReportState(idDoc, state, reason);
  
  // if approved, assign to an officer
  if (state === ReportState.APPROVED) {
    // find officers in the correct office (based on the report's category)
    const officers = await officerRepo.getOfficersByOffice(report.category as any);

    if (officers.length > 0) {
      // Prefer an officer with the TECHNICAL_OFFICE_STAFF role for assignment
      const preferred = officers.find(o => o.role === OfficerRole.TECHNICAL_OFFICE_STAFF) || officers[0];
      updatedReport = await reportRepo.assignReportToOfficer(idDoc, preferred.id);
    }
  }

  //? PT-11 (viene aggiunta la notifica allo user quando lo stato del report cambia)
  await notificationRepo.createStatusChangeNotification(updatedReport as any);
  
  return mapReportDAOToDTO(updatedReport);
}

export async function deleteOfficer(email: string): Promise<void> {
  const officerRepo = new OfficerRepository();
  await officerRepo.deleteOfficer(email);
}
