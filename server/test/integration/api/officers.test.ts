import "reflect-metadata";
jest.mock('@services/authService', () => {
  const original = jest.requireActual('@services/authService');
  return {
    ...original,
    saveSession: jest.fn().mockResolvedValue(undefined),
    validateSession: jest.fn().mockResolvedValue(true),
  };
});
import request from "supertest";
import { app } from "../../../src/app";
// Importa TestDataSource (invece di AppDataSource)
import { initializeTestDatabase, closeTestDatabase, clearDatabase, TestDataSource } from "../../setup/test-datasource";
import { generateToken } from "../../../src/services/authService";
import { OfficeType } from "../../../src/models/enums/OfficeType";
import { OfficerRole as OR } from "../../../src/models/dto/OfficerRole";
import { OfficerRole } from "../../../src/models/enums/OfficerRole";
import { ReportState } from "../../../src/models/enums/ReportState";
import { createOfficer } from "../../../src/controllers/officerController";
import { Officer } from "../../../src/models/dto/Officer";
const payloadAdmin = {
  username: "admin",
  name: "Admin",
  surname: "User",
  email: "admin@office.com",
  password: "admin123",
  role: OR.Role2,
} as Officer;

// Helper per creare un utente tramite API
async function createUser(username: string, firstName: string, lastName: string, email: string, password: string) {
  const response = await request(app)
    .post("/api/v1/users")
    .send({ username, firstName, lastName, email, password });
  return response.body;
}

// Helper per creare un report tramite API
async function createReport(userToken: string, title: string, latitude: number, longitude: number, category: OfficeType, description: string) {
  
  // Per inviare file, devi usare multipart/form-data
  // Usa .field() per i campi di testo e .attach() per i file
  const response = await request(app)
    .post("/api/v1/reports")
    .set("Authorization", `Bearer ${userToken}`)
    .field("title", title)
    .field("latitude", latitude.toString()) // I campi form-data sono stringhe
    .field("longitude", longitude.toString())
    .field("anonymity", "false")
    .field("category", category)
    .field("description", description)
    .attach(
      "photos", // Questo è il nome del campo che multer si aspetta (es. upload.array('photos', 3))
      Buffer.from("fake image data"), // Un buffer con dati finti
      "test-photo.jpg" // Un nome file finto
    );
    
  return response.body;
}

async function loginOfficer(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post("/api/v1/auth/officers")
    .send({ email, password });
  // Supponendo che il token sia nel body come stringa
  return res.body;
}

