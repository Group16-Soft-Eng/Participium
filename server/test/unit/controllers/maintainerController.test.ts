import * as maintainerController from "../../../src/controllers/maintainerController";
import { MaintainerRepository } from "../../../src/repositories/MaintainerRepository";
import { ReportRepository } from "../../../src/repositories/ReportRepository";
import { OfficeType } from "../../../src/models/enums/OfficeType";
import { ReportState } from "../../../src/models/enums/ReportState";

// Mock delle repository
jest.mock("../../../src/repositories/MaintainerRepository");
jest.mock("../../../src/repositories/ReportRepository");
jest.mock("../../../src/services/mapperService", () => ({
  mapReportDAOToDTO: jest.fn()
}));

describe("maintainerController", () => {
  const maintainerMock = {
    id: 1,
    name: "Test Maintainer",
    email: "test@example.com",
    password: "hashedPassword",
    categories: [OfficeType.INFRASTRUCTURE],
    active: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createMaintainer", () => {
    it("should create a new maintainer", async () => {
      (MaintainerRepository.prototype.createMaintainer as jest.Mock).mockResolvedValue(maintainerMock);

      const result = await maintainerController.createMaintainer(
        maintainerMock.name,
        maintainerMock.email,
        "plainPassword",
        maintainerMock.categories,
        maintainerMock.active
      );

      expect(MaintainerRepository.prototype.createMaintainer).toHaveBeenCalledWith(
        maintainerMock.name,
        maintainerMock.email,
        "plainPassword",
        maintainerMock.categories,
        maintainerMock.active
      );
      expect(result).toEqual(maintainerMock);
    });
  });

  describe("getMaintainersByCategory", () => {
    it("should return maintainers by category", async () => {
      (MaintainerRepository.prototype.getMaintainersByCategory as jest.Mock).mockResolvedValue([maintainerMock]);

      const result = await maintainerController.getMaintainersByCategory(OfficeType.INFRASTRUCTURE);

      expect(MaintainerRepository.prototype.getMaintainersByCategory).toHaveBeenCalledWith(OfficeType.INFRASTRUCTURE);
      expect(result).toEqual([maintainerMock]);
    });
  });

  describe("getAllMaintainers", () => {
    it("should return all maintainers", async () => {
      (MaintainerRepository.prototype.getAllMaintainers as jest.Mock).mockResolvedValue([maintainerMock]);

      const result = await maintainerController.getAllMaintainers();

      expect(MaintainerRepository.prototype.getAllMaintainers).toHaveBeenCalled();
      expect(result).toEqual([maintainerMock]);
    });
  });

  describe("getMaintainerById", () => {
    it("should return maintainer by id", async () => {
      (MaintainerRepository.prototype.getMaintainerById as jest.Mock).mockResolvedValue(maintainerMock);

      const result = await maintainerController.getMaintainerById(1);

      expect(MaintainerRepository.prototype.getMaintainerById).toHaveBeenCalledWith(1);
      expect(result).toEqual(maintainerMock);
    });
  });

  describe("getMaintainerByEmail", () => {
    it("should return maintainer by email", async () => {
      (MaintainerRepository.prototype.getMaintainerByEmail as jest.Mock).mockResolvedValue(maintainerMock);

      const result = await maintainerController.getMaintainerByEmail("test@example.com");

      expect(MaintainerRepository.prototype.getMaintainerByEmail).toHaveBeenCalledWith("test@example.com");
      expect(result).toEqual(maintainerMock);
    });
  });

  describe("updateMaintainer", () => {
    it("should update maintainer fields", async () => {
      const updatedMaintainer = { ...maintainerMock, name: "Updated" };
      (MaintainerRepository.prototype.updateMaintainer as jest.Mock).mockResolvedValue(updatedMaintainer);

      const result = await maintainerController.updateMaintainer(1, { name: "Updated" });

      expect(MaintainerRepository.prototype.updateMaintainer).toHaveBeenCalledWith(1, { name: "Updated" });
      expect(result).toEqual(updatedMaintainer);
    });
  });

  describe("assignReportToMaintainer", () => {
    it("should assign a report to a maintainer if report is PENDING and maintainer exists", async () => {
      const reportMock = { id: 10, state: ReportState.PENDING };
      (ReportRepository.prototype.getReportById as jest.Mock).mockResolvedValue(reportMock);
      (MaintainerRepository.prototype.getMaintainerById as jest.Mock).mockResolvedValue(maintainerMock);
      (ReportRepository.prototype.assignReportToMaintainer as jest.Mock).mockResolvedValue(undefined);

      await maintainerController.assignReportToMaintainer(10, 1);

      expect(ReportRepository.prototype.getReportById).toHaveBeenCalledWith(10);
      expect(MaintainerRepository.prototype.getMaintainerById).toHaveBeenCalledWith(1);
      expect(ReportRepository.prototype.assignReportToMaintainer).toHaveBeenCalledWith(10, 1);
    });

    it("should throw error if report is not PENDING", async () => {
      const reportMock = { id: 10, state: ReportState.ASSIGNED };
      (ReportRepository.prototype.getReportById as jest.Mock).mockResolvedValue(reportMock);

      await expect(maintainerController.assignReportToMaintainer(10, 1))
        .rejects
        .toThrow("Only PENDING reports can be assigned");
    });

    it("should throw error if maintainer does not exist", async () => {
      const reportMock = { id: 10, state: ReportState.PENDING };
      (ReportRepository.prototype.getReportById as jest.Mock).mockResolvedValue(reportMock);
      (MaintainerRepository.prototype.getMaintainerById as jest.Mock).mockResolvedValue(null);

      await expect(maintainerController.assignReportToMaintainer(10, 1))
        .rejects
        .toThrow("Maintainer not found");
    });
  });

  describe("updateReportStatusByMaintainer", () => {
    const reportMock = {
      id: 10,
      assignedMaintainerId: 1,
      state: ReportState.ASSIGNED,
      body: "body",
      type: "type",
      url: "url"
    };
    const updatedReportMock = {
      ...reportMock,
      state: ReportState.IN_PROGRESS
    };
    const notificationMock = { id: 99, message: "Stato cambiato" };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should update report status and return mapped DTO", async () => {
      (ReportRepository.prototype.getReportById as jest.Mock).mockResolvedValue(reportMock);
      (ReportRepository.prototype.updateReportState as jest.Mock).mockResolvedValue(updatedReportMock);
      const notificationRepo = require("../../../src/repositories/NotificationRepository");
      notificationRepo.NotificationRepository.prototype.createStatusChangeNotification = jest.fn().mockResolvedValue(notificationMock);

      const { mapReportDAOToDTO } = require("../../../src/services/mapperService");
      mapReportDAOToDTO.mockReturnValue({ ...updatedReportMock, mapped: true });

      const result = await maintainerController.updateReportStatusByMaintainer(
        1, 10, ReportState.IN_PROGRESS
      );
      expect(ReportRepository.prototype.getReportById).toHaveBeenCalledWith(10);
      expect(ReportRepository.prototype.updateReportState).toHaveBeenCalledWith(10, ReportState.IN_PROGRESS, undefined);
      expect(notificationRepo.NotificationRepository.prototype.createStatusChangeNotification).toHaveBeenCalledWith(updatedReportMock);
      expect(result).toEqual({ ...updatedReportMock, mapped: true });
    });

    it("should throw error if report is not assigned to maintainer", async () => {
      (ReportRepository.prototype.getReportById as jest.Mock).mockResolvedValue({ ...reportMock, assignedMaintainerId: 2 });
      await expect(
        maintainerController.updateReportStatusByMaintainer(1, 10, ReportState.IN_PROGRESS)
      ).rejects.toThrow("You can only update reports assigned to you as maintainer");
    });

    it("should throw error if nextState is not allowed", async () => {
      (ReportRepository.prototype.getReportById as jest.Mock).mockResolvedValue(reportMock);
      await expect(
        maintainerController.updateReportStatusByMaintainer(1, 10, ReportState.PENDING)
      ).rejects.toThrow("Invalid target state for maintainer");
    });

    it("should throw error if report is not in operational state", async () => {
      (ReportRepository.prototype.getReportById as jest.Mock).mockResolvedValue({ ...reportMock, state: ReportState.PENDING });
      await expect(
        maintainerController.updateReportStatusByMaintainer(1, 10, ReportState.IN_PROGRESS)
      ).rejects.toThrow("Report is not in an operational state");
    });

    it("should throw error if report is already resolved or declined", async () => {
      (ReportRepository.prototype.getReportById as jest.Mock).mockResolvedValue({ ...reportMock, state: ReportState.RESOLVED });
      await expect(
        maintainerController.updateReportStatusByMaintainer(1, 10, ReportState.IN_PROGRESS)
      ).rejects.toThrow(/already in state 'RESOLVED'/);
    });

    it("should throw error if notification creation fails", async () => {
      (ReportRepository.prototype.getReportById as jest.Mock).mockResolvedValue(reportMock);
      (ReportRepository.prototype.updateReportState as jest.Mock).mockResolvedValue(updatedReportMock);
      const notificationRepo = require("../../../src/repositories/NotificationRepository");
      notificationRepo.NotificationRepository.prototype.createStatusChangeNotification = jest.fn().mockResolvedValue(null);

      await expect(
        maintainerController.updateReportStatusByMaintainer(1, 10, ReportState.IN_PROGRESS)
      ).rejects.toThrow("Failed to create notification for report status change");
    });
  });
});