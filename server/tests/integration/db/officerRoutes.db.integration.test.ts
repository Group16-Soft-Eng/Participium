// Set DB to in-memory before any imports that read CONFIG
process.env.DB_TYPE = 'sqlite';
process.env.DB_NAME = ':memory:';

import request from 'supertest';
import { initializeDatabase, closeDatabase, AppDataSource } from '../../../src/database/connection';
import app from '../../../src/app';
import { OfficerDAO } from '../../../src/models/dao/OfficerDAO';
import { ReportDAO } from '../../../src/models/dao/ReportDAO';
import { OfficerRole } from '../../../src/models/enums/OfficerRole';
import { generateToken } from '../../../src/services/authService';

describe('DB-backed integration tests for officer assignment', () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('approving a report assigns it to a technical officer and persists', async () => {
    const officerRepo = AppDataSource.getRepository(OfficerDAO);
    const reportRepo = AppDataSource.getRepository(ReportDAO);

    // create a technical officer (use any to avoid strict DeepPartial typing in tests)
    const savedOfficer = await officerRepo.save({
      username: 'tech1',
      name: 'Tech',
      surname: 'One',
      email: 'tech1@example.com',
      password: 'pass',
      role: OfficerRole.TECHNICAL_OFFICE_STAFF,
      office: 'infrastructure'
    } as any);

    // create a pending report in the same category
    const savedReport = await reportRepo.save({
      title: 'Pothole',
      location: { name: 'Main St', Coordinates: { latitude: 0, longitude: 0 } },
      author: null,
      anonymity: false,
      category: 'infrastructure',
      document: { description: 'big hole', photos: [] },
      state: 'PENDING'
    } as any);

    // generate a token for the officer (type 'officer' per authService)
    const token = generateToken({ id: (savedOfficer as any).id, username: (savedOfficer as any).username, type: 'officer' });

    // approve via API
    const patchRes = await request(app)
      .patch(`/api/v1/officers/reviewdocs/${(savedReport as any).id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ state: 'APPROVED' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body).toHaveProperty('id', (savedReport as any).id);
    expect(patchRes.body).toHaveProperty('assignedOfficerId');
    expect(patchRes.body.assignedOfficerId).toBe((savedOfficer as any).id);

    // fetch assigned reports for the officer
    const getRes = await request(app)
      .get('/api/v1/officers/assigned')
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(200);
    expect(Array.isArray(getRes.body)).toBe(true);
    const found = getRes.body.find((r: any) => r.id === (savedReport as any).id);
    expect(found).toBeDefined();
    expect(found.assignedOfficerId).toBe((savedOfficer as any).id);
  });
});
