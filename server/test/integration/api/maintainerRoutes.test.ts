import "reflect-metadata";
import request from "supertest";
jest.mock("../../../src/repositories/MaintainerRepository");
jest.mock("../../../src/repositories/ReportRepository");
jest.mock("../../../src/middlewares/authMiddleware");

import express from "express";
import { maintainerRouter } from "../../../src/routes/MaintainerRoutes";
import { OfficeType } from "../../../src/models/enums/OfficeType";
import { OfficerRole } from "../../../src/models/enums/OfficerRole";
import { MaintainerRepository } from "../../../src/repositories/MaintainerRepository";
import { ReportRepository } from "../../../src/repositories/ReportRepository";
import { initializeTestDatabase, closeTestDatabase, clearDatabase } from "../../setup/test-datasource";
import { generateToken } from "../../../src/services/authService";

// Mock database e repo
jest.mock("../../../src/repositories/MaintainerRepository");
jest.mock("../../../src/repositories/ReportRepository");
jest.mock("../../../src/middlewares/authMiddleware", () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    if (!req.headers.authorization) return res.status(401).json({ error: "Unauthorized" });
    // Se il token contiene "pr", imposta il ruolo PR Officer
    if (req.headers.authorization.includes("pr")) {
      req.user = { id: 2, type: "officer", role: require("../../../src/models/enums/OfficerRole").OfficerRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER };
    } else {
      req.user = { id: 1, type: "officer", role: require("../../../src/models/enums/OfficerRole").OfficerRole.MUNICIPAL_ADMINISTRATOR };
    }
    next();
  },
  requireUserType: () => (req: any, res: any, next: any) => next(),
}));

const app = express();
app.use(express.json());
app.use("/maintainers", maintainerRouter);

