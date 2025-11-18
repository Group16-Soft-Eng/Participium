import "reflect-metadata";
import request from "supertest";
import { app } from "../../../src/app";
import { initializeTestDatabase, closeTestDatabase, clearDatabase } from "../../setup/test-datasource";
import { OfficerRepository } from "../../../src/repositories/OfficerRepository";
import { ReportRepository } from "../../../src/repositories/ReportRepository";
import { UserRepository } from "../../../src/repositories/UserRepository";
import { generateToken } from "../../../src/services/authService";
import { OfficeType } from "../../../src/models/enums/OfficeType";
import { OfficerRole } from "../../../src/models/enums/OfficerRole";
import { ReportState } from "../../../src/models/enums/ReportState";

describe("Officers API Integration Tests", () => {
  let officerRepo: OfficerRepository;
  let reportRepo: ReportRepository;
  let userRepo: UserRepository;
  let adminToken: string;
  let officerToken: string;
  let testOfficer: any;

  beforeAll(async () => {
    await initializeTestDatabase();
    officerRepo = new OfficerRepository();
    reportRepo = new ReportRepository();
    userRepo = new UserRepository();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Crea un admin per i test
    adminToken = generateToken({
      id: 1,
      username: "admin",
      type: OfficerRole.ADMIN
    });

    // Crea un officer per i test
    testOfficer = await officerRepo.createOfficer(
      "officer1",
      "Luigi",
      "Bianchi",
      "luigi@office.com",
      "officer123",
      OfficerRole.ROLE_1,
      OfficeType.OFFICE_1
    );

    officerToken = generateToken({
      id: testOfficer.id,
      username: testOfficer.email,
      type: testOfficer.role
    });
  });

  describe("POST /officers - Create Officer", () => {
    it("dovrebbe creare un nuovo officer con dati validi (admin)", async () => {
      const newOfficer = {
        username: "newofficer",
        name: "Giovanni",
        surname: "Verdi",
        email: "giovanni@office.com",
        password: "password123",
        role: OfficerRole.ROLE_2,
        office: OfficeType.OFFICE_2
      };

      const response = await request(app)
        .post("/officers")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newOfficer);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.username).toBe(newOfficer.username);
      expect(response.body.email).toBe(newOfficer.email);
      expect(response.body.role).toBe(newOfficer.role);
      expect(response.body.office).toBe(newOfficer.office);
    });

    it("dovrebbe restituire errore 403 se non è admin", async () => {
      const newOfficer = {
        username: "newofficer",
        name: "Giovanni",
        surname: "Verdi",
        email: "giovanni@office.com",
        password: "password123",
        role: OfficerRole.ROLE_2,
        office: OfficeType.OFFICE_2
      };

      const response = await request(app)
        .post("/officers")
        .set("Authorization", `Bearer ${officerToken}`)
        .send(newOfficer);

      expect(response.status).toBe(403);
    });

    it("dovrebbe restituire errore 400 con dati mancanti", async () => {
      const incompleteOfficer = {
        username: "newofficer",
        name: "Giovanni"
        // mancano surname, email, password, role, office
      };

      const response = await request(app)
        .post("/officers")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(incompleteOfficer);

      expect(response.status).toBe(400);
    });
  });

  describe("GET /officers/retrievedocs - Retrieve Docs", () => {
    it("dovrebbe recuperare i report assegnati all'officer", async () => {
      // Crea un utente e un report
      const user = await userRepo.createUser("user1", "Mario", "Rossi", "mario@test.com", "password123");
      const report = await reportRepo.createReport(
        "Test Report",
        { Coordinates: { latitude: 45.0, longitude: 9.0 } },
        user,
        false,
        OfficeType.OFFICE_1,
        {
          Description: "Test description with enough characters to meet minimum requirements for testing purposes and validation",
          Photos: ["photo1.jpg"]
        }
      );

      const response = await request(app)
        .get("/officers/retrievedocs")
        .set("Authorization", `Bearer ${officerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("dovrebbe restituire errore 401 senza autenticazione", async () => {
      const response = await request(app)
        .get("/officers/retrievedocs");

      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /officers/reviewdocs/:id_doc - Review Doc", () => {
    it("dovrebbe approvare un report", async () => {
      // Crea un report in stato PENDING
      const user = await userRepo.createUser("user1", "Mario", "Rossi", "mario@test.com", "password123");
      const report = await reportRepo.createReport(
        "Test Report",
        { Coordinates: { latitude: 45.0, longitude: 9.0 } },
        user,
        false,
        OfficeType.OFFICE_1,
        {
          Description: "Test description with enough characters to meet minimum requirements for testing purposes and validation",
          Photos: ["photo1.jpg"]
        }
      );

      const response = await request(app)
        .patch(`/officers/reviewdocs/${report.id}`)
        .set("Authorization", `Bearer ${officerToken}`)
        .send({
          state: ReportState.APPROVED
        });

      expect(response.status).toBe(200);
      expect(response.body.state).toBe(ReportState.APPROVED);
    });

    it("dovrebbe rifiutare un report con motivazione", async () => {
      const user = await userRepo.createUser("user1", "Mario", "Rossi", "mario@test.com", "password123");
      const report = await reportRepo.createReport(
        "Test Report",
        { Coordinates: { latitude: 45.0, longitude: 9.0 } },
        user,
        false,
        OfficeType.OFFICE_1,
        {
          Description: "Test description with enough characters to meet minimum requirements for testing purposes and validation",
          Photos: ["photo1.jpg"]
        }
      );

      const response = await request(app)
        .patch(`/officers/reviewdocs/${report.id}`)
        .set("Authorization", `Bearer ${officerToken}`)
        .send({
          state: ReportState.DECLINED,
          reason: "Il report non contiene informazioni sufficienti per procedere con l'approvazione"
        });

      expect(response.status).toBe(200);
      expect(response.body.state).toBe(ReportState.DECLINED);
      expect(response.body.reason).toBeDefined();
    });

    it("dovrebbe restituire errore 404 con ID inesistente", async () => {
      const response = await request(app)
        .patch("/officers/reviewdocs/99999")
        .set("Authorization", `Bearer ${officerToken}`)
        .send({
          state: ReportState.APPROVED
        });

      expect(response.status).toBe(404);
    });
  });

  describe("POST /officers/assign-docs - Assign Doc", () => {
    it("dovrebbe assegnare un report a un officer (admin)", async () => {
      const user = await userRepo.createUser("user1", "Mario", "Rossi", "mario@test.com", "password123");
      const report = await reportRepo.createReport(
        "Test Report",
        { Coordinates: { latitude: 45.0, longitude: 9.0 } },
        user,
        false,
        OfficeType.OFFICE_1,
        {
          Description: "Test description with enough characters to meet minimum requirements for testing purposes and validation",
          Photos: ["photo1.jpg"]
        }
      );

      const response = await request(app)
        .post("/officers/assign-docs")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          reportId: report.id,
          officerId: testOfficer.id
        });

      expect(response.status).toBe(200);
    });

    it("dovrebbe restituire errore 403 se non è admin", async () => {
      const response = await request(app)
        .post("/officers/assign-docs")
        .set("Authorization", `Bearer ${officerToken}`)
        .send({
          reportId: 1,
          officerId: testOfficer.id
        });

      expect(response.status).toBe(403);
    });

    it("dovrebbe restituire errore 404 con reportId inesistente", async () => {
      const response = await request(app)
        .post("/officers/assign-docs")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          reportId: 99999,
          officerId: testOfficer.id
        });

      expect(response.status).toBe(404);
    });
  });
});
