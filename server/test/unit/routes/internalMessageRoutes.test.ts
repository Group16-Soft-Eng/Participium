import request from "supertest";
import express from "express";
import { internalMessageRouter } from "../../../src/routes/InternalMessageRoutes";
import * as internalMessageController from "../../../src/controllers/internalMessageController";
import { OfficerRole } from "../../../src/models/enums/OfficerRole";

// Mock middlewares
jest.mock("../../../src/middlewares/authMiddleware", () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: 1, type: OfficerRole.TECHNICAL_OFFICE_STAFF };
    next();
  },
  requireUserType: () => (req: any, res: any, next: any) => next(),
}));

// Mock controller
jest.mock("../../../src/controllers/internalMessageController");

const app = express();
app.use(express.json());
app.use("/internal-messages", internalMessageRouter);

describe("InternalMessageRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /internal-messages/report/:reportId", () => {
    it("should return conversation for a report", async () => {
      const mockConversation = [
        { id: 1, reportId: 1, message: "Test message", senderType: OfficerRole.TECHNICAL_OFFICE_STAFF, senderId: 1 },
        { id: 2, reportId: 1, message: "Reply message", senderType: OfficerRole.MAINTAINER, senderId: 2 }
      ];
      (internalMessageController.listConversation as jest.Mock).mockResolvedValue(mockConversation);

      const res = await request(app).get("/internal-messages/report/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockConversation);
      expect(internalMessageController.listConversation).toHaveBeenCalledWith(1);
    });

    it("should handle errors from controller", async () => {
      (internalMessageController.listConversation as jest.Mock).mockRejectedValue(new Error("Test error"));

      const res = await request(app).get("/internal-messages/report/1");

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("POST /internal-messages", () => {
    it("should send internal message from technical officer", async () => {
      const mockMessage = {
        id: 1,
        reportId: 1,
        senderType: OfficerRole.TECHNICAL_OFFICE_STAFF,
        senderId: 1,
        receiverType: OfficerRole.MAINTAINER,
        receiverId: 2,
        message: "Test message"
      };
      (internalMessageController.sendInternalMessage as jest.Mock).mockResolvedValue(mockMessage);

      const res = await request(app)
        .post("/internal-messages")
        .send({
          reportId: 1,
          message: "Test message",
          receiverType: OfficerRole.MAINTAINER,
          receiverId: 2
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("message");
      expect(internalMessageController.sendInternalMessage).toHaveBeenCalledWith(
        1,
        { type: OfficerRole.TECHNICAL_OFFICE_STAFF, id: 1 },
        { type: OfficerRole.MAINTAINER, id: 2 },
        "Test message"
      );
    });

    it("should send internal message from maintainer", async () => {
      const mockMessage = {
        id: 2,
        reportId: 1,
        senderType: OfficerRole.MAINTAINER,
        senderId: 2,
        receiverType: OfficerRole.TECHNICAL_OFFICE_STAFF,
        receiverId: 1,
        message: "Reply message"
      };
      (internalMessageController.sendInternalMessage as jest.Mock).mockResolvedValue(mockMessage);

      // Crea app locale con middleware che imposta user come maintainer
      const appLocal = express();
      appLocal.use(express.json());
      appLocal.use((req: any, res: any, next: any) => {
        req.user = { id: 2, type: OfficerRole.MAINTAINER };
        next();
      });
      appLocal.use("/internal-messages", internalMessageRouter);

      const res = await request(appLocal)
        .post("/internal-messages")
        .send({
          reportId: 1,
          message: "Reply message",
          receiverType: OfficerRole.TECHNICAL_OFFICE_STAFF,
          receiverId: 1
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("message");
    //   expect(internalMessageController.sendInternalMessage).toHaveBeenCalledWith(
    //     1,
    //     { type: OfficerRole.MAINTAINER, id: 2 },
    //     { type: OfficerRole.TECHNICAL_OFFICE_STAFF, id: 1 },
    //     "Reply message"
    //   );
    });

    it("should handle user with multiple types (array)", async () => {
      // Mock user with array of types
      const appWithMultipleTypes = express();
      appWithMultipleTypes.use(express.json());
      appWithMultipleTypes.use("/internal-messages", (req: any, res: any, next: any) => {
        req.user = { id: 1, type: [OfficerRole.MAINTAINER, OfficerRole.TECHNICAL_OFFICE_STAFF] };
        next();
      }, internalMessageRouter);

      const mockMessage = {
        id: 3,
        reportId: 1,
        senderType: OfficerRole.MAINTAINER,
        senderId: 1,
        message: "Test"
      };
      (internalMessageController.sendInternalMessage as jest.Mock).mockResolvedValue(mockMessage);

      const res = await request(appWithMultipleTypes)
        .post("/internal-messages")
        .send({
          reportId: 1,
          message: "Test",
          receiverType: OfficerRole.TECHNICAL_OFFICE_STAFF,
          receiverId: 2
        });

      expect(res.status).toBe(201);
    //   expect(internalMessageController.sendInternalMessage).toHaveBeenCalledWith(
    //     1,
    //     { type: OfficerRole.MAINTAINER, id: 1 },
    //     { type: OfficerRole.TECHNICAL_OFFICE_STAFF, id: 2 },
    //     "Test"
    //   );
    });

    it("should handle errors from controller", async () => {
      (internalMessageController.sendInternalMessage as jest.Mock).mockRejectedValue(new Error("Test error"));

      const res = await request(app)
        .post("/internal-messages")
        .send({
          reportId: 1,
          message: "Test message",
          receiverType: OfficerRole.MAINTAINER,
          receiverId: 2
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});