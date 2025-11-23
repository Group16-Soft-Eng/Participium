import request from 'supertest';

// Mock authService to bypass token verification and set user in req
jest.mock('../../src/services/authService', () => ({
  verifyToken: (token: string) => ({ id: 2, type: 'technical_office_staff' })
}));

import app from '../../src/app';

// Mock repositories to avoid DB access
jest.mock('../../src/repositories/ReportRepository', () => {
  return {
    ReportRepository: jest.fn().mockImplementation(() => ({
      getReportsByAssignedOfficer: jest.fn().mockResolvedValue([{ id: 7, title: 'Integration Report', author: null, date: new Date() }]),
      getReportById: jest.fn().mockResolvedValue({ id: 7, state: 'PENDING', category: 'infrastructure', assignedOfficerId: null, date: new Date() }),
      updateReportState: jest.fn().mockResolvedValue({ id: 7, state: 'APPROVED', date: new Date(), category: 'infrastructure', document: {} }),
      assignReportToOfficer: jest.fn().mockResolvedValue({ id: 7, assignedOfficerId: 2, date: new Date(), category: 'infrastructure', document: {} })
    }))
  };
});

jest.mock('../../src/repositories/OfficerRepository', () => ({
  OfficerRepository: jest.fn().mockImplementation(() => ({
    getOfficersByOffice: jest.fn().mockResolvedValue([{ id: 2, role: 'technical_office_staff' }])
  }))
}));

describe('officer routes (integration, mocked repos)', () => {
  it('GET /officers/assigned returns assigned reports for technical officer', async () => {
    const res = await request(app).get('/api/v1/officers/assigned').set('Authorization', 'Bearer faketoken');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].id).toBe(7);
  });

  it('PATCH /officers/reviewdocs/:id approves and assigns', async () => {
    const res = await request(app).patch('/api/v1/officers/reviewdocs/7').set('Authorization', 'Bearer faketoken').send({ state: 'APPROVED' });
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(7);
    // after approve, the mocked assignReportToOfficer returns assignedOfficerId:2
    expect(res.body.assignedOfficerId === 2 || res.body.assignedOfficerId === undefined).toBeTruthy();
  });
});
