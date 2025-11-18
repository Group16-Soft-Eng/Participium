import "reflect-metadata";
import request from "supertest";
import { app } from "../../../src/app";
import { initializeTestDatabase, closeTestDatabase, clearDatabase } from "../../setup/test-datasource";
import { ReportRepository } from "../../../src/repositories/ReportRepository";
import { UserRepository } from "../../../src/repositories/UserRepository";
import { generateToken } from "../../../src/services/authService";
import { OfficeType } from "../../../src/models/enums/OfficeType";
import { ReportState } from "../../../src/models/enums/ReportState";

describe("Reports API Integration Tests", () => {
  let reportRepo: ReportRepository;
  let userRepo: UserRepository;
  let userToken: string;
  let testUser: any;

  beforeAll(async () => {
    await initializeTestDatabase();
    reportRepo = new ReportRepository();
    userRepo = new UserRepository();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Crea un utente per i test
    testUser = await userRepo.createUser("testuser", "Mario", "Rossi", "mario@test.com", "password123");
    userToken = generateToken({
      id: testUser.id,
      username: testUser.username,
      type: "user"
    });
  });

  describe("POST /reports - Upload Report", () => {
    it("dovrebbe creare un nuovo report con dati validi", async () => {
      const newReport = {
        title: "Buca sulla strada",
        location: {
          Coordinates: {
            latitude: 45.464211,
            longitude: 9.191383
          }
        },
        anonymity: false,
        category: OfficeType.OFFICE_1,
        document: {
          description: "C'è una grande buca sulla strada principale che causa problemi al traffico. La situazione richiede un intervento urgente per evitare incidenti.",
          photos: []
        }
      };

      const response = await request(app)
        .post("/reports")
        .set("Authorization", `Bearer ${userToken}`)
        .field("title", newReport.title)
        .field("location", JSON.stringify(newReport.location))
        .field("anonymity", newReport.anonymity.toString())
        .field("category", newReport.category)
        .field("document", JSON.stringify(newReport.document))
        .attach("photos", Buffer.from("fake-image-data"), "photo1.jpg");

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.title).toBe(newReport.title);
      expect(response.body.category).toBe(newReport.category);
      expect(response.body.state).toBe(ReportState.PENDING);
    });

    it("dovrebbe creare un report anonimo", async () => {
      const anonymousReport = {
        title: "Segnalazione anonima",
        location: {
          Coordinates: {
            latitude: 45.464211,
            longitude: 9.191383
          }
        },
        anonymity: true,
        category: OfficeType.OFFICE_2,
        document: {
          description: "Questa è una segnalazione anonima che non deve contenere informazioni sull'autore per proteggere la privacy del cittadino segnalante.",
          photos: []
        }
      };

      const response = await request(app)
        .post("/reports")
        .set("Authorization", `Bearer ${userToken}`)
        .field("title", anonymousReport.title)
        .field("location", JSON.stringify(anonymousReport.location))
        .field("anonymity", anonymousReport.anonymity.toString())
        .field("category", anonymousReport.category)
        .field("document", JSON.stringify(anonymousReport.document))
        .attach("photos", Buffer.from("fake-image-data"), "photo1.jpg");

      expect(response.status).toBe(201);
      expect(response.body.anonymity).toBe(true);
      expect(response.body.author).toBeNull();
    });

    it("dovrebbe restituire errore 400 senza foto allegate", async () => {
      const reportWithoutPhotos = {
        title: "Report senza foto",
        location: {
          Coordinates: {
            latitude: 45.464211,
            longitude: 9.191383
          }
        },
        anonymity: false,
        category: OfficeType.OFFICE_1,
        document: {
          description: "Questo report non ha foto allegate e dovrebbe generare un errore di validazione secondo le specifiche dell'API.",
          photos: []
        }
      };

      const response = await request(app)
        .post("/reports")
        .set("Authorization", `Bearer ${userToken}`)
        .field("title", reportWithoutPhotos.title)
        .field("location", JSON.stringify(reportWithoutPhotos.location))
        .field("anonymity", reportWithoutPhotos.anonymity.toString())
        .field("category", reportWithoutPhotos.category)
        .field("document", JSON.stringify(reportWithoutPhotos.document));

      expect(response.status).toBe(400);
    });

    it("dovrebbe restituire errore 400 con più di 3 foto", async () => {
      const response = await request(app)
        .post("/reports")
        .set("Authorization", `Bearer ${userToken}`)
        .field("title", "Report con troppe foto")
        .field("location", JSON.stringify({ Coordinates: { latitude: 45.0, longitude: 9.0 } }))
        .field("anonymity", "false")
        .field("category", OfficeType.OFFICE_1)
        .field("document", JSON.stringify({
          description: "Test con più di tre foto per verificare la validazione del limite massimo di immagini consentite.",
          photos: []
        }))
        .attach("photos", Buffer.from("fake-image-data-1"), "photo1.jpg")
        .attach("photos", Buffer.from("fake-image-data-2"), "photo2.jpg")
        .attach("photos", Buffer.from("fake-image-data-3"), "photo3.jpg")
        .attach("photos", Buffer.from("fake-image-data-4"), "photo4.jpg");

      expect(response.status).toBe(400);
    });

    it("dovrebbe restituire errore 400 con categoria non valida", async () => {
      const response = await request(app)
        .post("/reports")
        .set("Authorization", `Bearer ${userToken}`)
        .field("title", "Report con categoria invalida")
        .field("location", JSON.stringify({ Coordinates: { latitude: 45.0, longitude: 9.0 } }))
        .field("anonymity", "false")
        .field("category", "INVALID_CATEGORY")
        .field("document", JSON.stringify({
          description: "Test con categoria non valida per verificare la validazione dei valori enum consentiti.",
          photos: []
        }))
        .attach("photos", Buffer.from("fake-image-data"), "photo1.jpg");

      expect(response.status).toBe(400);
    });

    it("dovrebbe restituire errore 400 senza coordinate", async () => {
      const response = await request(app)
        .post("/reports")
        .set("Authorization", `Bearer ${userToken}`)
        .field("title", "Report senza coordinate")
        .field("anonymity", "false")
        .field("category", OfficeType.OFFICE_1)
        .field("document", JSON.stringify({
          description: "Test senza coordinate per verificare la validazione dei campi obbligatori richiesti dall'API.",
          photos: []
        }))
        .attach("photos", Buffer.from("fake-image-data"), "photo1.jpg");

      expect(response.status).toBe(400);
    });

    it("dovrebbe restituire errore 401 senza autenticazione", async () => {
      const response = await request(app)
        .post("/reports")
        .field("title", "Report non autenticato")
        .attach("photos", Buffer.from("fake-image-data"), "photo1.jpg");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /reports - Get Reports", () => {
    it("dovrebbe recuperare tutti i report approvati", async () => {
      // Crea alcuni report in diversi stati
      const report1 = await reportRepo.createReport(
        "Report Approvato 1",
        { Coordinates: { latitude: 45.0, longitude: 9.0 } },
        testUser,
        false,
        OfficeType.OFFICE_1,
        {
          Description: "Questo è un report approvato visibile sulla mappa pubblica per tutti i cittadini.",
          Photos: ["photo1.jpg"]
        }
      );
      await reportRepo.updateReportState(report1.id, ReportState.APPROVED);

      const report2 = await reportRepo.createReport(
        "Report Approvato 2",
        { Coordinates: { latitude: 45.1, longitude: 9.1 } },
        testUser,
        false,
        OfficeType.OFFICE_2,
        {
          Description: "Un altro report approvato che deve essere visualizzato sulla mappa pubblica.",
          Photos: ["photo2.jpg"]
        }
      );
      await reportRepo.updateReportState(report2.id, ReportState.APPROVED);

      // Report in pending - non dovrebbe apparire
      await reportRepo.createReport(
        "Report Pending",
        { Coordinates: { latitude: 45.2, longitude: 9.2 } },
        testUser,
        false,
        OfficeType.OFFICE_3,
        {
          Description: "Questo report è in pending e non dovrebbe essere visibile sulla mappa pubblica.",
          Photos: ["photo3.jpg"]
        }
      );

      const response = await request(app)
        .get("/reports");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2); // Solo i due approvati
      expect(response.body.every((r: any) => r.state === ReportState.APPROVED)).toBe(true);
    });

    it("dovrebbe restituire un array vuoto se non ci sono report approvati", async () => {
      const response = await request(app)
        .get("/reports");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it("non dovrebbe richiedere autenticazione (mappa pubblica)", async () => {
      const response = await request(app)
        .get("/reports");

      expect(response.status).toBe(200);
    });
  });
});