describe("Officers API Integration Tests", () => {
  let adminToken: string;
  let publicRelationsToken: string;
  let technicalStaffToken: string;
  let publicRelationsOfficerId: number;
  let technicalStaffOfficerId: number;
  let token_conn: string;
  beforeAll(async () => {
    await initializeTestDatabase();
    await createOfficer({
      ...payloadAdmin
    });
    token_conn = await loginOfficer(payloadAdmin.email as string, payloadAdmin.password as string);
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    // await clearDatabase(); // <-- Questo causava l'errore FOREIGN KEY

    // Sostituzione con pulizia manuale nell'ordine corretto per rispettare i constraints
    // La foreign key è: reports.author_id -> users.id
    // Dobbiamo eliminare prima i reports, poi gli users (e gli officers).
    try {
      // Usa TestDataSource (il nome corretto esportato)
      if (TestDataSource && TestDataSource.isInitialized) {
        await TestDataSource.query('DELETE FROM "reports"');
        await TestDataSource.query('DELETE FROM "officers"');
        await TestDataSource.query('DELETE FROM "users"');
      } else {
        // Fallback nel caso TestDataSource non sia disponibile
        await clearDatabase();
      }
    } catch (e) {
      console.error("Errore nella pulizia manuale del DB, fallback a clearDatabase()", e);
      await clearDatabase(); // Tenta con il metodo originale se l'import fallisce
    }


    // Crea un admin token (l'admin esiste già nel sistema)
    adminToken = generateToken({
      id: 1,
      username: "admin",
      type: OfficerRole.MUNICIPAL_ADMINISTRATOR,
      sessionType: "web"
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
        type: "user"
      });
      const report = await createReport(
        userToken,
        "Test Report",
        45.0,
        9.0,
        OfficeType.SANITATION,
        "Test description with enough characters to meet minimum requirements for testing purposes and validation"
      );
      
      // La chiamata a createReport ora dovrebbe funzionare
      expect(report.id).toBeDefined();

      const response = await request(app)
        .get("/api/v1/officers/retrievedocs")
        .set("Authorization", `Bearer ${publicRelationsToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(report.id);
    });

    it("dovrebbe restituire errore 401 senza autenticazione", async () => {
      const response = await request(app)
        .get("/api/v1/officers/retrievedocs");

      expect(response.status).toBe(401);
    });

    it("Technical Staff dovrebbe vedere solo report assegnati a lui, non quelli di altri uffici", async () => {
  // Crea un report per SANITATION
  const user1 = await createUser("user2", "Anna", "Neri", "anna@test.com", "password123");
  const userToken1 = generateToken({
    id: user1.id,
    username: user1.email,
    type: "user"
  });
  const sanitationReport = await createReport(
    userToken1,
    "Sanitation Report",
    45.1,
    9.1,
    OfficeType.SANITATION,
    "Sanitation report description"
  );

  // Crea un report per INFRASTRUCTURE
  const user2 = await createUser("user3", "Luca", "Blu", "luca@test.com", "password123");
  const userToken2 = generateToken({
    id: user2.id,
    username: user2.email,
    type: "user"
  });
  const infraReport = await createReport(
    userToken2,
    "Infrastructure Report",
    45.2,
    9.2,
    OfficeType.INFRASTRUCTURE,
    "Infrastructure report description"
  );

  // Assegna solo il report SANITATION al technicalStaffOfficer
  await request(app)
    .post("/api/v1/officers/assign-report")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      reportId: sanitationReport.id,
      officerId: technicalStaffOfficerId
    });

  // Technical staff dovrebbe vedere solo il report assegnato (SANITATION)
  const response = await request(app)
    .get("/api/v1/officers/retrievedocs")
    .set("Authorization", `Bearer ${technicalStaffToken}`);

  expect(response.status).toBe(200);
  expect(Array.isArray(response.body)).toBe(true);
  expect(response.body.length).toBe(1);
  expect(response.body[0].id).toBe(sanitationReport.id);
  expect(response.body[0].category).toBe(OfficeType.SANITATION);
});

    it("dovrebbe permettere a Technical Staff di vedere report assegnati (dopo approvazione)", async () => {
      // Crea un report e assegnalo al technical staff officer
      const user = await createUser("user1", "Mario", "Rossi", "mario@test.com", "password123");
      const userToken = generateToken({
        id: user.id,
        username: user.email,
        type: "user"
      });
      const report = await createReport(
        userToken,
        "Test Report",
        45.0,
        9.0,
        OfficeType.SANITATION,
        "Test description with enough characters to meet minimum requirements for testing purposes and validation"
      );
      
      expect(report.id).toBeDefined();

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
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(report.id);
    });
  });

  describe("PATCH /officers/reviewdocs/:id_doc - Review Doc", () => {
    it("non dovrebbe permettere a Public Relations Officer di approvare un report", async () => {
      // Crea un report in stato PENDING
      const user = await createUser("user1", "Mario", "Rossi", "mario@test.com", "password123");
      const userToken = generateToken({
        id: user.id,
        username: user.email,
        type: "user"
      });
      const report = await createReport(
        userToken,
        "Test Report",
        45.0,
        9.0,
        OfficeType.SANITATION,
        "Test description with enough characters to meet minimum requirements for testing purposes and validation"
      );
      console.log("Report creato con ID:", report.id);
      const response = await request(app)
        .patch(`/api/v1/officers/reviewdocs/${report.id}`)
        .set("Authorization", `Bearer ${publicRelationsToken}`)
        .send({
          state: ReportState.APPROVED
        });

      expect(response.status).toBe(403);
    });

    it("non dovrebbe permettere a Public Relations Officer di rifiutare un report con motivazione", async () => {
      const user = await createUser("user1", "Mario", "Rossi", "mario@test.com", "password123");
      const userToken = generateToken({
        id: user.id,
        username: user.email,
        type: "user"
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

      expect(response.status).toBe(403);
    });

    it("dovrebbe restituire errore 403 con ID inesistente", async () => {
      const response = await request(app)
        .patch("/api/v1/officers/reviewdocs/99999")
        .set("Authorization", `Bearer ${publicRelationsToken}`)
        .send({
          state: ReportState.APPROVED
        });

      expect(response.status).toBe(403);
    });
  });

  describe("POST /officers/assign-report - Assign Report", () => {
    it("dovrebbe permettere all'admin di assegnare un report a un technical staff officer", async () => {
      const user = await createUser("user1", "Mario", "Rossi", "mario@test.com", "password123");
      const userToken = generateToken({
        id: user.id,
        username: user.email,
        type: "user"
      });
      
      const report = await createReport(
        userToken,
        "Test Report",
        45.0,
        9.0,
        OfficeType.SANITATION,
        "Test description with enough characters to meet minimum requirements for testing purposes and validation"
      );
      
      console.log("Report creato con ID:", report.id);
      expect(report.id).toBeDefined(); // Assicurati che il report sia stato creato
      
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