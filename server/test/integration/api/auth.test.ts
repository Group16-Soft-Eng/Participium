import "reflect-metadata";
import request from "supertest";
import { app } from "../../../src/app";
import { initializeTestDatabase, closeTestDatabase, clearDatabase } from "../../setup/test-datasource";
import { UserRepository } from "../../../src/repositories/UserRepository";
import { OfficerRepository } from "../../../src/repositories/OfficerRepository";
import { OfficeType } from "../../../src/models/enums/OfficeType";
import { OfficerRole } from "../../../src/models/enums/OfficerRole";

describe("Auth API Integration Tests", () => {
  let userRepo: UserRepository;
  let officerRepo: OfficerRepository;

  beforeAll(async () => {
    await initializeTestDatabase();
    userRepo = new UserRepository();
    officerRepo = new OfficerRepository();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe("POST /auth/users - Login User", () => {
    it("dovrebbe effettuare il login con username e password corretti", async () => {
      // Crea un utente di test
      await userRepo.createUser("testuser", "Mario", "Rossi", "mario@test.com", "password123");

      const response = await request(app)
        .post("/auth/users")
        .send({
          username: "testuser",
          password: "password123"
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(typeof response.body.token).toBe("string");
    });

    it("dovrebbe restituire errore 401 con password errata", async () => {
      await userRepo.createUser("testuser", "Mario", "Rossi", "mario@test.com", "password123");

      const response = await request(app)
        .post("/auth/users")
        .send({
          username: "testuser",
          password: "wrongpassword"
        });

      expect(response.status).toBe(401);
    });

    it("dovrebbe restituire errore 404 con username inesistente", async () => {
      const response = await request(app)
        .post("/auth/users")
        .send({
          username: "nonexistent",
          password: "password123"
        });

      expect(response.status).toBe(404);
    });

    it("dovrebbe restituire errore 400 senza username", async () => {
      const response = await request(app)
        .post("/auth/users")
        .send({
          password: "password123"
        });

      expect(response.status).toBe(400);
    });

    it("dovrebbe restituire errore 400 senza password", async () => {
      const response = await request(app)
        .post("/auth/users")
        .send({
          username: "testuser"
        });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /auth/officers - Login Officer", () => {
    it("dovrebbe effettuare il login con email e password corretti", async () => {
      // Crea un officer di test
      await officerRepo.createOfficer(
        "officer1",
        "Luigi",
        "Bianchi",
        "luigi@office.com",
        "officer123",
        OfficerRole.ROLE_1,
        OfficeType.OFFICE_1
      );

      const response = await request(app)
        .post("/auth/officers")
        .send({
          username: "luigi@office.com",
          password: "officer123"
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(typeof response.body.token).toBe("string");
    });

    it("dovrebbe effettuare il login con username e password corretti", async () => {
      await officerRepo.createOfficer(
        "officer1",
        "Luigi",
        "Bianchi",
        "luigi@office.com",
        "officer123",
        OfficerRole.ROLE_1,
        OfficeType.OFFICE_1
      );

      const response = await request(app)
        .post("/auth/officers")
        .send({
          username: "officer1",
          password: "officer123"
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
    });

    it("dovrebbe restituire errore 401 con password errata", async () => {
      await officerRepo.createOfficer(
        "officer1",
        "Luigi",
        "Bianchi",
        "luigi@office.com",
        "officer123",
        OfficerRole.ROLE_1,
        OfficeType.OFFICE_1
      );

      const response = await request(app)
        .post("/auth/officers")
        .send({
          username: "luigi@office.com",
          password: "wrongpassword"
        });

      expect(response.status).toBe(401);
    });

    it("dovrebbe restituire errore 404 con email inesistente", async () => {
      const response = await request(app)
        .post("/auth/officers")
        .send({
          username: "nonexistent@office.com",
          password: "officer123"
        });

      expect(response.status).toBe(404);
    });
  });
});
