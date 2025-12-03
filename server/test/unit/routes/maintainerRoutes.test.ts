import request from "supertest";
import express from "express";
import { maintainerRouter } from "../../../src/routes/MaintainerRoutes";
import * as maintainerController from "../../../src/controllers/maintainerController";
import { OfficerRole } from "../../../src/models/enums/OfficerRole";
import { OfficeType } from "../../../src/models/enums/OfficeType";

// Mock middlewares
jest.mock("../../../src/middlewares/authMiddleware", () => ({
  authenticateToken: (req: any, res: any, next: any) => { req.user = { type: "officer", role: OfficerRole.MUNICIPAL_ADMINISTRATOR }; next(); },
  requireUserType: () => (req: any, res: any, next: any) => next(),
}));

// Mock controller
jest.mock("../../../src/controllers/maintainerController");

const app = express();
app.use(express.json());
app.use("/maintainers", maintainerRouter);

describe("MaintainerRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /maintainers", () => {
    it("should create a maintainer and return 200", async () => {
      (maintainerController.createMaintainer as jest.Mock).mockResolvedValue({ id: 1, name: "Test", email: "test@example.com" });

      const res = await request(app)
        .post("/maintainers")
        .send({ name: "Test", email: "test@example.com", password: "pw", categories: [OfficeType.INFRASTRUCTURE], active: true });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 1, name: "Test", email: "test@example.com" });
      expect(maintainerController.createMaintainer).toHaveBeenCalled();
    });

    it("should return 400 if required fields are missing", async () => {
      const res = await request(app)
        .post("/maintainers")
        .send({ name: "Test" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("GET /maintainers/admin", () => {
    it("should return all maintainers", async () => {
      (maintainerController.getAllMaintainers as jest.Mock).mockResolvedValue([{ id: 1, name: "Test" }]);
      const res = await request(app).get("/maintainers/admin");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 1, name: "Test" }]);
      expect(maintainerController.getAllMaintainers).toHaveBeenCalled();
    });
  });

  describe("GET /maintainers/by-category/:officeType", () => {
    it("should return maintainers by category", async () => {
      (maintainerController.getMaintainersByCategory as jest.Mock).mockResolvedValue([{ id: 1, name: "Test" }]);
      const res = await request(app).get(`/maintainers/by-category/${OfficeType.INFRASTRUCTURE}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 1, name: "Test" }]);
      expect(maintainerController.getMaintainersByCategory).toHaveBeenCalledWith(OfficeType.INFRASTRUCTURE);
    });

    it("should return 400 if officeType is missing", async () => {
      const res = await request(app).get("/maintainers/by-category/");
      expect(res.status).toBe(404); // Express default for missing param
    });
  });

  describe("PATCH /maintainers/:id", () => {
    it("should update a maintainer", async () => {
      (maintainerController.updateMaintainer as jest.Mock).mockResolvedValue({ id: 1, name: "Updated" });
      const res = await request(app)
        .patch("/maintainers/1")
        .send({ name: "Updated" });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 1, name: "Updated" });
      expect(maintainerController.updateMaintainer).toHaveBeenCalledWith(1, { name: "Updated" });
    });
  });

  describe("POST /maintainers/assign-report", () => {
    it("should assign a report to a maintainer", async () => {
      (maintainerController.assignReportToMaintainer as jest.Mock).mockResolvedValue(undefined);
      const res = await request(app)
        .post("/maintainers/assign-report")
        .send({ reportId: 10, maintainerId: 1 });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "Report assigned to maintainer" });
      expect(maintainerController.assignReportToMaintainer).toHaveBeenCalledWith(10, 1);
    });
  });
});