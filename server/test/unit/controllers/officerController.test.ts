import "reflect-metadata";
import { 
  createOfficer, 
  getOfficer, 
  getAllOfficers, 
  assignReportToOfficer,
  retrieveDocs,
  reviewDoc 
} from "../../../src/controllers/officerController";
import { OfficerRepository } from "../../../src/repositories/OfficerRepository";
import { ReportRepository } from "../../../src/repositories/ReportRepository";
import { mapOfficerDAOToDTO, mapReportDAOToDTO } from "../../../src/services/mapperService";
import { ReportState } from "../../../src/models/enums/ReportState";
import { OfficeType } from "../../../src/models/enums/OfficeType";
import { OfficerRole } from "../../../src/models/enums/OfficerRole";

// Mock dei moduli
jest.mock("../../../src/repositories/OfficerRepository");
jest.mock("../../../src/repositories/ReportRepository");
jest.mock("../../../src/services/mapperService");

describe("OfficerController Unit Tests", () => {
  let mockOfficerRepo: jest.Mocked<OfficerRepository>;
  let mockReportRepo: jest.Mocked<ReportRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockOfficerRepo = new OfficerRepository() as jest.Mocked<OfficerRepository>;
    mockReportRepo = new ReportRepository() as jest.Mocked<ReportRepository>;
    
    (OfficerRepository as jest.MockedClass<typeof OfficerRepository>).mockImplementation(() => mockOfficerRepo);
    (ReportRepository as jest.MockedClass<typeof ReportRepository>).mockImplementation(() => mockReportRepo);
  });

  describe("createOfficer", () => {
    it("dovrebbe creare un nuovo officer con successo", async () => {
      const officerDto = {
        username: "officer1",
        name: "Luigi",
        surname: "Bianchi",
        email: "luigi@office.com",
        password: "password123",
        role: OfficerRole.TECHNICAL_OFFICE_STAFF,
        office: OfficeType.INFRASTRUCTURE
      };

      const mockCreatedOfficer = { ...officerDto, id: 1 };
      
      mockOfficerRepo.createOfficer = jest.fn().mockResolvedValue(mockCreatedOfficer);
      (mapOfficerDAOToDTO as jest.Mock).mockReturnValue(mockCreatedOfficer);

      const result = await createOfficer(officerDto as any);

      expect(mockOfficerRepo.createOfficer).toHaveBeenCalledWith(
        "officer1",
        "Luigi",
        "Bianchi",
        "luigi@office.com",
        "password123",
        OfficerRole.TECHNICAL_OFFICE_STAFF,
        OfficeType.INFRASTRUCTURE
      );
      expect(result).toEqual(mockCreatedOfficer);
    });
  });

  describe("getAllOfficers", () => {
    it("dovrebbe recuperare tutti gli officers", async () => {
      const mockOfficers = [
        { id: 1, username: "officer1", email: "officer1@office.com" },
        { id: 2, username: "officer2", email: "officer2@office.com" }
      ];

      mockOfficerRepo.getAllOfficers = jest.fn().mockResolvedValue(mockOfficers);
      (mapOfficerDAOToDTO as jest.Mock).mockImplementation((officer) => officer);

      const result = await getAllOfficers();

      expect(mockOfficerRepo.getAllOfficers).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe("assignReportToOfficer", () => {
    it("dovrebbe assegnare un report PENDING a un officer", async () => {
      const mockReport = {
        id: 1,
        state: ReportState.PENDING,
        category: OfficeType.INFRASTRUCTURE
      };
      const mockOfficer = {
        id: 1,
        email: "officer@office.com"
      };

      mockReportRepo.getReportById = jest.fn().mockResolvedValue(mockReport);
      mockOfficerRepo.getOfficerById = jest.fn().mockResolvedValue(mockOfficer);
      mockReportRepo.assignReportToOfficer = jest.fn().mockResolvedValue(undefined);

      await assignReportToOfficer(1, 1);

      expect(mockReportRepo.getReportById).toHaveBeenCalledWith(1);
      expect(mockOfficerRepo.getOfficerById).toHaveBeenCalledWith(1);
      expect(mockReportRepo.assignReportToOfficer).toHaveBeenCalledWith(1, 1);
    });

    it("dovrebbe lanciare errore se il report non è PENDING", async () => {
      const mockReport = {
        id: 1,
        state: ReportState.APPROVED
      };

      mockReportRepo.getReportById = jest.fn().mockResolvedValue(mockReport);

      await expect(assignReportToOfficer(1, 1))
        .rejects
        .toThrow("Only PENDING reports can be assigned");
    });

    it("dovrebbe lanciare errore se l'officer non esiste", async () => {
      const mockReport = {
        id: 1,
        state: ReportState.PENDING
      };

      mockReportRepo.getReportById = jest.fn().mockResolvedValue(mockReport);
      mockOfficerRepo.getOfficerById = jest.fn().mockResolvedValue(null);

      await expect(assignReportToOfficer(1, 1))
        .rejects
        .toThrow("Officer not found");
    });
  });

  describe("retrieveDocs", () => {
    it("dovrebbe recuperare i report PENDING per l'officer", async () => {
      const mockOfficer = {
        id: 1,
        office: OfficeType.INFRASTRUCTURE
      };
      const mockPendingReports = [
        { id: 1, state: ReportState.PENDING, category: OfficeType.INFRASTRUCTURE },
        { id: 2, state: ReportState.PENDING, category: OfficeType.INFRASTRUCTURE }
      ];
      const mockCategoryReports = [
        { id: 1, category: OfficeType.INFRASTRUCTURE },
        { id: 2, category: OfficeType.INFRASTRUCTURE }
      ];

      mockOfficerRepo.getOfficerById = jest.fn().mockResolvedValue(mockOfficer);
      mockReportRepo.getReportsByState = jest.fn().mockResolvedValue(mockPendingReports);
      mockReportRepo.getReportsByCategory = jest.fn().mockResolvedValue(mockCategoryReports);
      (mapReportDAOToDTO as jest.Mock).mockImplementation((report) => report);

      const result = await retrieveDocs(1);

      expect(mockReportRepo.getReportsByState).toHaveBeenCalledWith(ReportState.PENDING);
      expect(result).toHaveLength(2);
    });
  });

  describe("reviewDoc", () => {
    it("dovrebbe approvare un report", async () => {
      const mockReport = {
        id: 1,
        assignedOfficerId: 1,
        category: OfficeType.INFRASTRUCTURE
      };
      const mockUpdatedReport = {
        ...mockReport,
        state: ReportState.APPROVED
      };
      const mockOfficers = [{ id: 2, office: OfficeType.INFRASTRUCTURE }];

      mockReportRepo.getReportById = jest.fn().mockResolvedValue(mockReport);
      mockReportRepo.updateReportState = jest.fn().mockResolvedValue(mockUpdatedReport);
      mockOfficerRepo.getOfficersByOffice = jest.fn().mockResolvedValue(mockOfficers);
      mockReportRepo.assignReportToOfficer = jest.fn().mockResolvedValue(mockUpdatedReport);
      (mapReportDAOToDTO as jest.Mock).mockReturnValue(mockUpdatedReport);

      const result = await reviewDoc(1, 1, ReportState.APPROVED);

      expect(mockReportRepo.updateReportState).toHaveBeenCalledWith(1, ReportState.APPROVED, undefined);
    });

    it("dovrebbe rifiutare un report con motivazione", async () => {
      const mockReport = {
        id: 1,
        assignedOfficerId: 1
      };
      const mockUpdatedReport = {
        ...mockReport,
        state: ReportState.DECLINED,
        reason: "Motivo del rifiuto"
      };

      mockReportRepo.getReportById = jest.fn().mockResolvedValue(mockReport);
      mockReportRepo.updateReportState = jest.fn().mockResolvedValue(mockUpdatedReport);
      (mapReportDAOToDTO as jest.Mock).mockReturnValue(mockUpdatedReport);

      const result = await reviewDoc(1, 1, ReportState.DECLINED, "Motivo del rifiuto");

      expect(mockReportRepo.updateReportState).toHaveBeenCalledWith(
        1, 
        ReportState.DECLINED, 
        "Motivo del rifiuto"
      );
    });

    it("dovrebbe lanciare errore se il report è assegnato a un altro officer", async () => {
      const mockReport = {
        id: 1,
        assignedOfficerId: 2 // Diverso dall'officer che sta reviewando
      };

      mockReportRepo.getReportById = jest.fn().mockResolvedValue(mockReport);

      await expect(reviewDoc(1, 1, ReportState.APPROVED))
        .rejects
        .toThrow("You can only review reports assigned to you");
    });
  });
});
