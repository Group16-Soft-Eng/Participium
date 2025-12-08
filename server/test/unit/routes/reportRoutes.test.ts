import request from "supertest";
import express from "express";
import { reportRouter } from "../../../src/routes/ReportRoutes";
import * as reportController from "../../../src/controllers/reportController";
import { OfficerRole } from "../../../src/models/enums/OfficerRole";
import { OfficerRepository } from "../../../src/repositories/OfficerRepository";
import { ReportRepository } from "../../../src/repositories/ReportRepository";
import { NotificationRepository } from "../../../src/repositories/NotificationRepository";

jest.mock("../../../src/controllers/reportController");
jest.mock("../../../src/repositories/OfficerRepository");
jest.mock("../../../src/repositories/ReportRepository");
jest.mock("../../../src/repositories/NotificationRepository");
jest.mock("jsonwebtoken", () => ({
  verify: jest.fn((token, secret) => {
    if (token === "validOfficerToken") {
      return { id: 2, type: "officer" };
    }
    if (token === "validUserToken") {
      return { id: 1, type: "user" };
    }
    throw new Error("Invalid token");
  })
}));

const app = express();
app.use(express.json());
app.use("/reports", reportRouter);

describe("ReportRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /reports", () => {
    it("should upload a report and return 200", async () => {
      (reportController.uploadReport as jest.Mock).mockResolvedValue({ id: 1, title: "Test Report" });
      const res = await request(app)
        .post("/reports")
        .set("Authorization", "Bearer validUserToken")
        .field("title", "Test Report")
        .field("latitude", "45.0")
        .field("longitude", "9.0")
        .field("anonymity", "false")
        .field("category", "infrastructure")
        .field("description", "Test description");
      expect(reportController.uploadReport).toHaveBeenCalled();
      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Test Report");
    });

    it("should handle errors in uploadReport", async () => {
      (reportController.uploadReport as jest.Mock).mockRejectedValue(new Error("Upload error"));
      const res = await request(app)
        .post("/reports")
        .set("Authorization", "Bearer validUserToken")
        .field("title", "Test Report")
        .field("latitude", "45.0")
        .field("longitude", "9.0")
        .field("anonymity", "false")
        .field("category", "infrastructure")
        .field("description", "Test description");
      expect(res.status).toBe(500);
    });
  });

  describe("GET /reports", () => {
    it("should return all approved reports for unauthenticated user", async () => {
      (reportController.getReports as jest.Mock).mockResolvedValue([{ id: 1 }, { id: 2 }]);
      const res = await request(app).get("/reports");
      expect(reportController.getReports).toHaveBeenCalled();
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it("should return reports by office for authenticated officer", async () => {
      (OfficerRepository.prototype.getOfficerById as jest.Mock).mockResolvedValue({ office: "infrastructure" });
      (reportController.getReportsByOffice as jest.Mock).mockResolvedValue([{ id: 1, office: "infrastructure" }]);
      const res = await request(app)
        .get("/reports")
        .set("Authorization", "Bearer validOfficerToken");
      expect(OfficerRepository.prototype.getOfficerById).toHaveBeenCalledWith(2);
      expect(reportController.getReportsByOffice).toHaveBeenCalledWith("infrastructure");
      expect(res.status).toBe(200);
      expect(res.body[0].office).toBe("infrastructure");
    });

    it("should return all approved reports for authenticated user", async () => {
      (reportController.getReports as jest.Mock).mockResolvedValue([{ id: 1 }, { id: 2 }]);
      const res = await request(app)
        .get("/reports")
        .set("Authorization", "Bearer validUserToken");
      expect(reportController.getReports).toHaveBeenCalled();
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it("should return all approved reports if token is invalid", async () => {
      (reportController.getReports as jest.Mock).mockResolvedValue([{ id: 1 }, { id: 2 }]);
      const res = await request(app)
        .get("/reports")
        .set("Authorization", "Bearer invalidToken");
      expect(reportController.getReports).toHaveBeenCalled();
      expect(res.status).toBe(200);
    });

    it("should handle errors in getReports", async () => {
      (reportController.getReports as jest.Mock).mockRejectedValue(new Error("Get error"));
      const res = await request(app).get("/reports");
      expect(res.status).toBe(500);
    });
  });

  describe("POST /reports/:id/message", () => {
    it("should create officer message notification and return 201", async () => {
      (ReportRepository.prototype.getReportById as jest.Mock).mockResolvedValue({ id: 1, author: { id: 10 } });
      (NotificationRepository.prototype.createOfficerMessageNotification as jest.Mock).mockResolvedValue({
        id: 99,
        type: "OFFICER_MESSAGE",
        message: "Test message",
        reportId: 1
      });
      const res = await request(app)
        .post("/reports/1/message")
        .set("Authorization", "Bearer validOfficerToken")
        .send({ message: "Test message" });
      expect(ReportRepository.prototype.getReportById).toHaveBeenCalledWith(1);
      expect(NotificationRepository.prototype.createOfficerMessageNotification).toHaveBeenCalledWith(
        { id: 1, author: { id: 10 } },
        2,
        "Test message"
      );
      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Test message");
    });

    it("should return 400 if message is missing", async () => {
      const res = await request(app)
        .post("/reports/1/message")
        .set("Authorization", "Bearer validOfficerToken")
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("message is required");
    });

    it("should return 200 if notification not created (anonymous report)", async () => {
      (ReportRepository.prototype.getReportById as jest.Mock).mockResolvedValue({ id: 1, author: null });
      (NotificationRepository.prototype.createOfficerMessageNotification as jest.Mock).mockResolvedValue(null);
      const res = await request(app)
        .post("/reports/1/message")
        .set("Authorization", "Bearer validOfficerToken")
        .send({ message: "Test message" });
      expect(res.status).toBe(200);
      expect(res.body.info).toBe("No notification created (anonymous report).");
    });

    it("should handle errors in createOfficerMessageNotification", async () => {
      (ReportRepository.prototype.getReportById as jest.Mock).mockResolvedValue({ id: 1, author: { id: 10 } });
      (NotificationRepository.prototype.createOfficerMessageNotification as jest.Mock).mockRejectedValue(new Error("Message error"));
      const res = await request(app)
        .post("/reports/1/message")
        .set("Authorization", "Bearer validOfficerToken")
        .send({ message: "Test message" });
      expect(res.status).toBe(500);
    });
  });
});