describe("MaintainerRoutes Integration", () => {
  let adminToken: string;
  let prToken: string;
  let maintainerRepo: MaintainerRepository;

  beforeAll(async () => {
    await initializeTestDatabase();
    maintainerRepo = new MaintainerRepository();
    adminToken = generateToken({
      id: 1,
      username: "admin",
      type: OfficerRole.MUNICIPAL_ADMINISTRATOR,
      sessionType: "web"
    });
    prToken = generateToken({
      id: 2,
      username: "pr",
      type: OfficerRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER,
      sessionType: "web"
    });
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  describe("POST /maintainers", () => {
    it("dovrebbe creare un nuovo maintainer", async () => {
      (MaintainerRepository.prototype.createMaintainer as jest.Mock).mockResolvedValue({
        id: 1,
        name: "Mario",
        email: "mario@manutentori.com",
        password: "hashedpw",
        categories: [OfficeType.INFRASTRUCTURE],
        active: true
      });

      const res = await request(app)
        .post("/maintainers")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Mario",
          email: "mario@manutentori.com",
          password: "pw",
          categories: [OfficeType.INFRASTRUCTURE],
          active: true
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id");
      expect(res.body.name).toBe("Mario");
      expect(MaintainerRepository.prototype.createMaintainer).toHaveBeenCalled();
    });

    it("dovrebbe restituire errore 400 se mancano campi obbligatori", async () => {
      const res = await request(app)
        .post("/maintainers")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Mario" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("dovrebbe restituire errore 401 senza autenticazione", async () => {
      // Mock temporaneo che simula richiesta non autenticata
      jest.resetModules();
      jest.doMock("../../../src/middlewares/authMiddleware", () => ({
        authenticateToken: (req: any, res: any, next: any) => res.status(401).json({ error: "Unauthorized" }),
        requireUserType: () => (req: any, res: any, next: any) => next(),
      }));
      // Reimporta app e router dopo il nuovo mock
      const express = require("express");
      const { maintainerRouter } = require("../../../src/routes/MaintainerRoutes");
      const app = express();
      app.use(express.json());
      app.use("/maintainers", maintainerRouter);

      const res = await request(app)
        .post("/maintainers")
        .send({
          name: "Mario",
          email: "mario@manutentori.com",
          password: "pw",
          categories: [OfficeType.INFRASTRUCTURE],
          active: true
        });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /maintainers/admin", () => {
    it("dovrebbe restituire la lista di tutti i maintainer", async () => {
      (MaintainerRepository.prototype.getAllMaintainers as jest.Mock).mockResolvedValue([
        { id: 1, name: "Mario", email: "mario@manutentori.com", categories: [OfficeType.INFRASTRUCTURE], active: true }
      ]);

      const res = await request(app)
        .get("/maintainers/admin")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0]).toHaveProperty("name");
      expect(MaintainerRepository.prototype.getAllMaintainers).toHaveBeenCalled();
    });

    it("dovrebbe restituire errore 401 senza autenticazione", async () => {
      const res = await request(app)
        .get("/maintainers/admin");

      expect(res.status).toBe(401);
    });
  });

  describe("GET /maintainers/by-category/:officeType", () => {
    it("dovrebbe restituire i maintainer per categoria", async () => {
      (MaintainerRepository.prototype.getMaintainersByCategory as jest.Mock).mockResolvedValue([
        { id: 1, name: "Mario", categories: [OfficeType.INFRASTRUCTURE], active: true }
      ]);

      const res = await request(app)
        .get(`/maintainers/by-category/${OfficeType.INFRASTRUCTURE}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].categories).toContain(OfficeType.INFRASTRUCTURE);
      expect(MaintainerRepository.prototype.getMaintainersByCategory).toHaveBeenCalledWith(OfficeType.INFRASTRUCTURE);
    });

    it("dovrebbe restituire errore 400 se manca officeType", async () => {
      const res = await request(app)
        .get("/maintainers/by-category/")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404); // Route non trovata
    });

    it("dovrebbe permettere anche a PR Officer di accedere", async () => {
      (MaintainerRepository.prototype.getMaintainersByCategory as jest.Mock).mockResolvedValue([
        { id: 2, name: "Luigi", categories: [OfficeType.ENVIRONMENT], active: true }
      ]);

      const res = await request(app)
        .get(`/maintainers/by-category/${OfficeType.ENVIRONMENT}`)
        .set("Authorization", `Bearer ${prToken}`);

      expect(res.status).toBe(200);
      expect(res.body[0].categories).toContain(OfficeType.ENVIRONMENT);
    });
  });

  describe("PATCH /maintainers/:id", () => {
    it("dovrebbe aggiornare un maintainer", async () => {
      (MaintainerRepository.prototype.updateMaintainer as jest.Mock).mockResolvedValue({
        id: 1,
        name: "Mario Aggiornato",
        email: "mario@manutentori.com",
        categories: [OfficeType.INFRASTRUCTURE],
        active: false
      });

      const res = await request(app)
        .patch("/maintainers/1")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Mario Aggiornato", active: false });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Mario Aggiornato");
      expect(res.body.active).toBe(false);
      expect(MaintainerRepository.prototype.updateMaintainer).toHaveBeenCalledWith(1, { name: "Mario Aggiornato", active: false });
    });

    it("dovrebbe restituire errore 401 senza autenticazione", async () => {
      const res = await request(app)
        .patch("/maintainers/1")
        .send({ name: "Mario Aggiornato" });

      expect(res.status).toBe(401);
    });
  });

  //TODO: capire come cambiare la route da maintainers/assign-report a officers/assign-report (nello swagger è officers/assign-report) [cambiare quindi anche tutti i casi di test]
  describe("POST /officers/assign-report", () => {
    it("dovrebbe assegnare un report a un maintainer", async () => {
      (MaintainerRepository.prototype.getMaintainerById as jest.Mock).mockResolvedValue({
        id: 1,
        name: "Mario",
        categories: [OfficeType.INFRASTRUCTURE],
        active: true
      });

      // Mock anche getReportById e save
      (ReportRepository.prototype.getReportById as jest.Mock).mockResolvedValue({
        id: 1,
        assignedMaintainerId: null,
        state: "PENDING"
      });
      (ReportRepository.prototype.assignReportToMaintainer as jest.Mock).mockImplementation(async (reportId, maintainerId) => ({
        id: reportId,
        assignedMaintainerId: maintainerId,
        state: "ASSIGNED"
      }));

      const res = await request(app)
        .post("/officers/assign-report")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reportId: 1, maintainerId: 1 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");
    });

    it("dovrebbe restituire errore 401 senza autenticazione", async () => {
      const res = await request(app)
        .post("/officers/assign-report")
        .send({ reportId: 1, maintainerId: 1 });

      expect(res.status).toBe(401);
    });

    //? PT-24: test per report non PENDING
    it("dovrebbe restituire errore 400 se il report non è PENDING", async () => {
      (ReportRepository.prototype.getReportById as jest.Mock).mockResolvedValue({
        id: 1, assignedMaintainerId: null, state: "ASSIGNED"
      });
      (MaintainerRepository.prototype.getMaintainerById as jest.Mock).mockResolvedValue({
        id: 1, name: "Mario", categories: [OfficeType.INFRASTRUCTURE], active: true
      });

      const res = await request(app)
        .post("/officers/assign-report")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reportId: 1, maintainerId: 1 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    //? PT-24: test per maintainer non esistente
    it("dovrebbe restituire errore 404 se il maintainer non esiste", async () => {
      (ReportRepository.prototype.getReportById as jest.Mock).mockResolvedValue({
        id: 1, assignedMaintainerId: null, state: "PENDING"
      });
      (MaintainerRepository.prototype.getMaintainerById as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post("/officers/assign-report")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reportId: 1, maintainerId: 999 });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error");
    });

    //? PT-24: test per payload invalido
    it("dovrebbe restituire errore 400 se il payload è invalido", async () => {
      const res = await request(app)
        .post("/officers/assign-report")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reportId: "not-a-number" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("dovrebbe permettere anche a PR Officer di assegnare", async () => {
      (MaintainerRepository.prototype.getMaintainerById as jest.Mock).mockResolvedValue({
        id: 2,
        name: "Luigi",
        categories: [OfficeType.ENVIRONMENT],
        active: true
      });
      const assignReportMock = jest.fn().mockResolvedValue(undefined);
      (ReportRepository.prototype.assignReportToMaintainer as jest.Mock) = assignReportMock;

      // Mock temporaneo per autenticare come PR Officer
      const { OfficerRole } = require("../../../src/models/enums/OfficerRole");
      jest.spyOn(require("../../../src/middlewares/authMiddleware"), "authenticateToken")
        .mockImplementation((req: any, res: any, next: any) => {
          req.user = { type: "officer", role: OfficerRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER };
          next();
        });

      const res = await request(app)
        .post("/officers/assign-report")
        .set("Authorization", `Bearer ${prToken}`)
        .send({ reportId: 2, maintainerId: 2 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");
      expect(assignReportMock).toHaveBeenCalledWith(2, 2);
    });
  });

  describe("PATCH /maintainers/reports/:id/status", () => {
    it("dovrebbe aggiornare lo stato di un report assegnato al maintainer", async () => {
      // Mock della funzione controller PRIMA di importare router/app
      const controller = require("../../../src/controllers/maintainerController");
      controller.updateReportStatusByMaintainer = jest.fn().mockResolvedValue({ id: 1, state: "RESOLVED" });

      // Crea un'app e router locale dopo il mock
      const express = require("express");
      const { maintainerRouter } = require("../../../src/routes/MaintainerRoutes");
      const appLocal = express();
      appLocal.use(express.json());
      appLocal.use("/maintainers", maintainerRouter);

      const maintainerToken = generateToken({
        id: 1,
        username: "maintainer1",
        type: "officer",
        sessionType: "web"
      });

      const res = await request(appLocal)
        .patch("/maintainers/reports/1/status")
        .set("Authorization", `Bearer ${maintainerToken}`)
        .send({ id: 1, state: "RESOLVED", reason: "SOMETHING" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 1, state: "RESOLVED" });
      expect(controller.updateReportStatusByMaintainer).toHaveBeenCalledWith(1, 1, "RESOLVED", "SOMETHING");
    });

    it("dovrebbe restituire errore 401 se non autenticato", async () => {
      const res = await request(app)
        .patch("/maintainers/reports/1/status")
        .send({ state: "IN_PROGRESS" });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
    });

    it("dovrebbe restituire errore 400 se manca lo stato", async () => {
      const res = await request(app)
        .patch("/maintainers/reports/1/status")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

  });
});