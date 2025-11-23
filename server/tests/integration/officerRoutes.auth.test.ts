import request from 'supertest';

// Test unauthenticated and wrong-role access for officer routes

// 1) No token provided -> middleware should return 401
// 2) Token with wrong role -> requireUserType should return 401

// For the second case we mock authService to return a non-technical role
jest.mock('../../src/services/authService', () => ({
  verifyToken: (token: string) => ({ id: 99, type: 'municipal_administrator' })
}));

import app from '../../src/app';

// Mock repositories to avoid DB access during these auth-focused tests
jest.mock('../../src/repositories/ReportRepository', () => {
  return {
    ReportRepository: jest.fn().mockImplementation(() => ({
      getReportsByAssignedOfficer: jest.fn().mockResolvedValue([]),
      getReportById: jest.fn().mockResolvedValue(null),
      updateReportState: jest.fn(),
      assignReportToOfficer: jest.fn()
    }))
  };
});

jest.mock('../../src/repositories/OfficerRepository', () => ({
  OfficerRepository: jest.fn().mockImplementation(() => ({
    getOfficersByOffice: jest.fn().mockResolvedValue([])
  }))
}));

describe('officer routes auth checks', () => {
  it('returns 401 when no Authorization header is present', async () => {
    const res = await request(app).get('/api/v1/officers/assigned');
    expect(res.status).toBe(401);
  });

  it('returns 401 when user has wrong role', async () => {
    const res = await request(app).get('/api/v1/officers/assigned').set('Authorization', 'Bearer wrongrole');
    expect(res.status).toBe(401);
  });
});
