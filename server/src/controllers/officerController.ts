//! OFFICER CONTROLLER

import { Officer } from "@dto/Officer";
import { Report } from "@dto/Report";
import { OfficerRepository } from "@repositories/OfficerRepository";
import { ReportRepository } from "@repositories/ReportRepository";
import { mapOfficerDAOToDTO, mapReportDAOToDTO } from "@services/mapperService";
import { ReportState } from "@models/enums/ReportState";
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
  // use == null to match both null and undefined values in tests/mocks
  const reports = allPending.filter(r => r.assignedOfficerId == null || r.assignedOfficerId === officerId);
  
  return reports.map(mapReportDAOToDTO);
}


export async function getAssignedReports(officerId: number): Promise<Report[]> {
  const reportRepo = new ReportRepository();
  const reports = await reportRepo.getReportsByAssignedOfficer(officerId);
  return reports.map(mapReportDAOToDTO);
}


export async function reviewDoc(officerId: number, idDoc: number, state: ReportState, reason?: string): Promise<Report> {
  const reportRepo = new ReportRepository();
  const officerRepo = new OfficerRepository();
  
  // Get the report
  const report = await reportRepo.getReportById(idDoc);
  
  // Only check assignment if the report is already assigned
  // PENDING reports that are not assigned can be reviewed by any officer
  // Debug: show assignment check values to help tests understand failures
  console.log('[reviewDoc] report.assignedOfficerId=', report.assignedOfficerId, 'officerId=', officerId);
  if (report.assignedOfficerId != null && report.assignedOfficerId != officerId) {
    throw new Error("You can only review reports assigned to you");
  }
  
  // update report state
  let updatedReport = await reportRepo.updateReportState(idDoc, state, reason);
  
  // if approved, assign to an officer
  // Debug: log incoming state vs ReportState.APPROVED
  console.log('[reviewDoc] incoming state=', state, 'APPROVED=', ReportState.APPROVED);
  if (String(state) === String(ReportState.APPROVED)) {
    // find officers in the correct office (based on the report's category)
    console.log('[reviewDoc] fetching officers for category=', report.category);
    const officers = await officerRepo.getOfficersByOffice(report.category as any);
    console.log('[reviewDoc] officers found=', officers && officers.length);

    if (officers.length > 0) {
      // Prefer an officer with the TECHNICAL_OFFICE_STAFF role for assignment
      const preferred = officers.find(o => o.role === OfficerRole.TECHNICAL_OFFICE_STAFF) || officers[0];
      console.log('[reviewDoc] assigning to preferred officer id=', preferred.id);
      updatedReport = await reportRepo.assignReportToOfficer(idDoc, preferred.id);
      console.log('[reviewDoc] updatedReport after assign=', updatedReport);
    }
  }
  
  const dto = mapReportDAOToDTO(updatedReport);
  // Ensure assignedOfficerId is present in the DTO (defensive)
  (dto as any).assignedOfficerId = (updatedReport as any).assignedOfficerId ?? undefined;
  return dto;
}

export async function deleteOfficer(email: string): Promise<void> {
  const officerRepo = new OfficerRepository();
  await officerRepo.deleteOfficer(email);
}

// Explicit named exports for tools that may inspect module exports
// Functions are exported via their `export` declarations above.
