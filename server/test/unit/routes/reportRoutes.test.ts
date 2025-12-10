import request from "supertest";
import express from "express";
import { reportRouter } from "../../../src/routes/ReportRoutes";
import * as reportController from "../../../src/controllers/reportController";
import { ReportRepository } from "../../../src/repositories/ReportRepository";
import { NotificationRepository } from "../../../src/repositories/NotificationRepository";
import { OfficerRole } from "../../../src/models/enums/OfficerRole";
import { OfficeType } from "../../../src/models/enums/OfficeType";
import { ReportState } from "../../../src/models/enums/ReportState";

// Mock middlewares
jest.mock("../../../src/middlewares/authMiddleware", () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: 1, type: "user" };
    next();
  },
  requireUserType: (types: any[]) => (req: any, res: any, next: any) => {
    // Simula il controllo del tipo di utente
    if (types.includes(req.user?.type) || types.some((t: any) => req.user?.type?.includes?.(t))) {
      next();
    } else {
      res.status(403).json({ error: "Forbidden" });
    }
  },
}));

jest.mock("../../../src/middlewares/uploadMiddleware", () => ({
  uploadPhotos: (req: any, res: any, next: any) => {
    // Simula il caricamento di file
    req.files = req.files || [];
    next();
  },
}));

// Mock controller
jest.mock("../../../src/controllers/reportController");

// Mock repositories
jest.mock("../../../src/repositories/ReportRepository");
jest.mock("../../../src/repositories/NotificationRepository");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/reports", reportRouter);

