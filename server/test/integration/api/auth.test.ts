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

  describe("POST /api/v1/auth/users - Login user", () => {
    it("should login an existing user with correct credentials", async () => {
      const username = "testuser";
      const firstName = "Test";
      const lastName = "User";
      const email = "testuser@example.com";
      const plainPassword = "Test@1234";

      await userRepo.createUser(username, firstName, lastName, email, plainPassword);
      const res = await request(app)
        .post("/api/v1/auth/users")
        .send({
          username,
          password: plainPassword
        });
      expect(res.status).toBe(200);
      expect(typeof res.body).toBe("string");
    });

    it("should fail to login with incorrect password", async () => {
      const username = "testuser2";
      const firstName = "Test2";
      const lastName = "User2";
      const email = "testuser2@example.com";
      const plainPassword = "Test@1234";

      await userRepo.createUser(username, firstName, lastName, email, plainPassword);
      const res = await request(app)
        .post("/api/v1/auth/users")
        .send({
          username,
          password: "WrongPassword"
        });
      expect(res.status).toBe(400); //!TODO change swagger
    });

    it("should fail to login a non-existing user", async () => {
      const res = await request(app)
        .post("/api/v1/auth/users")
        .send({
          username: "nonexistentuser",
          password: "SomePassword"
        });
      expect(res.status).toBe(400); //!TODO change swagger
    });
  });

  describe("POST /api/v1/auth/officers - Login officer", () => {
    it("should login an existing officer with correct credentials", async () => {
      // First, create an officer directly in the database
      const username = "testofficer";
      const name = "Officer";
      const surname = "Test";
      const email = "testofficer@example.com";  
      const plainPassword = "Officer@1234";

      await officerRepo.createOfficer(
        username,
        name,
        surname,
        email,
        plainPassword,
        OfficerRole.MUNICIPAL_ADMINISTRATOR,
        OfficeType.INFRASTRUCTURE
      );
      const res = await request(app)
        .post("/api/v1/auth/officers")
        .send({
          username,
          password: plainPassword
        });
      expect(res.status).toBe(200);
      expect(typeof res.body).toBe("string");
    });

    it("should fail to login officer with incorrect password", async () => {
      const username = "testofficer2";
      const name = "Officer2";
      const surname = "Test2";
      const email = "testofficer2@example.com";
      const plainPassword = "Officer@1234";

      await officerRepo.createOfficer(
        username,
        name,
        surname,
        email,
        plainPassword,
        OfficerRole.MUNICIPAL_ADMINISTRATOR,
        OfficeType.INFRASTRUCTURE
      );
      const res = await request(app)
        .post("/api/v1/auth/officers")
        .send({
          username,
          password: "WrongPassword"
        });
      expect(res.status).toBe(400); //!TODO change swagger
    });

    //? Should return 401 not 400?? 
    //? Because the officer does not exist, you have no authorization to access 
    //? so i think 401 is more appropriate
    it("should fail to login a non-existing officer", async () => {
      const res = await request(app)
        .post("/api/v1/auth/officers")
        .send({
          username: "nonexistofficer",
          password: "SomePassword"
        });
      expect(res.status).toBe(400); //!TODO: change swagger
    });
  });
}); 