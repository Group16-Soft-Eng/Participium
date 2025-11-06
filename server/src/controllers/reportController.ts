//! REPORT CONTROLLER

import { Report } from "@dto/Report";
import { ReportRepository } from "@repositories/ReportRepository";
import { UserRepository } from "@repositories/UserRepository";
import { mapReportDAOToDTO } from "@services/mapperService";
import { OfficeType } from "@models/enums/OfficeType";

//? qui prendo gli solo gli Approved Reports (probabilmente ci servirà per la mappa pubblica in PT07)
export async function getReports(): Promise<Report[]> {
  const reportRepo = new ReportRepository();
  const reports = await reportRepo.getApprovedReports();
  return reports.map(mapReportDAOToDTO);
}


export async function getReport(id: number): Promise<Report> {
  const reportRepo = new ReportRepository();
  const report = await reportRepo.getReportById(id);
  return mapReportDAOToDTO(report);
}


export async function uploadReport(reportDto: Report, userId?: number): Promise<Report> {
  const reportRepo = new ReportRepository();
  const userRepo = new UserRepository();
  
  // get author if not anonymous
  let author = null;
  if (!reportDto.anonymity && userId) {
    author = await userRepo.getUserById(userId);
  }
  
  //? validate photos count (questa probabilmente ci servirà più avanti per PT05)
  const photosCount = reportDto.document?.photos?.length || 0;
  if (photosCount < 1 || photosCount > 3) {
    throw new Error("Report must have between 1 and 3 photos");
  }
  
  const createdReport = await reportRepo.createReport(
    reportDto.title!,
    reportDto.location!,
    author,
    reportDto.anonymity || false,
    reportDto.category as any as OfficeType,
    {
      Description: reportDto.document?.description,
      Photos: reportDto.document?.photos
    }
  );
  
  return mapReportDAOToDTO(createdReport);
}


export async function deleteReport(id: number): Promise<void> {
  const reportRepo = new ReportRepository();
  await reportRepo.deleteReport(id);
}
