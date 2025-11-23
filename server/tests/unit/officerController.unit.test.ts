import { ReportState } from '../../src/models/enums/ReportState';

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

jest.mock('../../src/repositories/OfficerRepository', () => {
  return {
    OfficerRepository: jest.fn().mockImplementation(() => sharedOfficerRepo)
  };
});

jest.mock('../../src/repositories/ReportRepository', () => {
  return {
    ReportRepository: jest.fn().mockImplementation(() => sharedReportRepo)
  };
});

// Import via require to avoid named-export type-resolution issues in the test runner
const controller = require('../../src/controllers/officerController');
const { reviewDoc, getAssignedReports } = controller as any;
import { OfficerRepository } from '../../src/repositories/OfficerRepository';
import { ReportRepository } from '../../src/repositories/ReportRepository';

describe('officerController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('assigns report to technical officer on approve', async () => {
    const mockOfficers = [
      { id: 10, role: 'municipal_public_relations_officer' },
      { id: 42, role: 'technical_office_staff' }
    ];

    const reportDao = { id: 1, state: ReportState.PENDING, category: 'infrastructure', assignedOfficerId: null, date: new Date() } as any;

    const officerRepo = new OfficerRepository() as any;
    const reportRepo = new ReportRepository() as any;

    officerRepo.getOfficersByOffice.mockResolvedValue(mockOfficers);
    reportRepo.getReportById.mockResolvedValue(reportDao);
    reportRepo.updateReportState.mockResolvedValue({ ...reportDao, state: ReportState.APPROVED });
    reportRepo.assignReportToOfficer.mockResolvedValue({ ...reportDao, assignedOfficerId: 42 });

    // call reviewDoc
    const result = await reviewDoc(999 as any, 1 as any, ReportState.APPROVED);

    expect(reportRepo.updateReportState).toHaveBeenCalledWith(1, ReportState.APPROVED, undefined);
    expect(officerRepo.getOfficersByOffice).toHaveBeenCalledWith(reportDao.category);
    expect(reportRepo.assignReportToOfficer).toHaveBeenCalledWith(1, 42);
    expect((result as any).assignedOfficerId).toBe(42);
  });

  it('getAssignedReports returns mapped reports', async () => {
    const reportRepo = new ReportRepository() as any;
    const daoReports = [{ id: 5, title: 't', author: null, date: new Date() }];
    reportRepo.getReportsByAssignedOfficer.mockResolvedValue(daoReports);

    const res = await getAssignedReports(1 as any);
    expect(Array.isArray(res)).toBe(true);
    expect((res[0] as any).id).toBe(5);
  });
});
