import { ReportState } from '@models/enums/ReportState';

// Mock repositories used by the controller
// Create shared mock instances so both the test and the controller (which does `new ReportRepository()`)
// interact with the same mocked methods.
const sharedOfficerRepo = {
  getOfficersByOffice: jest.fn()
};

const sharedReportRepo = {
  getReportById: jest.fn(),
  updateReportState: jest.fn(),
  assignReportToOfficer: jest.fn(),
  getReportsByAssignedOfficer: jest.fn()
};

jest.mock('../src/repositories/OfficerRepository', () => {
  return {
    OfficerRepository: jest.fn().mockImplementation(() => sharedOfficerRepo)
  };
});

jest.mock('../src/repositories/ReportRepository', () => {
  return {
    ReportRepository: jest.fn().mockImplementation(() => sharedReportRepo)
  };
});

import { reviewDoc, getAssignedReports } from '../src/controllers/officerController';
import { OfficerRepository } from '../src/repositories/OfficerRepository';
import { ReportRepository } from '../src/repositories/ReportRepository';

describe('officerController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('assigns report to technical officer on approve', async () => {
    const mockOfficers = [
      { id: 10, role: 'municipal_public_relations_officer' },
      { id: 42, role: 'technical_office_staff' }
    ];

    const reportDao = { id: 1, state: ReportState.PENDING, category: 'infrastructure', assignedOfficerId: null, date: new Date() };

    const officerRepo = new OfficerRepository() as any;
    const reportRepo = new ReportRepository() as any;

    officerRepo.getOfficersByOffice.mockResolvedValue(mockOfficers);
    reportRepo.getReportById.mockResolvedValue(reportDao);
    reportRepo.updateReportState.mockResolvedValue({ ...reportDao, state: ReportState.APPROVED });
    reportRepo.assignReportToOfficer.mockResolvedValue({ ...reportDao, assignedOfficerId: 42 });

    // call reviewDoc
    const result = await reviewDoc(999, 1, ReportState.APPROVED);

    expect(reportRepo.updateReportState).toHaveBeenCalledWith(1, ReportState.APPROVED, undefined);
    expect(officerRepo.getOfficersByOffice).toHaveBeenCalledWith(reportDao.category);
    expect(reportRepo.assignReportToOfficer).toHaveBeenCalledWith(1, 42);
    expect(result.assignedOfficerId).toBe(42);
  });

  it('getAssignedReports returns mapped reports', async () => {
    const reportRepo = new ReportRepository() as any;
    const daoReports = [{ id: 5, title: 't', author: null, date: new Date() }];
    reportRepo.getReportsByAssignedOfficer.mockResolvedValue(daoReports);

    const res = await getAssignedReports(1);
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].id).toBe(5);
  });
});
