import "reflect-metadata";
import { ReportRepository } from "../../../src/repositories/ReportRepository";
import { ReportDAO } from "../../../src/models/dao/ReportDAO";
import { UserDAO } from "../../../src/models/dao/UserDAO";
import { Repository } from "typeorm";
import { AppDataSource } from "../../../src/database/connection";
import { OfficeType } from "../../../src/models/enums/OfficeType";
import { ReportState } from "../../../src/models/enums/ReportState";
import { NotFoundError } from "../../../src/utils/utils";

describe("ReportRepository Unit Tests", () => {
  let reportRepository: ReportRepository;
  let mockRepo: jest.Mocked<Repository<ReportDAO>>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock del repository TypeORM
    mockRepo = {
      find: jest.fn(),
      save: jest.fn(),
      remove: jest.fn()
    } as any;

    // Spy su AppDataSource.getRepository
    jest.spyOn(AppDataSource, 'getRepository').mockReturnValue(mockRepo);

    reportRepository = new ReportRepository();
  });

  describe("getAllReports", () => {
    it("dovrebbe restituire tutti i report con author", async () => {
      const mockAuthor: UserDAO = {
        id: 1,
        username: "user1",
        firstName: "Test",
        lastName: "User",
        email: "user@example.com",
        password: "hash",
        avatar: null,
        telegramUsername: null,
        emailNotifications: false
      };

      const mockReports: ReportDAO[] = [
        {
          id: 1,
          title: "Report 1",
          location: { name: "Location 1", Coordinates: { longitude: 10, latitude: 20 } },
          author: mockAuthor,
          anonymity: false,
          date: new Date(),
          category: OfficeType.INFRASTRUCTURE,
          document: { Description: "Test description", Photos: [] },
          state: ReportState.PENDING,
          reason: null,
          assignedOfficerId: null
        }
      ];

      mockRepo.find.mockResolvedValue(mockReports);

      const result = await reportRepository.getAllReports();

      expect(result).toEqual(mockReports);
      expect(mockRepo.find).toHaveBeenCalledWith({ relations: ["author"] });
    });
  });

  describe("getApprovedReports", () => {
    it("dovrebbe restituire solo i report approvati ordinati per data", async () => {
      const mockReports: ReportDAO[] = [
        {
          id: 1,
          title: "Approved Report",
          location: { name: "Location" },
          author: null,
          anonymity: true,
          date: new Date(),
          category: OfficeType.INFRASTRUCTURE,
          document: { Description: "Approved" },
          state: ReportState.APPROVED,
          reason: null,
          assignedOfficerId: 1
        }
      ];

      mockRepo.find.mockResolvedValue(mockReports);

      const result = await reportRepository.getApprovedReports();

      expect(result).toEqual(mockReports);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { state: ReportState.APPROVED },
        relations: ["author"],
        order: { date: "DESC" }
      });
    });
  });

  describe("getReportsByState", () => {
    it("dovrebbe restituire report per stato specifico", async () => {
      const mockReports: ReportDAO[] = [
        {
          id: 1,
          title: "Pending Report",
          location: { name: "Location" },
          author: null,
          anonymity: false,
          date: new Date(),
          category: OfficeType.INFRASTRUCTURE,
          document: { Description: "Pending" },
          state: ReportState.PENDING,
          reason: null,
          assignedOfficerId: null
        }
      ];

      mockRepo.find.mockResolvedValue(mockReports);

      const result = await reportRepository.getReportsByState(ReportState.PENDING);

      expect(result).toEqual(mockReports);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { state: ReportState.PENDING },
        relations: ["author"]
      });
    });
  });

  describe("getReportById", () => {
    it("dovrebbe restituire un report quando esiste", async () => {
      const mockReport: ReportDAO = {
        id: 1,
        title: "Test Report",
        location: { name: "Location" },
        author: null,
        anonymity: false,
        date: new Date(),
        category: OfficeType.INFRASTRUCTURE,
        document: { Description: "Test" },
        state: ReportState.PENDING,
        reason: null,
        assignedOfficerId: null
      };

      mockRepo.find.mockResolvedValue([mockReport]);

      const result = await reportRepository.getReportById(1);

      expect(result).toEqual(mockReport);
      expect(mockRepo.find).toHaveBeenCalledWith({ 
        where: { id: 1 }, 
        relations: ["author"] 
      });
    });

    it("dovrebbe lanciare NotFoundError quando il report non esiste", async () => {
      mockRepo.find.mockResolvedValue([]);

      await expect(reportRepository.getReportById(999))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe("getReportsByCategory", () => {
    it("dovrebbe restituire report per categoria specifica", async () => {
      const mockReports: ReportDAO[] = [
        {
          id: 1,
          title: "Waste Report",
          location: { name: "Location" },
          author: null,
          anonymity: false,
          date: new Date(),
          category: OfficeType.INFRASTRUCTURE,
          document: { Description: "Waste issue" },
          state: ReportState.PENDING,
          reason: null,
          assignedOfficerId: null
        }
      ];

      mockRepo.find.mockResolvedValue(mockReports);

      const result = await reportRepository.getReportsByCategory(OfficeType.INFRASTRUCTURE);

      expect(result).toEqual(mockReports);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { category: OfficeType.INFRASTRUCTURE },
        relations: ["author"]
      });
    });
  });

  describe("getReportsByAssignedOfficer", () => {
    it("dovrebbe restituire report assegnati a uno specifico officer", async () => {
      const mockReports: ReportDAO[] = [
        {
          id: 1,
          title: "Assigned Report",
          location: { name: "Location" },
          author: null,
          anonymity: false,
          date: new Date(),
          category: OfficeType.INFRASTRUCTURE,
          document: { Description: "Assigned" },
          state: ReportState.APPROVED,
          reason: null,
          assignedOfficerId: 5
        }
      ];

      mockRepo.find.mockResolvedValue(mockReports);

      const result = await reportRepository.getReportsByAssignedOfficer(5);

      expect(result).toEqual(mockReports);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { assignedOfficerId: 5 },
        relations: ["author"]
      });
    });
  });

  describe("createReport", () => {
    it("dovrebbe creare un nuovo report con successo", async () => {
      const mockAuthor: UserDAO = {
        id: 1,
        username: "user1",
        firstName: "Test",
        lastName: "User",
        email: "user@example.com",
        password: "hash",
        avatar: null,
        telegramUsername: null,
        emailNotifications: false
      };

      const reportData = {
        title: "New Report",
        location: { name: "Test Location", Coordinates: { longitude: 10.5, latitude: 45.5 } },
        author: mockAuthor,
        anonymity: false,
        category: OfficeType.INFRASTRUCTURE,
        document: { Description: "Test description", Photos: ["photo1.jpg"] }
      };

      const savedReport: ReportDAO = {
        id: 1,
        ...reportData,
        state: ReportState.PENDING,
        date: expect.any(Date),
        reason: null,
        assignedOfficerId: null
      } as any;

      mockRepo.save.mockResolvedValue(savedReport);

      const result = await reportRepository.createReport(
        reportData.title,
        reportData.location,
        reportData.author,
        reportData.anonymity,
        reportData.category,
        reportData.document
      );

      expect(result).toEqual(savedReport);
      expect(mockRepo.save).toHaveBeenCalledWith({
        title: reportData.title,
        location: reportData.location,
        author: reportData.author,
        anonymity: reportData.anonymity,
        category: reportData.category,
        document: reportData.document,
        state: ReportState.PENDING,
        date: expect.any(Date)
      });
    });

    it("dovrebbe creare un report anonimo senza author", async () => {
      const reportData = {
        title: "Anonymous Report",
        location: { name: "Anonymous Location" },
        author: null,
        anonymity: true,
        category: OfficeType.INFRASTRUCTURE,
        document: { Description: "Anonymous issue" }
      };

      const savedReport: ReportDAO = {
        id: 2,
        ...reportData,
        state: ReportState.PENDING,
        date: expect.any(Date),
        reason: null,
        assignedOfficerId: null
      } as any;

      mockRepo.save.mockResolvedValue(savedReport);

      const result = await reportRepository.createReport(
        reportData.title,
        reportData.location,
        reportData.author,
        reportData.anonymity,
        reportData.category,
        reportData.document
      );

      expect(result).toEqual(savedReport);
      expect(result.author).toBeNull();
      expect(result.anonymity).toBe(true);
    });
  });

  describe("updateReportState", () => {
    it("dovrebbe aggiornare lo stato di un report", async () => {
      const mockReport: ReportDAO = {
        id: 1,
        title: "Test Report",
        location: { name: "Location" },
        author: null,
        anonymity: false,
        date: new Date(),
        category: OfficeType.INFRASTRUCTURE,
        document: { Description: "Test" },
        state: ReportState.PENDING,
        reason: null,
        assignedOfficerId: null
      };

      const updatedReport = { ...mockReport, state: ReportState.APPROVED };

      mockRepo.find.mockResolvedValue([mockReport]);
      mockRepo.save.mockResolvedValue(updatedReport);

      const result = await reportRepository.updateReportState(1, ReportState.APPROVED);

      expect(result.state).toBe(ReportState.APPROVED);
      expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        state: ReportState.APPROVED
      }));
    });

    it("dovrebbe aggiornare lo stato a DECLINED con reason", async () => {
      const mockReport: ReportDAO = {
        id: 1,
        title: "Test Report",
        location: { name: "Location" },
        author: null,
        anonymity: false,
        date: new Date(),
        category: OfficeType.INFRASTRUCTURE,
        document: { Description: "Test" },
        state: ReportState.PENDING,
        reason: null,
        assignedOfficerId: null
      };

      const updatedReport = { 
        ...mockReport, 
        state: ReportState.DECLINED, 
        reason: "Not valid" 
      };

      mockRepo.find.mockResolvedValue([mockReport]);
      mockRepo.save.mockResolvedValue(updatedReport);

      const result = await reportRepository.updateReportState(
        1, 
        ReportState.DECLINED, 
        "Not valid"
      );

      expect(result.state).toBe(ReportState.DECLINED);
      expect(result.reason).toBe("Not valid");
    });

    it("dovrebbe lanciare NotFoundError se il report non esiste", async () => {
      mockRepo.find.mockResolvedValue([]);

      await expect(reportRepository.updateReportState(999, ReportState.APPROVED))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe("deleteReport", () => {
    it("dovrebbe eliminare un report esistente", async () => {
      const mockReport: ReportDAO = {
        id: 1,
        title: "Report to Delete",
        location: { name: "Location" },
        author: null,
        anonymity: false,
        date: new Date(),
        category: OfficeType.INFRASTRUCTURE,
        document: { Description: "Delete me" },
        state: ReportState.PENDING,
        reason: null,
        assignedOfficerId: null
      };

      mockRepo.find.mockResolvedValue([mockReport]);
      mockRepo.remove.mockResolvedValue(mockReport);

      await reportRepository.deleteReport(1);

      expect(mockRepo.find).toHaveBeenCalledWith({ 
        where: { id: 1 }, 
        relations: ["author"] 
      });
      expect(mockRepo.remove).toHaveBeenCalledWith(mockReport);
    });

    it("dovrebbe lanciare NotFoundError se il report non esiste", async () => {
      mockRepo.find.mockResolvedValue([]);

      await expect(reportRepository.deleteReport(999))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe("assignReportToOfficer", () => {
    it("dovrebbe assegnare un report a un officer", async () => {
      const mockReport: ReportDAO = {
        id: 1,
        title: "Report to Assign",
        location: { name: "Location" },
        author: null,
        anonymity: false,
        date: new Date(),
        category: OfficeType.INFRASTRUCTURE,
        document: { Description: "Assign this" },
        state: ReportState.APPROVED,
        reason: null,
        assignedOfficerId: null
      };

      const assignedReport = { ...mockReport, assignedOfficerId: 5 };

      mockRepo.find.mockResolvedValue([mockReport]);
      mockRepo.save.mockResolvedValue(assignedReport);

      const result = await reportRepository.assignReportToOfficer(1, 5);

      expect(result.assignedOfficerId).toBe(5);
      expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        assignedOfficerId: 5
      }));
    });

    it("dovrebbe lanciare NotFoundError se il report non esiste", async () => {
      mockRepo.find.mockResolvedValue([]);

      await expect(reportRepository.assignReportToOfficer(999, 5))
        .rejects
        .toThrow(NotFoundError);
    });
  });
});
