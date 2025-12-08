import "reflect-metadata";
import {
  createOfficer,
  getOfficer,
  getAllOfficers,
  getAllOfficersByOfficeType,
  updateOfficer,
  assignReportToOfficer,
  retrieveDocs,
  getAssignedReports,
  getAllAssignedReportsOfficer,
  reviewDoc,
  deleteOfficer
} from "../../../src/controllers/officerController";
import { OfficerRepository } from "../../../src/repositories/OfficerRepository";
import { ReportRepository } from "../../../src/repositories/ReportRepository";
import { NotificationRepository } from "../../../src/repositories/NotificationRepository";
import { mapOfficerDAOToDTO, mapReportDAOToDTO } from "../../../src/services/mapperService";
import { ReportState } from "../../../src/models/enums/ReportState";
import { OfficeType } from "../../../src/models/enums/OfficeType";
import { OfficerRole } from "../../../src/models/enums/OfficerRole";

jest.mock("../../../src/repositories/OfficerRepository");
jest.mock("../../../src/repositories/ReportRepository");
jest.mock("../../../src/repositories/NotificationRepository");
jest.mock("../../../src/services/mapperService");

describe("OfficerController Unit Tests", () => {
  let mockOfficerRepo: jest.Mocked<OfficerRepository>;
  let mockReportRepo: jest.Mocked<ReportRepository>;
  let mockNotificationRepo: jest.Mocked<NotificationRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOfficerRepo = new OfficerRepository() as jest.Mocked<OfficerRepository>;
    mockReportRepo = new ReportRepository() as jest.Mocked<ReportRepository>;
    mockNotificationRepo = new NotificationRepository() as jest.Mocked<NotificationRepository>;
    (OfficerRepository as jest.MockedClass<typeof OfficerRepository>).mockImplementation(() => mockOfficerRepo);
    (ReportRepository as jest.MockedClass<typeof ReportRepository>).mockImplementation(() => mockReportRepo);
    (NotificationRepository as jest.MockedClass<typeof NotificationRepository>).mockImplementation(() => mockNotificationRepo);
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

  describe("getAllOfficersByOfficeType", () => {
    it("dovrebbe restituire officers filtrati per officeType", async () => {
      const mockOfficers = [
        { id: 1, office: OfficeType.INFRASTRUCTURE },
        { id: 2, office: OfficeType.INFRASTRUCTURE }
      ];
      mockOfficerRepo.getOfficersByOffice = jest.fn().mockResolvedValue(mockOfficers);
      (mapOfficerDAOToDTO as jest.Mock).mockImplementation((officer) => officer);

      const result = await getAllOfficersByOfficeType("INFRASTRUCTURE");
      expect(mockOfficerRepo.getOfficersByOffice).toHaveBeenCalledWith("INFRASTRUCTURE");
      expect(result).toHaveLength(2);
    });
  });

  describe("getOfficer", () => {
    it("dovrebbe restituire officer per email", async () => {
      const mockOfficer = { id: 1, email: "officer@office.com" };
      mockOfficerRepo.getOfficerByEmail = jest.fn().mockResolvedValue(mockOfficer);
      (mapOfficerDAOToDTO as jest.Mock).mockReturnValue(mockOfficer);

      const result = await getOfficer("officer@office.com");
      expect(mockOfficerRepo.getOfficerByEmail).toHaveBeenCalledWith("officer@office.com");
      expect(result).toEqual(mockOfficer);
    });
  });

  describe("updateOfficer", () => {
    it("dovrebbe aggiornare officer", async () => {
      const officerDto = {
        id: 1,
        username: "officer1",
        name: "Luigi",
        surname: "Bianchi",
        email: "luigi@office.com",
        role: OfficerRole.TECHNICAL_OFFICE_STAFF,
        office: OfficeType.INFRASTRUCTURE
      };
      const mockUpdatedOfficer = { ...officerDto };
      mockOfficerRepo.updateOfficer = jest.fn().mockResolvedValue(mockUpdatedOfficer);
      (mapOfficerDAOToDTO as jest.Mock).mockReturnValue(mockUpdatedOfficer);

      const result = await updateOfficer(officerDto as any);
      expect(mockOfficerRepo.updateOfficer).toHaveBeenCalledWith(
        1,
        "officer1",
        "Luigi",
        "Bianchi",
        "luigi@office.com",
        OfficerRole.TECHNICAL_OFFICE_STAFF,
        OfficeType.INFRASTRUCTURE
      );
      expect(result).toEqual(mockUpdatedOfficer);
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
        state: ReportState.IN_PROGRESS
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

  describe("getAssignedReports", () => {
    it("dovrebbe restituire i report assegnati all'officer", async () => {
      const mockReports = [
        { id: 1, assignedOfficerId: 1 },
        { id: 2, assignedOfficerId: 1 }
      ];
      mockReportRepo.getReportsByAssignedOfficer = jest.fn().mockResolvedValue(mockReports);
      (mapReportDAOToDTO as jest.Mock).mockImplementation((report) => report);

      const result = await getAssignedReports(1);
      expect(mockReportRepo.getReportsByAssignedOfficer).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
    });
  });

  describe("getAllAssignedReportsOfficer", () => {
    it("dovrebbe restituire tutti i report assegnati all'officer (anche non pending)", async () => {
      const mockReports = [
        { id: 1, assignedOfficerId: 1, state: ReportState.ASSIGNED },
        { id: 2, assignedOfficerId: 1, state: ReportState.RESOLVED }
      ];
      mockReportRepo.getReportsByAssignedOfficer = jest.fn().mockResolvedValue(mockReports);
      (mapReportDAOToDTO as jest.Mock).mockImplementation((report) => report);

      const result = await getAllAssignedReportsOfficer(1);
      expect(mockReportRepo.getReportsByAssignedOfficer).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
    });
  });

  describe("deleteOfficer", () => {
    it("dovrebbe eliminare un officer per email", async () => {
      mockOfficerRepo.deleteOfficer = jest.fn().mockResolvedValue(undefined);
      await deleteOfficer("officer@office.com");
      expect(mockOfficerRepo.deleteOfficer).toHaveBeenCalledWith("officer@office.com");
    });
  });

  describe("retrieveDocs", () => {
    it("dovrebbe restituire solo report PENDING non assegnati o assegnati all'officer", async () => {
      const mockPendingReports = [
        { id: 1, assignedOfficerId: null, state: ReportState.PENDING },
        { id: 2, assignedOfficerId: 1, state: ReportState.PENDING },
        { id: 3, assignedOfficerId: 2, state: ReportState.PENDING }
      ];
      (mapReportDAOToDTO as jest.Mock).mockImplementation((report) => report);
      mockReportRepo.getReportsByState = jest.fn().mockResolvedValue(mockPendingReports);

      const result = await retrieveDocs(1);
      expect(mockReportRepo.getReportsByState).toHaveBeenCalledWith(ReportState.PENDING);
      expect(result).toEqual([
        { id: 1, assignedOfficerId: null, state: ReportState.PENDING },
        { id: 2, assignedOfficerId: 1, state: ReportState.PENDING }
      ]);
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
        state: ReportState.PENDING
      };
      const mockOfficers = [{ id: 2, office: OfficeType.INFRASTRUCTURE }];

      mockReportRepo.getReportById = jest.fn().mockResolvedValue(mockReport);
      mockReportRepo.updateReportState = jest.fn().mockResolvedValue(mockUpdatedReport);
      mockOfficerRepo.getOfficersByOffice = jest.fn().mockResolvedValue(mockOfficers);
      mockReportRepo.assignReportToOfficer = jest.fn().mockResolvedValue(mockUpdatedReport);
      (mapReportDAOToDTO as jest.Mock).mockReturnValue(mockUpdatedReport);

      const result = await reviewDoc(1, 1, ReportState.ASSIGNED);

      expect(mockReportRepo.updateReportState).toHaveBeenCalledWith(1, ReportState.ASSIGNED, undefined);
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

      await expect(reviewDoc(1, 1, ReportState.ASSIGNED))
        .rejects
        .toThrow("You can only review reports assigned to you");
    });

    it("dovrebbe lanciare errore se il report è già risolto o rifiutato", async () => {
      const mockReport = {
        id: 1,
        assignedOfficerId: 1,
        state: ReportState.RESOLVED
      };
      mockReportRepo.getReportById = jest.fn().mockResolvedValue(mockReport);

      await expect(reviewDoc(1, 1, ReportState.ASSIGNED))
        .rejects
        .toThrow(/already in state 'RESOLVED'/);
    });

    it("dovrebbe assegnare il report a un officer preferito se stato ASSIGNED", async () => {
      const mockReport = {
        id: 1,
        assignedOfficerId: null,
        state: ReportState.PENDING,
        category: OfficeType.INFRASTRUCTURE
      };
      const mockUpdatedReport = { ...mockReport, state: ReportState.ASSIGNED };
      const mockOfficers = [
        { id: 2, role: OfficerRole.TECHNICAL_OFFICE_STAFF, office: OfficeType.INFRASTRUCTURE },
        { id: 3, role: OfficerRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER, office: OfficeType.INFRASTRUCTURE }
      ];

      mockReportRepo.getReportById = jest.fn().mockResolvedValue(mockReport);
      mockReportRepo.updateReportState = jest.fn().mockResolvedValue(mockUpdatedReport);
      mockOfficerRepo.getOfficersByOffice = jest.fn().mockResolvedValue(mockOfficers);
      mockReportRepo.assignReportToOfficer = jest.fn().mockResolvedValue(mockUpdatedReport);
      mockNotificationRepo.createStatusChangeNotification = jest.fn().mockResolvedValue(undefined);
      (mapReportDAOToDTO as jest.Mock).mockReturnValue(mockUpdatedReport);

      const result = await reviewDoc(1, 1, ReportState.ASSIGNED);

      expect(mockOfficerRepo.getOfficersByOffice).toHaveBeenCalledWith(OfficeType.INFRASTRUCTURE);
      expect(mockReportRepo.assignReportToOfficer).toHaveBeenCalledWith(1, 2);
      expect(mockNotificationRepo.createStatusChangeNotification).toHaveBeenCalledWith(mockUpdatedReport);
      expect(result).toEqual(mockUpdatedReport);
    });

    it("dovrebbe aggiornare lo stato e notificare", async () => {
      const mockReport = {
        id: 1,
        assignedOfficerId: 1,
        state: ReportState.PENDING,
        category: OfficeType.INFRASTRUCTURE
      };
      const mockUpdatedReport = { ...mockReport, state: ReportState.DECLINED, reason: "Motivo" };

      mockReportRepo.getReportById = jest.fn().mockResolvedValue(mockReport);
      mockReportRepo.updateReportState = jest.fn().mockResolvedValue(mockUpdatedReport);
      mockNotificationRepo.createStatusChangeNotification = jest.fn().mockResolvedValue(undefined);
      (mapReportDAOToDTO as jest.Mock).mockReturnValue(mockUpdatedReport);

      const result = await reviewDoc(1, 1, ReportState.DECLINED, "Motivo");

      expect(mockReportRepo.updateReportState).toHaveBeenCalledWith(1, ReportState.DECLINED, "Motivo");
      expect(mockNotificationRepo.createStatusChangeNotification).toHaveBeenCalledWith(mockUpdatedReport);
      expect(result).toEqual(mockUpdatedReport);
    });
  });
});
