import "reflect-metadata";
import request from "supertest";
import { app } from "../../../src/app";
import { initializeTestDatabase, closeTestDatabase, clearDatabase } from "../../setup/test-datasource";
import { generateToken } from "../../../src/services/authService";
import { OfficeType } from "../../../src/models/enums/OfficeType";
import { OfficerRole } from "../../../src/models/enums/OfficerRole";
import { ReportState } from "../../../src/models/enums/ReportState";

// Helper per creare un utente tramite API
async function createUser(username: string, name: string, surname: string, email: string, password: string) {
  const response = await request(app)
    .post("/api/v1/users")
    .send({ username, name, surname, email, password });
  return response.body;
}

// Helper per creare un report tramite API
async function createReport(userToken: string, title: string, latitude: number, longitude: number, category: OfficeType, description: string) {
  const response = await request(app)
    .post("/api/v1/reports")
    .set("Authorization", `Bearer ${userToken}`)
    .send({
      title,
      location: {
        Coordinates: { latitude, longitude }
      },
      anonymity: false,
      category,
      document: {
        Description: description,
        Photos: []
      }
    });
  return response.body;
}

describe("Officers API Integration Tests", () => {
  let adminToken: string;
  let publicRelationsToken: string;
  let technicalStaffToken: string;
  let publicRelationsOfficerId: number;
  let technicalStaffOfficerId: number;

  beforeAll(async () => {
    await initializeTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Crea un admin token (l'admin esiste già nel sistema)
    adminToken = generateToken({
      id: 1,
      username: "admin",
      type: OfficerRole.MUNICIPAL_ADMINISTRATOR
    });

    // Crea un Municipal Public Relations Officer tramite API
    const prOfficerResponse = await request(app)
      .post("/api/v1/officers")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        username: "pr_officer",
        name: "Maria",
        surname: "Verdi",
        email: "maria@office.com",
        password: "officer123",
        role: OfficerRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER,
        office: OfficeType.SANITATION
      });
    
    publicRelationsOfficerId = prOfficerResponse.body.id;
    publicRelationsToken = generateToken({
      id: publicRelationsOfficerId,
      username: "maria@office.com",
      type: OfficerRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER
    });

    // Crea un Technical Office Staff tramite API
    const techOfficerResponse = await request(app)
      .post("/api/v1/officers")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        username: "tech_officer",
        name: "Luigi",
        surname: "Bianchi",
        email: "luigi@office.com",
        password: "officer456",
        role: OfficerRole.TECHNICAL_OFFICE_STAFF,
        office: OfficeType.SANITATION
      });
    
    technicalStaffOfficerId = techOfficerResponse.body.id;
    technicalStaffToken = generateToken({
      id: technicalStaffOfficerId,
      username: "luigi@office.com",
      type: OfficerRole.TECHNICAL_OFFICE_STAFF
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
        role: OfficerRole.TECHNICAL_OFFICE_STAFF,
        office: OfficeType.SANITATION
      };

      const response = await request(app)
        .post("/api/v1/officers")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newOfficer);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe(newOfficer.name);
      expect(response.body.email).toBe(newOfficer.email);
      expect(response.body.surname).toBe(newOfficer.surname);
    });

    it("dovrebbe restituire errore 403 se non è admin", async () => {
      const newOfficer = {
        username: "newofficer",
        name: "Giovanni",
        surname: "Verdi",
        email: "giovanni@office.com",
        password: "password123",
        role: OfficerRole.TECHNICAL_OFFICE_STAFF,
        office: OfficeType.SANITATION
      };

      const response = await request(app)
        .post("/api/v1/officers")
        .set("Authorization", `Bearer ${publicRelationsToken}`)
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
        .post("/api/v1/officers")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(incompleteOfficer);

      expect(response.status).toBe(400);
    });
  });

  describe("GET /officers/retrievedocs - Retrieve Docs", () => {
    it("dovrebbe permettere a Public Relations Officer di vedere report PENDING del proprio ufficio", async () => {
      // Crea un utente e un report PENDING per l'ufficio SANITATION
      const user = await createUser("user1", "Mario", "Rossi", "mario@test.com", "password123");
      const userToken = generateToken({
        id: user.id,
        username: user.email,
        type: "CITIZEN"
      });
      const report = await createReport(
        userToken,
        "Test Report",
        45.0,
        9.0,
        OfficeType.SANITATION,
        "Test description with enough characters to meet minimum requirements for testing purposes and validation"
      );

      const response = await request(app)
        .get("/api/v1/officers/retrievedocs")
        .set("Authorization", `Bearer ${publicRelationsToken}`);

      expect(response.status).toBe(200);
    });

    it("dovrebbe restituire errore 401 senza autenticazione", async () => {
      const response = await request(app)
        .get("/api/v1/officers/retrievedocs");

      expect(response.status).toBe(401);
    });

    it("non dovrebbe recuperare report di altri uffici", async () => {
      // Crea un report per un ufficio diverso (INFRASTRUCTURE invece di SANITATION)
      const user = await createUser("user1", "Mario", "Rossi", "mario@test.com", "password123");
      const userToken = generateToken({
        id: user.id,
        username: user.email,
        type: "CITIZEN"
      });
      await createReport(
        userToken,
        "Infrastructure Report",
        45.0,
        9.0,
        OfficeType.INFRASTRUCTURE,
        "Test description with enough characters for infrastructure report validation and testing purposes"
      );

      const response = await request(app)
        .get("/api/v1/officers/retrievedocs")
        .set("Authorization", `Bearer ${publicRelationsToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0); // Nessun report perché è di un altro ufficio
    });

    it("dovrebbe permettere a Technical Staff di vedere report assegnati (dopo approvazione)", async () => {
      // Crea un report e assegnalo al technical staff officer
      const user = await createUser("user1", "Mario", "Rossi", "mario@test.com", "password123");
      const userToken = generateToken({
        id: user.id,
        username: user.email,
        type: "CITIZEN"
      });
      const report = await createReport(
        userToken,
        "Test Report",
        45.0,
        9.0,
        OfficeType.SANITATION,
        "Test description with enough characters to meet minimum requirements for testing purposes and validation"
      );

      // Admin assegna il report al technical staff officer
      await request(app)
        .post("/api/v1/officers/assign-report")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          reportId: report.id,
          officerId: technicalStaffOfficerId
        });

      const response = await request(app)
        .get("/api/v1/officers/retrievedocs")
        .set("Authorization", `Bearer ${technicalStaffToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // Technical staff dovrebbe vedere il report assegnato
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe("PATCH /officers/reviewdocs/:id_doc - Review Doc", () => {
    it("dovrebbe permettere a Public Relations Officer di approvare un report", async () => {
      // Crea un report in stato PENDING
      const user = await createUser("user1", "Mario", "Rossi", "mario@test.com", "password123");
      const userToken = generateToken({
        id: user.id,
        username: user.email,
        type: "CITIZEN"
      });
      const report = await createReport(
        userToken,
        "Test Report",
        45.0,
        9.0,
        OfficeType.SANITATION,
        "Test description with enough characters to meet minimum requirements for testing purposes and validation"
      );

      const response = await request(app)
        .patch(`/api/v1/officers/reviewdocs/${report.id}`)
        .set("Authorization", `Bearer ${publicRelationsToken}`)
        .send({
          state: ReportState.APPROVED
        });

      expect(response.status).toBe(200);
      expect(response.body.state).toBe(ReportState.APPROVED);
    });

    it("dovrebbe permettere a Public Relations Officer di rifiutare un report con motivazione", async () => {
      const user = await createUser("user1", "Mario", "Rossi", "mario@test.com", "password123");
      const userToken = generateToken({
        id: user.id,
        username: user.email,
        type: "CITIZEN"
      });
      const report = await createReport(
        userToken,
        "Test Report",
        45.0,
        9.0,
        OfficeType.SANITATION,
        "Test description with enough characters to meet minimum requirements for testing purposes and validation"
      );

      const response = await request(app)
        .patch(`/api/v1/officers/reviewdocs/${report.id}`)
        .set("Authorization", `Bearer ${publicRelationsToken}`)
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
        .patch("/api/v1/officers/reviewdocs/99999")
        .set("Authorization", `Bearer ${publicRelationsToken}`)
        .send({
          state: ReportState.APPROVED
        });

      expect(response.status).toBe(404);
    });
  });

  describe("POST /officers/assign-report - Assign Report", () => {
    it("dovrebbe permettere all'admin di assegnare un report a un technical staff officer", async () => {
      const user = await createUser("user1", "Mario", "Rossi", "mario@test.com", "password123");
      const userToken = generateToken({
        id: user.id,
        username: user.email,
        type: "CITIZEN"
      });
      const report = await createReport(
        userToken,
        "Test Report",
        45.0,
        9.0,
        OfficeType.SANITATION,
        "Test description with enough characters to meet minimum requirements for testing purposes and validation"
      );

      const response = await request(app)
        .post("/api/v1/officers/assign-report")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          reportId: report.id,
          officerId: technicalStaffOfficerId
        });

      expect(response.status).toBe(200);
    });

    it("dovrebbe restituire errore 403 se non è admin", async () => {
      const response = await request(app)
        .post("/api/v1/officers/assign-report")
        .set("Authorization", `Bearer ${technicalStaffToken}`)
        .send({
          reportId: 1,
          officerId: technicalStaffOfficerId
        });

      expect(response.status).toBe(403);
    });

    it("dovrebbe restituire errore 404 con reportId inesistente", async () => {
      const response = await request(app)
        .post("/api/v1/officers/assign-report")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          reportId: 99999,
          officerId: technicalStaffOfficerId
        });

      expect(response.status).toBe(404);
    });
  });
});
