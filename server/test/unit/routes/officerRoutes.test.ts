import request from "supertest";
import express from "express";
import { officerRouter } from "../../../src/routes/OfficerRoutes";
import * as officerController from "../../../src/controllers/officerController";
import { OfficerRole } from "../../../src/models/enums/OfficerRole";

jest.mock("../../../src/controllers/officerController");
jest.mock("@dto/Officer", () => ({
  OfficerFromJSON: jest.fn((data) => data),
  OfficerToJSON: jest.fn((data) => data)
}));
jest.mock("@middlewares/authMiddleware", () => ({
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { id: 1, role: OfficerRole.MUNICIPAL_ADMINISTRATOR };
    next();
  }),
  requireUserType: jest.fn(() => (req: any, res: any, next: () => any) => next())
}));

const app = express();
app.use(express.json());
app.use("/officers", officerRouter);

describe("OfficerRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /officers", () => {
    it("should create officer and return 200", async () => {
      (officerController.createOfficer as jest.Mock).mockResolvedValue({ id: 1, email: "officer@comune.it" });
      const res = await request(app)
        .post("/officers")
        .send({ email: "officer@comune.it" });
      expect(officerController.createOfficer).toHaveBeenCalled();
      expect(res.status).toBe(200);
      expect(res.body.email).toBe("officer@comune.it");
    });

    it("should return 400 if email is missing", async () => {
      const res = await request(app)
        .post("/officers")
        .send({ name: "Mario" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("email is required");
    });

    it("should handle errors in createOfficer", async () => {
      (officerController.createOfficer as jest.Mock).mockRejectedValue(new Error("Create error"));
      const res = await request(app)
        .post("/officers")
        .send({ email: "officer@comune.it" });
      expect(res.status).toBe(500);
    });
  });

  describe("GET /officers/me", () => {
    it("should return user from req.user", async () => {
      const res = await request(app).get("/officers/me");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 1, role: OfficerRole.MUNICIPAL_ADMINISTRATOR });
    });

    it("should handle errors in /me", async () => {
      const appErr = express();
      appErr.use("/officers", (req, res, next) => { throw new Error("Me error"); }, officerRouter);
      const res = await request(appErr).get("/officers/me");
      expect(res.status).toBe(500);
    });
  });

  describe("GET /officers/OfficerByOfficeType/:officeType", () => {
    it("should return officers by officeType", async () => {
      (officerController.getAllOfficersByOfficeType as jest.Mock).mockResolvedValue([{ id: 1, office: "infrastructure" }]);
      const res = await request(app).get("/officers/OfficerByOfficeType/infrastructure");
      expect(officerController.getAllOfficersByOfficeType).toHaveBeenCalledWith("infrastructure");
      expect(res.status).toBe(200);
      expect(res.body[0].office).toBe("infrastructure");
    });

    it("should return 400 if officeType is missing", async () => {
      const res = await request(app).get("/officers/OfficerByOfficeType/");
      expect(res.status).toBe(404); // route param mancante, Express risponde 404
    });

    it("should handle errors in getAllOfficersByOfficeType", async () => {
      (officerController.getAllOfficersByOfficeType as jest.Mock).mockRejectedValue(new Error("OfficeType error"));
      const res = await request(app).get("/officers/OfficerByOfficeType/infrastructure");
      expect(res.status).toBe(500);
    });
  });

  describe("GET /officers/admin", () => {
    it("should return all officers", async () => {
      (officerController.getAllOfficers as jest.Mock).mockResolvedValue([{ id: 1 }, { id: 2 }]);
      const res = await request(app).get("/officers/admin");
      expect(officerController.getAllOfficers).toHaveBeenCalled();
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it("should handle errors in getAllOfficers", async () => {
      (officerController.getAllOfficers as jest.Mock).mockRejectedValue(new Error("Admin error"));
      const res = await request(app).get("/officers/admin");
      expect(res.status).toBe(500);
    });
  });

  describe("PATCH /officers", () => {
    it("should update officer", async () => {
      (officerController.updateOfficer as jest.Mock).mockResolvedValue({ id: 1, name: "Luigi" });
      const res = await request(app)
        .patch("/officers")
        .send({ id: 1, name: "Luigi" });
      expect(officerController.updateOfficer).toHaveBeenCalled();
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Luigi");
    });

    it("should handle errors in updateOfficer", async () => {
      (officerController.updateOfficer as jest.Mock).mockRejectedValue(new Error("Update error"));
      const res = await request(app)
        .patch("/officers")
        .send({ id: 1, name: "Luigi" });
      expect(res.status).toBe(500);
    });
  });

  describe("POST /officers/assign-report", () => {
    it("should assign report to officer", async () => {
      (officerController.assignReportToOfficer as jest.Mock).mockResolvedValue(undefined);
      const res = await request(app)
        .post("/officers/assign-report")
        .send({ reportId: 1, officerId: 2 });
      expect(officerController.assignReportToOfficer).toHaveBeenCalledWith(1, 2);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Report assigned successfully");
    });

    it("should handle errors in assignReportToOfficer", async () => {
      (officerController.assignReportToOfficer as jest.Mock).mockRejectedValue(new Error("Assign error"));
      const res = await request(app)
        .post("/officers/assign-report")
        .send({ reportId: 1, officerId: 2 });
      expect(res.status).toBe(500);
    });
  });

  describe("GET /officers/retrievedocs", () => {
    it("should retrieve docs for officer", async () => {
      (officerController.retrieveDocs as jest.Mock).mockResolvedValue([{ id: 1 }, { id: 2 }]);
      const res = await request(app).get("/officers/retrievedocs");
      expect(officerController.retrieveDocs).toHaveBeenCalledWith(1);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it("should handle errors in retrieveDocs", async () => {
      (officerController.retrieveDocs as jest.Mock).mockRejectedValue(new Error("Retrieve error"));
      const res = await request(app).get("/officers/retrievedocs");
      expect(res.status).toBe(500);
    });
  });

  describe("GET /officers/assigned", () => {
    it("should get all assigned reports for officer", async () => {
      (officerController.getAllAssignedReportsOfficer as jest.Mock).mockResolvedValue([{ id: 1 }, { id: 2 }]);
      const res = await request(app).get("/officers/assigned");
      expect(officerController.getAllAssignedReportsOfficer).toHaveBeenCalledWith(1);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it("should handle errors in getAllAssignedReportsOfficer", async () => {
      (officerController.getAllAssignedReportsOfficer as jest.Mock).mockRejectedValue(new Error("Assigned error"));
      const res = await request(app).get("/officers/assigned");
      expect(res.status).toBe(500);
    });
  });

  describe("PATCH /officers/reviewdocs/:id", () => {
    it("should review doc", async () => {
      (officerController.reviewDoc as jest.Mock).mockResolvedValue({ id: 1, state: "ASSIGNED" });
      const res = await request(app)
        .patch("/officers/reviewdocs/1")
        .send({ state: "ASSIGNED", reason: "Motivo" });
      expect(officerController.reviewDoc).toHaveBeenCalledWith(1, 1, "ASSIGNED", "Motivo");
      expect(res.status).toBe(200);
      expect(res.body.state).toBe("ASSIGNED");
    });

    it("should handle errors in reviewDoc", async () => {
      (officerController.reviewDoc as jest.Mock).mockRejectedValue(new Error("Review error"));
      const res = await request(app)
        .patch("/officers/reviewdocs/1")
        .send({ state: "ASSIGNED", reason: "Motivo" });
      expect(res.status).toBe(500);
    });
  });
});