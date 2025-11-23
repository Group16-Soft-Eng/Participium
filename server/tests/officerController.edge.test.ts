import { ReportState } from '@models/enums/ReportState';

// Shared mocks as in other tests
const sharedOfficerRepo = {
  getOfficersByOffice: jest.fn()
};

const sharedReportRepo = {
  getReportById: jest.fn(),
  updateReportState: jest.fn(),
  assignReportToOfficer: jest.fn(),
  getReportsByAssignedOfficer: jest.fn()
};

jest.mock('../src/repositories/OfficerRepository', () => ({
  OfficerRepository: jest.fn().mockImplementation(() => sharedOfficerRepo)
}));

jest.mock('../src/repositories/ReportRepository', () => ({
  ReportRepository: jest.fn().mockImplementation(() => sharedReportRepo)
}));

import { reviewDoc } from '../src/controllers/officerController';

describe('officerController edge cases', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not assign when no officers exist for category', async () => {
    const reportDao = { id: 2, state: ReportState.PENDING, category: 'environment', assignedOfficerId: null, date: new Date() } as any;
    sharedReportRepo.getReportById.mockResolvedValue(reportDao);
    sharedReportRepo.updateReportState.mockResolvedValue({ ...reportDao, state: ReportState.APPROVED });
    sharedOfficerRepo.getOfficersByOffice.mockResolvedValue([]);

    const result = await reviewDoc(1, 2, ReportState.APPROVED);

    expect(sharedOfficerRepo.getOfficersByOffice).toHaveBeenCalledWith(reportDao.category);
    expect(sharedReportRepo.assignReportToOfficer).not.toHaveBeenCalled();
    expect(result.assignedOfficerId === null || result.assignedOfficerId === undefined).toBeTruthy();
  });

  it('throws when reviewing a report assigned to another officer', async () => {
    const reportDao = { id: 3, state: ReportState.PENDING, category: 'safety', assignedOfficerId: 5, date: new Date() } as any;
    sharedReportRepo.getReportById.mockResolvedValue(reportDao);

    await expect(reviewDoc(1, 3, ReportState.APPROVED)).rejects.toThrow('You can only review reports assigned to you');
  });
});
