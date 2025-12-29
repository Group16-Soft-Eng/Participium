//! REPORT CONTROLLER

import { Report } from "@dto/Report";
import { ReportRepository } from "@repositories/ReportRepository";
import { UserRepository } from "@repositories/UserRepository";
import { mapReportDAOToDTO } from "@services/mapperService";
import { OfficeType } from "@models/enums/OfficeType";
import { validatePhotosCount, getPhotoPaths } from "@utils/fileUtils";
import { BadRequestError } from "@utils/utils";

export async function getPublicStatistics() {
  const reportRepo = new ReportRepository();
  return await reportRepo.getPublicStatistics();
}


//? qui prendo gli solo gli Approved Reports (per la mappa pubblica)
export async function getReports(): Promise<Report[]> {
  const reportRepo = new ReportRepository();
  const reports = await reportRepo.getApprovedReports();
  return reports.map(mapReportDAOToDTO);
}

//? Get approved reports filtered by office (for officers)
export async function getReportsByOffice(office: OfficeType): Promise<Report[]> {
  const reportRepo = new ReportRepository();
  const reports = await reportRepo.getApprovedReports();
  // Filter by office/category
  const filtered = reports.filter(r => r.category === office);
  return filtered.map(mapReportDAOToDTO);
}


export async function getReport(id: number): Promise<Report> {
  const reportRepo = new ReportRepository();
  const report = await reportRepo.getReportById(id);
  return mapReportDAOToDTO(report);
}


export async function uploadReport(reportDto: Report, files: Express.Multer.File[], userId?: number): Promise<Report> {
  const reportRepo = new ReportRepository();
  const userRepo = new UserRepository();
  // Validate required fields early to return clear errors
  if (!reportDto) {
    throw new BadRequestError('Missing report data');
  }

  if (!reportDto.title) {
    throw new BadRequestError('Missing required field: title');
  }

  if (!reportDto.category) {
    throw new BadRequestError('Missing required field: category');
  }

  // Validate category is one of the allowed OfficeType values
  const allowedCategories = Object.values(OfficeType);
  if (!allowedCategories.includes(reportDto.category as any)) {
    throw new BadRequestError(`Invalid category value: ${reportDto.category}`);
  }

  // Accept either `Coordinates` or `coordinates` (some clients may use different casing)
  const rawLocation: any = (reportDto as any).location;
  const coords = rawLocation?.Coordinates || rawLocation?.coordinates;
  if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
    throw new BadRequestError('Missing or invalid location coordinates');
  }

  // Normalize to the DAO expected shape: { Coordinates: { latitude, longitude } }
  const normalizedLocation = { Coordinates: { latitude: Number(coords.latitude), longitude: Number(coords.longitude) } };

  // check min 1 max 3 photos
  validatePhotosCount(files);
  // get paths of uploaded photos
  const photoPaths = getPhotoPaths(files);

  // get author if not anonymous
  let author = null;
  if (userId) {
    author = await userRepo.getUserById(userId);
  }
  
  const createdReport = await reportRepo.createReport(
    reportDto.title!,
    normalizedLocation,
    author,
    reportDto.anonymity || false,
    reportDto.category as any as OfficeType,
    {
      Description: reportDto.document?.description,
      Photos: photoPaths
    }
  );
  
  return mapReportDAOToDTO(createdReport);
}


export async function deleteReport(id: number): Promise<void> {
  const reportRepo = new ReportRepository();
  await reportRepo.deleteReport(id);
}
