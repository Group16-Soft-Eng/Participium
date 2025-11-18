import "reflect-metadata";
import request from "supertest";
import { app } from "../../../src/app";
import { initializeTestDatabase, closeTestDatabase, clearDatabase } from "../../setup/test-datasource";
import { UserRepository } from "../../../src/repositories/UserRepository";
import { generateToken } from "../../../src/services/authService";

describe("Users API Integration Tests", () => {
  let userRepo: UserRepository;
  let authToken: string;

  beforeAll(async () => {
    await initializeTestDatabase();
    userRepo = new UserRepository();
    
    // Crea un utente e genera un token per i test autenticati
    const user = await userRepo.createUser("testuser", "Test", "User", "test@example.com", "password123");
    authToken = generateToken({
      id: user.id,
      username: user.username,
      type: "user"
    });
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe("POST /users - Create User", () => {
    it("dovrebbe creare un nuovo utente con dati validi", async () => {
      const newUser = {
        username: "newuser",
        firstName: "Mario",
        lastName: "Rossi",
        email: "mario.rossi@example.com",
        password: "securePassword123"
      };

      const response = await request(app)
        .post("/users")
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.username).toBe(newUser.username);
      expect(response.body.firstName).toBe(newUser.firstName);
      expect(response.body.lastName).toBe(newUser.lastName);
      expect(response.body.email).toBe(newUser.email);
      expect(response.body).not.toHaveProperty("password"); // Password non deve essere esposta
    });

    it("dovrebbe restituire errore 400 con dati mancanti", async () => {
      const incompleteUser = {
        username: "newuser",
        firstName: "Mario"
        // mancano lastName, email, password
      };

      const response = await request(app)
        .post("/users")
        .send(incompleteUser);

      expect(response.status).toBe(400);
    });

    it("dovrebbe restituire errore 409 con username già esistente", async () => {
      await userRepo.createUser("duplicateuser", "Test", "User", "test1@example.com", "password123");

      const duplicateUser = {
        username: "duplicateuser",
        firstName: "Another",
        lastName: "User",
        email: "test2@example.com",
        password: "password456"
      };

      const response = await request(app)
        .post("/users")
        .send(duplicateUser);

      expect(response.status).toBe(409);
    });

    it("dovrebbe restituire errore 400 con email non valida", async () => {
      const invalidEmailUser = {
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        email: "invalid-email",
        password: "password123"
      };

      const response = await request(app)
        .post("/users")
        .send(invalidEmailUser);

      expect(response.status).toBe(400);
    });
  });

  describe("GET /users/logout - Logout User", () => {
    it("dovrebbe effettuare il logout con successo", async () => {
      const response = await request(app)
        .get("/users/logout")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    it("dovrebbe funzionare anche senza token (JWT stateless)", async () => {
      const response = await request(app)
        .get("/users/logout");

      // In un sistema JWT stateless, il logout è gestito lato client
      expect(response.status).toBe(200);
    });
  });
});
