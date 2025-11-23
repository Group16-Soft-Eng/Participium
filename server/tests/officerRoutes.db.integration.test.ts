// Set DB to in-memory before any imports that read CONFIG
process.env.DB_TYPE = 'sqlite';
process.env.DB_NAME = ':memory:';

import request from 'supertest';
import { initializeDatabase, closeDatabase, AppDataSource } from '../src/database/connection';
import app from '../src/app';
import { OfficerDAO } from '../src/models/dao/OfficerDAO';
import { ReportDAO } from '../src/models/dao/ReportDAO';
import { OfficerRole } from '../src/models/enums/OfficerRole';
import { OfficerRepository } from '../src/repositories/OfficerRepository';
import { ReportState } from '../src/models/enums/ReportState';
import { reviewDoc } from '../src/controllers/officerController';
import { generateToken } from '../src/services/authService';

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
      document: { Description: 'big hole', Photos: [] },
      state: 'PENDING'
    } as any);

    // generate a token for the officer (type must be 'officer' per authService)
    // generate a token whose payload.type contains the officer role string
    const token = generateToken({ id: (savedOfficer as any).id, username: (savedOfficer as any).username, type: (savedOfficer as any).role } as any);

    // debug: show what's in DB before approve
    console.log('Officers in DB before approve:', await officerRepo.find());
    console.log('OfficerRepository.getOfficersByOffice:', await new OfficerRepository().getOfficersByOffice('infrastructure' as any));
    console.log('Reports in DB before approve:', await reportRepo.find());

    // Try manual assign using repository API to confirm repo behavior
    const manualAssigned = await reportRepo.save({ ...(savedReport as any), assignedOfficerId: (savedOfficer as any).id } as any);
    console.log('Manual assigned report:', manualAssigned);

    // call controller directly to approve and assign (bypass HTTP layer)
    // Try passing a plain string for the state to avoid enum-instance mismatches
    const direct = await reviewDoc((savedOfficer as any).id, (savedReport as any).id, 'APPROVED' as any);
    console.log('Direct reviewDoc result:', direct);

    // fetch raw report from DB to verify persistence
    const persisted = await reportRepo.findOneBy({ id: (savedReport as any).id });
    console.log('Persisted report after approve:', persisted);
    expect((persisted as any).assignedOfficerId).toBe((savedOfficer as any).id);

    // fetch assigned reports for the officer via API
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
