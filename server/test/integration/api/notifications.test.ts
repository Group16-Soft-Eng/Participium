import "reflect-metadata";
import request from "supertest";
import { app } from "../../../src/app";
import { initializeTestDatabase, closeTestDatabase, clearDatabase } from "../../setup/test-datasource";
import { generateToken } from "../../../src/services/authService";

// Helper per creare un utente tramite API
async function createUser(username: string, name: string, surname: string, email: string, password: string) {
  const response = await request(app)
    .post("/api/v1/users")
    .send({ username, name, surname, email, password });
  return response.body;
}

describe ("Notifications API Integration Tests", () => {
  let userToken: string;
  let testUser: any;
    beforeAll(async () => {
    await initializeTestDatabase();
  });
    afterAll(async () => {
    await closeTestDatabase();
  });
    beforeEach(async () => {
    await clearDatabase();
        // Crea un utente per i test tramite API
    testUser = await createUser("testuser", "Mario", "Rossi", "testuser@example.com", "password123");
    userToken = generateToken({
      id: testUser.id,
      username: testUser.email,
      type: "user"
    });
 }); 

 describe("GET /notifications - List User Notifications", () => {
    it("should retrieve notifications for the authenticated user", async () => {
      const user = await createUser("user1", "Mario", "Rossi", "mario@test.com", "password123");
      
      // ✅ Assicurati che il token abbia il campo 'type: "user"'
      const userToken = generateToken({
        id: user.id,
        username: user.username,
        type: "user"  // ← IMPORTANTE: deve essere "user"
      });

      const response = await request(app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should return 401 for unauthenticated requests", async () => {
      const response = await request(app)
        .get("/api/v1/notifications");
      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /notifications/:id/read - Mark Notification as Read", () => {
    it("should mark a notification as read", async () => {
      // Prima crea una notifica per l'utente
      const createResponse = await request(app)
        .post("/api/v1/notifications")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ message: "Test Notification" });
      const notificationId = createResponse.body.id;
        const response = await request(app)
        .patch(`/api/v1/notifications/${notificationId}/read`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body.read).toBe(true);
    });

    it("should return 404 for non-existing notification", async () => {
      const response = await request(app)
        .patch("/api/v1/notifications/9999/read")
        .set("Authorization", `Bearer ${userToken}`);
      expect(response.status).toBe(404);
    });

    }); it("should return 401 for unauthenticated requests", async () => {
      const response = await request(app)
        .patch("/api/v1/notifications/1/read");
      expect(response.status).toBe(401);
    });
});



