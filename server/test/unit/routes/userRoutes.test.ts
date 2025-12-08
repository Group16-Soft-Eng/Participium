import request from "supertest";
import express from "express";
import { userRouter } from "../../../src/routes/UserRoutes";
import * as userController from "../../../src/controllers/userController";
import { authenticateToken } from "../../../src/middlewares/authMiddleware";
import { uploadAvatar } from "../../../src/middlewares/uploadMiddleware";

jest.mock("../../../src/controllers/userController");
jest.mock("../../../src/middlewares/authMiddleware", () => ({
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { id: 1, username: "testuser" };
    next();
  }),
  requireUserType: jest.fn((req, res, next) => next())
}));
jest.mock("../../../src/middlewares/uploadMiddleware", () => ({
  uploadAvatar: jest.fn((req, res, next) => next())
}));
jest.mock("@dto/User", () => ({
  UserFromJSON: jest.fn((data) => data)
}));

const app = express();
app.use(express.json());
app.use("/users", userRouter);

describe("UserRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /users/logout", () => {
    it("should call logoutUser and return 200", async () => {
      (userController.logoutUser as jest.Mock).mockResolvedValue(undefined);
      const res = await request(app).get("/users/logout");
      expect(userController.logoutUser).toHaveBeenCalled();
      expect(res.status).toBe(200);
    });

    it("should handle errors in logoutUser", async () => {
      (userController.logoutUser as jest.Mock).mockRejectedValue(new Error("Logout error"));
      const res = await request(app).get("/users/logout");
      expect(res.status).toBe(500);
    });
  });

  describe("POST /users", () => {
    it("should create a user and return 200", async () => {
      (userController.createUser as jest.Mock).mockResolvedValue({ id: 1, username: "testuser" });
      const res = await request(app)
        .post("/users")
        .send({ username: "testuser", password: "pw" });
      expect(userController.createUser).toHaveBeenCalled();
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 1, username: "testuser" });
    });

    it("should handle errors in createUser", async () => {
      (userController.createUser as jest.Mock).mockRejectedValue(new Error("Create error"));
      const res = await request(app)
        .post("/users")
        .send({ username: "testuser", password: "pw" });
      expect(res.status).toBe(500);
    });
  });

  describe("GET /users/me", () => {
    it("should return user profile", async () => {
      (userController.getMyProfile as jest.Mock).mockResolvedValue({ id: 1, username: "testuser" });
      const res = await request(app).get("/users/me");
      expect(userController.getMyProfile).toHaveBeenCalledWith(1);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 1, username: "testuser" });
    });

    it("should handle errors in getMyProfile", async () => {
      (userController.getMyProfile as jest.Mock).mockRejectedValue(new Error("Profile error"));
      const res = await request(app).get("/users/me");
      expect(res.status).toBe(500);
    });
  });

  describe("PATCH /users/me", () => {
    it("should update user profile", async () => {
      (userController.updateMyProfile as jest.Mock).mockResolvedValue({ id: 1, telegramUsername: "tg" });
      const res = await request(app)
        .patch("/users/me")
        .send({ telegramUsername: "tg", emailNotifications: "true" });
      expect(userController.updateMyProfile).toHaveBeenCalledWith(1, {
        telegramUsername: "tg",
        emailNotifications: true,
        avatarPath: undefined
      });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 1, telegramUsername: "tg" });
    });

    it("should handle errors in updateMyProfile", async () => {
      (userController.updateMyProfile as jest.Mock).mockRejectedValue(new Error("Update error"));
      const res = await request(app)
        .patch("/users/me")
        .send({ telegramUsername: "tg" });
      expect(res.status).toBe(500);
    });

    it("should handle avatar upload", async () => {
      (userController.updateMyProfile as jest.Mock).mockResolvedValue({ id: 1, avatarPath: "/uploads/avatars/avatar.png" });
      const res = await request(app)
        .patch("/users/me")
        .send({ telegramUsername: "tg" });
      expect(res.status).toBe(200);
      expect(res.body.avatarPath).toBe("/uploads/avatars/avatar.png");
    });
  });

  describe("GET /users/me/info", () => {
    it("should return user info from req.user", async () => {
      const res = await request(app).get("/users/me/info");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 1, username: "testuser" });
    });

    it("should handle errors in /me/info", async () => {
      // Simula errore nel middleware
      const appErr = express();
      appErr.use("/users", (req, res, next) => {
        throw new Error("Info error");
      }, userRouter);
      const res = await request(appErr).get("/users/me/info");
      expect(res.status).toBe(500);
    });
  });
});