// Error handler middleware
app.use((err: any, req: any, res: any, next: any) => {
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

describe("ReportRoutes", () => {
  let mockReportRepo: jest.Mocked<ReportRepository>;
  let mockNotificationRepo: jest.Mocked<NotificationRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReportRepo = {
      getReportById: jest.fn(),
      getApprovedReports: jest.fn(),
    } as any;

    mockNotificationRepo = {
      createOfficerMessageNotification: jest.fn(),
    } as any;

    (ReportRepository as jest.Mock).mockImplementation(() => mockReportRepo);
    (NotificationRepository as jest.Mock).mockImplementation(() => mockNotificationRepo);
  });

  // ===================== POST /reports =====================
  describe("POST /reports", () => {
    it("should upload a report successfully with all fields", async () => {
      const mockReport = {
        id: 1,
        title: "Test Report",
        category: OfficeType.INFRASTRUCTURE,
        anonymity: false,
        state: ReportState.PENDING,
      };

      (reportController.uploadReport as jest.Mock).mockResolvedValue(mockReport);

      const res = await request(app)
        .post("/reports")
        .send({
          title: "Test Report",
          category: OfficeType.INFRASTRUCTURE,
          description: "Test description",
          latitude: "45.0703",
          longitude: "7.6869",
          anonymity: false,
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockReport);
      expect(reportController.uploadReport).toHaveBeenCalled();
    });

    it("should upload anonymous report", async () => {
      const mockReport = {
        id: 2,
        title: "Anonymous Report",
        category: OfficeType.SAFETY,
        anonymity: true,
        state: ReportState.PENDING,
      };

      (reportController.uploadReport as jest.Mock).mockResolvedValue(mockReport);

      const res = await request(app)
        .post("/reports")
        .send({
          title: "Anonymous Report",
          category: OfficeType.SAFETY,
          description: "Anonymous description",
          anonymity: "1",
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockReport);
      expect(reportController.uploadReport).toHaveBeenCalledWith(
        expect.objectContaining({
          anonymity: true,
        }),
        expect.any(Array),
        1
      );
    });

    it("should upload report with anonymity as true boolean", async () => {
      const mockReport = {
        id: 3,
        title: "Test Report",
        category: OfficeType.ENVIRONMENT,
        anonymity: true,
      };

      (reportController.uploadReport as jest.Mock).mockResolvedValue(mockReport);

      const res = await request(app)
        .post("/reports")
        .send({
          title: "Test Report",
          category: OfficeType.ENVIRONMENT,
          anonymity: true,
        });

      expect(res.status).toBe(200);
      expect(reportController.uploadReport).toHaveBeenCalledWith(
        expect.objectContaining({
          anonymity: true,
        }),
        expect.any(Array),
        1
      );
    });

    it("should upload report with anonymity as string 'true'", async () => {
      const mockReport = {
        id: 4,
        title: "Test Report",
        category: OfficeType.SANITATION,
        anonymity: true,
      };

      (reportController.uploadReport as jest.Mock).mockResolvedValue(mockReport);

      const res = await request(app)
        .post("/reports")
        .send({
          title: "Test Report",
          category: OfficeType.SANITATION,
          anonymity: "true",
        });

      expect(res.status).toBe(200);
      expect(reportController.uploadReport).toHaveBeenCalledWith(
        expect.objectContaining({
          anonymity: true,
        }),
        expect.any(Array),
        1
      );
    });

    it("should upload report with coordinates", async () => {
      const mockReport = {
        id: 5,
        title: "Report with location",
        category: OfficeType.TRANSPORT,
      };

      (reportController.uploadReport as jest.Mock).mockResolvedValue(mockReport);

      const res = await request(app)
        .post("/reports")
        .send({
          title: "Report with location",
          category: OfficeType.TRANSPORT,
          latitude: "45.1234",
          longitude: "7.5678",
        });

      expect(res.status).toBe(200);
      expect(reportController.uploadReport).toHaveBeenCalledWith(
        expect.objectContaining({
          location: {
            Coordinates: {
              latitude: 45.1234,
              longitude: 7.5678,
            },
          },
        }),
        expect.any(Array),
        1
      );
    });

    it("should upload report without coordinates when not provided", async () => {
      const mockReport = {
        id: 6,
        title: "Report without location",
        category: OfficeType.OTHER,
      };

      (reportController.uploadReport as jest.Mock).mockResolvedValue(mockReport);

      const res = await request(app)
        .post("/reports")
        .send({
          title: "Report without location",
          category: OfficeType.OTHER,
        });

      expect(res.status).toBe(200);
      expect(reportController.uploadReport).toHaveBeenCalledWith(
        expect.objectContaining({
          location: undefined,
        }),
        expect.any(Array),
        1
      );
    });

    it("should upload report without coordinates when only latitude provided", async () => {
      const mockReport = {
        id: 7,
        title: "Partial location",
        category: OfficeType.INFRASTRUCTURE,
      };

      (reportController.uploadReport as jest.Mock).mockResolvedValue(mockReport);

      const res = await request(app)
        .post("/reports")
        .send({
          title: "Partial location",
          category: OfficeType.INFRASTRUCTURE,
          latitude: "45.1234",
        });

      expect(res.status).toBe(200);
      expect(reportController.uploadReport).toHaveBeenCalledWith(
        expect.objectContaining({
          location: undefined,
        }),
        expect.any(Array),
        1
      );
    });

    it("should upload report without coordinates when only longitude provided", async () => {
      const mockReport = {
        id: 8,
        title: "Partial location",
        category: OfficeType.INFRASTRUCTURE,
      };

      (reportController.uploadReport as jest.Mock).mockResolvedValue(mockReport);

      const res = await request(app)
        .post("/reports")
        .send({
          title: "Partial location",
          category: OfficeType.INFRASTRUCTURE,
          longitude: "7.5678",
        });

      expect(res.status).toBe(200);
      expect(reportController.uploadReport).toHaveBeenCalledWith(
        expect.objectContaining({
          location: undefined,
        }),
        expect.any(Array),
        1
      );
    });

    it("should handle controller errors", async () => {
      (reportController.uploadReport as jest.Mock).mockRejectedValue(new Error("Upload failed"));

      const res = await request(app)
        .post("/reports")
        .send({
          title: "Test Report",
          category: OfficeType.INFRASTRUCTURE,
        });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error");
    });

    it("should pass userId from authenticated user", async () => {
      const mockReport = { id: 9, title: "Test" };
      (reportController.uploadReport as jest.Mock).mockResolvedValue(mockReport);

      await request(app)
        .post("/reports")
        .send({
          title: "Test",
          category: OfficeType.INFRASTRUCTURE,
        });

      expect(reportController.uploadReport).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Array),
        1 // userId from mock
      );
    });
  });

  // ===================== GET /reports =====================
  describe("GET /reports", () => {
    it("should return all reports with status 200", async () => {
      const mockReports = [
        { id: 1, title: "Report 1", state: ReportState.ASSIGNED },
        { id: 2, title: "Report 2", state: ReportState.IN_PROGRESS },
      ];

      (reportController.getReports as jest.Mock).mockResolvedValue(mockReports);

      const res = await request(app).get("/reports");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockReports);
      expect(reportController.getReports).toHaveBeenCalled();
    });

    it("should return empty array if no reports exist", async () => {
      (reportController.getReports as jest.Mock).mockResolvedValue([]);

      const res = await request(app).get("/reports");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should handle controller errors", async () => {
      (reportController.getReports as jest.Mock).mockRejectedValue(new Error("Database error"));

      const res = await request(app).get("/reports");

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error");
    });
  });
});