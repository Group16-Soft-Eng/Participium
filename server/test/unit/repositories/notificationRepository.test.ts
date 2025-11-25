import "reflect-metadata";
import { NotificationRepository } from "../../../src/repositories/NotificationRepository";
import { NotificationDAO } from "../../../src/models/dao/NotificationDAO";
import { UserDAO } from "../../../src/models/dao/UserDAO";
import { ReportDAO } from "../../../src/models/dao/ReportDAO";
import { Repository } from "typeorm";
import { ReportState } from "../../../src/models/enums/ReportState";
import { userInfo } from "os";

// Mock TypeORM Repository
jest.mock("typeorm", () => {
  const actual = jest.requireActual("typeorm");
  return {
    ...actual,
    getRepository: jest.fn(),
  };
});

describe("NotificationRepository", () => {
  let notificationRepo: NotificationRepository;
  let mockRepo: jest.Mocked<Repository<NotificationDAO>>;

  beforeEach(() => {
    // Create mock repository
    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as any;

    // Mock getRepository to return our mock
    notificationRepo = new NotificationRepository();
    (notificationRepo as any).repo = mockRepo;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findByUserId", () => {
    it("should return all notifications for a user", async () => {
      const userId = 1;
      const mockNotifications: NotificationDAO[] = [
        {
          id: 1,
          userId: userId,
          reportId: 1,
          title: "Report Approved",
          message: "Your report has been approved",
          type: "REPORT_APPROVED",
          read: false,
          createdAt: new Date(),
        } as NotificationDAO,
        {
          id: 2,
          userId: userId,
          reportId: 2,
          title: "Report Declined",
          message: "Your report has been declined",
          type: "REPORT_DECLINED",
          read: true,
          createdAt: new Date(),
        } as NotificationDAO,
      ];

      mockRepo.find.mockResolvedValue(mockNotifications);

      const result = await notificationRepo.listByUser(userId);

      expect(result).toEqual(mockNotifications);
      expect(result).toHaveLength(2);
    });

    it("should return empty array if user has no notifications", async () => {
      const userId = 999;
      mockRepo.find.mockResolvedValue([]);

      const result = await notificationRepo.listByUser(userId);

      expect(result).toEqual([]);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: "DESC" },
      });
    });

    it("should filter unread notifications when specified", async () => {
      const userId = 1;
      const unreadNotifications: NotificationDAO[] = [
        {
          id: 1,
          userId: userId,
          reportId: 1,
          title: "Report Approved",
          message: "Your report has been approved",
          type: "REPORT_APPROVED",
          read: false,
          createdAt: new Date(),
        } as NotificationDAO,
      ];

      mockRepo.find.mockResolvedValue(unreadNotifications);

      const result = await notificationRepo.listByUser(userId, true);

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { userId, read: false },
        order: { createdAt: "DESC" },
      });
      expect(result).toEqual(unreadNotifications);
      expect(result.every((n) => n.read === false)).toBe(true);
    });
  });

  describe("markAsRead", () => {

    it("should mark notification as read", async () => {
      const notificationId = 1;
      const userId = 1; 
      const mockUpdatedNotification: NotificationDAO = {
        id: notificationId,
        userId: 1,
        reportId: 1,
        title: "Test",
        message: "Test",
        type: "REPORT_APPROVED",
        read: true,
        createdAt: new Date(),
      } as NotificationDAO;

      mockRepo.findOne.mockResolvedValue(mockUpdatedNotification);
      mockRepo.update.mockResolvedValue({ affected: 1 } as any);

      const result = await notificationRepo.markRead(notificationId, userId);

      expect(mockRepo.update).toHaveBeenCalledWith(
        notificationId,
        { read: true }
      );
      expect(mockRepo.findOne).toHaveBeenCalled();
      expect(result?.read).toBe(true);
    });

    it("should return null if notification not found", async () => {
      const userId = 1;
      const notificationId = 999;
      mockRepo.update.mockResolvedValue({ affected: 0 } as any);
      mockRepo.findOne.mockResolvedValue(null);

      const result = await notificationRepo.markRead(notificationId, userId);

      expect(result).toBeNull();
    });
  });

  describe("createStatusChangeNotification", () => {
    it("should create notification for approved report", async () => {
      const mockReport: Partial<ReportDAO> = {
        id: 1,
        author: { id: 10 } as UserDAO,
        state: ReportState.APPROVED,
        title: "Test Report",
      };

      const mockNotification: NotificationDAO = {
        id: 1,
        userId: 10,
        reportId: 1,
        title: "Report Approved",
        message: "Your report 'Test Report' has been approved",
        type: "REPORT_APPROVED",
        read: false,
        createdAt: new Date(),
      } as NotificationDAO;

      mockRepo.create.mockReturnValue(mockNotification);
      mockRepo.save.mockResolvedValue(mockNotification);

      const result = await notificationRepo.createStatusChangeNotification(
        mockReport as ReportDAO
      );

      expect(mockRepo.create).toHaveBeenCalledWith({
        userId: 10,
        reportId: 1,
        title: "Report Approved",
        message: expect.stringContaining("approved"),
        type: "REPORT_APPROVED",
        read: false,
      });
      expect(mockRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockNotification);
    });

    it("should create notification for declined report", async () => {
      const mockReport: Partial<ReportDAO> = {
        id: 2,
        author: { id: 20 } as UserDAO,
        state: ReportState.DECLINED,
        title: "Test Report 2",
      };

      const mockNotification: NotificationDAO = {
        id: 2,
        userId: 20,
        reportId: 2,
        title: "Report Declined",
        message: "Your report 'Test Report 2' has been declined",
        type: "REPORT_DECLINED",
        read: false,
        createdAt: new Date(),
      } as NotificationDAO;

      mockRepo.create.mockReturnValue(mockNotification);
      mockRepo.save.mockResolvedValue(mockNotification);

      const result = await notificationRepo.createStatusChangeNotification(
        mockReport as ReportDAO
      );

      expect(mockRepo.create).toHaveBeenCalledWith({
        userId: 20,
        reportId: 2,
        title: "Report Declined",
        message: expect.stringContaining("declined"),
        type: "REPORT_DECLINED",
        read: false,
      });
      expect(result).toEqual(mockNotification);
    });

    it("should create notification for assigned report", async () => {
      const mockReport: Partial<ReportDAO> = {
        id: 3,
        author: { id: 30 } as UserDAO,
        state: ReportState.APPROVED,
        title: "Test Report 3",
      };

      const mockNotification: NotificationDAO = {
        id: 3,
        userId: 30,
        reportId: 3,
        title: "Report Assigned",
        message: "Your report 'Test Report 3' has been assigned to a technical staff",
        type: "REPORT_ASSIGNED",
        read: false,
        createdAt: new Date(),
      } as NotificationDAO;

      mockRepo.create.mockReturnValue(mockNotification);
      mockRepo.save.mockResolvedValue(mockNotification);

      const result = await notificationRepo.createStatusChangeNotification(
        mockReport as ReportDAO
      );

      expect(mockRepo.create).toHaveBeenCalledWith({
        userId: 30,
        reportId: 3,
        title: "Report Assigned",
        message: expect.stringContaining("assigned"),
        type: "REPORT_ASSIGNED",
        read: false,
      });
      expect(result).toEqual(mockNotification);
    });

    it("should create notification for completed report", async () => {
      const mockReport: Partial<ReportDAO> = {
        id: 4,
        author: { id: 40 } as UserDAO,
        state: ReportState.APPROVED,
        title: "Test Report 4",
      };

      const mockNotification: NotificationDAO = {
        id: 4,
        userId: 40,
        reportId: 4,
        title: "Report Completed",
        message: "Your report 'Test Report 4' has been completed",
        type: "REPORT_COMPLETED",
        read: false,
        createdAt: new Date(),
      } as NotificationDAO;

      mockRepo.create.mockReturnValue(mockNotification);
      mockRepo.save.mockResolvedValue(mockNotification);

      const result = await notificationRepo.createStatusChangeNotification(
        mockReport as ReportDAO
      );

      expect(mockRepo.create).toHaveBeenCalledWith({
        userId: 40,
        reportId: 4,
        title: "Report Completed",
        message: expect.stringContaining("completed"),
        type: "REPORT_COMPLETED",
        read: false,
      });
      expect(result).toEqual(mockNotification);
    });

    it("should return null for anonymous report", async () => {
      const mockReport: Partial<ReportDAO> = {
        id: 5,
        author: null,
        state: ReportState.APPROVED,
        title: "Anonymous Report",
        anonymity: true,
      };

      const result = await notificationRepo.createStatusChangeNotification(
        mockReport as ReportDAO
      );

      expect(result).toBeNull();
      expect(mockRepo.create).not.toHaveBeenCalled();
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it("should return null for pending report", async () => {
      const mockReport: Partial<ReportDAO> = {
        id: 6,
        author: { id: 60 } as UserDAO,
        state: ReportState.PENDING,
        title: "Pending Report",
      };

      const result = await notificationRepo.createStatusChangeNotification(
        mockReport as ReportDAO
      );

      expect(result).toBeNull();
      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });

});