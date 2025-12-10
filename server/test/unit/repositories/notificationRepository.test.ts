import { NotificationRepository } from '../../../src/repositories/NotificationRepository';
import { Repository } from 'typeorm';
import { NotificationDAO } from '../../../src/models/dao/NotificationDAO';
import { ReportDAO } from '../../../src/models/dao/ReportDAO';
import { UserDAO } from '../../../src/models/dao/UserDAO';
import { AppDataSource } from '../../../src/database/connection';

jest.mock('../../../src/database/connection', () => ({
    AppDataSource: {
        getRepository: jest.fn()
    }
}));

describe('NotificationRepository', () => {
    let notificationRepo: NotificationRepository;
    let mockRepo: jest.Mocked<Repository<NotificationDAO>>;

    beforeEach(() => {
        mockRepo = {
            find: jest.fn(),
            findOneByOrFail: jest.fn(),
            save: jest.fn(),
            create: jest.fn()
        } as any;

        (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);
        notificationRepo = new NotificationRepository();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ===================== listByUser =====================
    describe('listByUser', () => {
        it('should return all notifications for a user ordered by createdAt DESC', async () => {
            const userId = 1;
            const mockNotifications: NotificationDAO[] = [
                {
                    id: 2,
                    userId: 1,
                    reportId: 10,
                    type: 'STATUS_CHANGE',
                    message: 'Report updated',
                    createdAt: new Date('2025-01-02'),
                    read: false
                },
                {
                    id: 1,
                    userId: 1,
                    reportId: 5,
                    type: 'OFFICER_MESSAGE',
                    message: 'Message from officer',
                    createdAt: new Date('2025-01-01'),
                    read: true
                }
            ];

            mockRepo.find.mockResolvedValue(mockNotifications);

            const result = await notificationRepo.listByUser(userId);

            expect(mockRepo.find).toHaveBeenCalledWith({
                where: { userId },
                order: { createdAt: 'DESC' }
            });
            expect(result).toEqual(mockNotifications);
            expect(result).toHaveLength(2);
        });

        it('should return only unread notifications when unreadOnly is true', async () => {
            const userId = 1;
            const mockNotifications: NotificationDAO[] = [
                {
                    id: 2,
                    userId: 1,
                    reportId: 10,
                    type: 'STATUS_CHANGE',
                    message: 'Report updated',
                    createdAt: new Date('2025-01-02'),
                    read: false
                }
            ];

            mockRepo.find.mockResolvedValue(mockNotifications);

            const result = await notificationRepo.listByUser(userId, true);

            expect(mockRepo.find).toHaveBeenCalledWith({
                where: { userId, read: false },
                order: { createdAt: 'DESC' }
            });
            expect(result).toEqual(mockNotifications);
            expect(result.every(n => !n.read)).toBe(true);
        });

        it('should return empty array if no notifications exist for user', async () => {
            const userId = 999;
            mockRepo.find.mockResolvedValue([]);

            const result = await notificationRepo.listByUser(userId);

            expect(mockRepo.find).toHaveBeenCalledWith({
                where: { userId },
                order: { createdAt: 'DESC' }
            });
            expect(result).toEqual([]);
        });

        it('should handle unreadOnly=false correctly (return all notifications)', async () => {
            const userId = 1;
            const mockNotifications: NotificationDAO[] = [
                {
                    id: 1,
                    userId: 1,
                    reportId: 5,
                    type: 'STATUS_CHANGE',
                    message: 'Test',
                    createdAt: new Date(),
                    read: true
                },
                {
                    id: 2,
                    userId: 1,
                    reportId: 6,
                    type: 'OFFICER_MESSAGE',
                    message: 'Test 2',
                    createdAt: new Date(),
                    read: false
                }
            ];

            mockRepo.find.mockResolvedValue(mockNotifications);

            const result = await notificationRepo.listByUser(userId, false);

            expect(mockRepo.find).toHaveBeenCalledWith({
                where: { userId },
                order: { createdAt: 'DESC' }
            });
            expect(result).toHaveLength(2);
        });
    });

    // ===================== markRead =====================
    describe('markRead', () => {
        it('should mark a notification as read successfully', async () => {
            const notificationId = 1;
            const userId = 1;
            const mockNotification: NotificationDAO = {
                id: notificationId,
                userId: userId,
                reportId: 10,
                type: 'STATUS_CHANGE',
                message: 'Report updated',
                createdAt: new Date(),
                read: false
            };

            const updatedNotification = { ...mockNotification, read: true };

            mockRepo.findOneByOrFail.mockResolvedValue(mockNotification);
            mockRepo.save.mockResolvedValue(updatedNotification as NotificationDAO);

            const result = await notificationRepo.markRead(notificationId, userId);

            expect(mockRepo.findOneByOrFail).toHaveBeenCalledWith({ id: notificationId });
            expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({ read: true }));
            expect(result.read).toBe(true);
        });

        it('should throw error if notification does not belong to user', async () => {
            const notificationId = 1;
            const userId = 1;
            const wrongUserId = 2;
            const mockNotification: NotificationDAO = {
                id: notificationId,
                userId: wrongUserId,
                reportId: 10,
                type: 'STATUS_CHANGE',
                message: 'Report updated',
                createdAt: new Date(),
                read: false
            };

            mockRepo.findOneByOrFail.mockResolvedValue(mockNotification);

            await expect(notificationRepo.markRead(notificationId, userId))
                .rejects.toThrow('Not allowed to modify this notification');
            expect(mockRepo.save).not.toHaveBeenCalled();
        });

        it('should throw error if notification does not exist', async () => {
            const notificationId = 999;
            const userId = 1;

            mockRepo.findOneByOrFail.mockRejectedValue(new Error('Entity not found'));

            await expect(notificationRepo.markRead(notificationId, userId))
                .rejects.toThrow('Entity not found');
            expect(mockRepo.save).not.toHaveBeenCalled();
        });

        it('should mark an already read notification as read (idempotent)', async () => {
            const notificationId = 1;
            const userId = 1;
            const mockNotification: NotificationDAO = {
                id: notificationId,
                userId: userId,
                reportId: 10,
                type: 'STATUS_CHANGE',
                message: 'Report updated',
                createdAt: new Date(),
                read: true // Already read
            };

            mockRepo.findOneByOrFail.mockResolvedValue(mockNotification);
            mockRepo.save.mockResolvedValue(mockNotification);

            const result = await notificationRepo.markRead(notificationId, userId);

            expect(result.read).toBe(true);
            expect(mockRepo.save).toHaveBeenCalled();
        });
    });

    // ===================== createNotification =====================
    describe('createNotification', () => {
        it('should create a new notification successfully', async () => {
            const notificationData: Partial<NotificationDAO> = {
                userId: 1,
                reportId: 10,
                type: 'STATUS_CHANGE',
                message: 'Test notification',
                read: false
            };

            const createdNotification: NotificationDAO = {
                id: 1,
                userId: 1,
                reportId: 10,
                type: 'STATUS_CHANGE',
                message: 'Test notification',
                createdAt: new Date(),
                read: false
            };

            mockRepo.create.mockReturnValue(createdNotification);
            mockRepo.save.mockResolvedValue(createdNotification);

            const result = await notificationRepo.createNotification(notificationData);

            expect(mockRepo.create).toHaveBeenCalledWith(notificationData);
            expect(mockRepo.save).toHaveBeenCalledWith(createdNotification);
            expect(result).toEqual(createdNotification);
        });

        it('should create notification with minimal data', async () => {
            const notificationData: Partial<NotificationDAO> = {
                userId: 1,
                type: 'OFFICER_MESSAGE',
                message: 'Simple message'
            };

            const createdNotification: NotificationDAO = {
                id: 1,
                userId: 1,
                reportId: null,
                type: 'OFFICER_MESSAGE',
                message: 'Simple message',
                createdAt: new Date(),
                read: false
            };

            mockRepo.create.mockReturnValue(createdNotification);
            mockRepo.save.mockResolvedValue(createdNotification);

            const result = await notificationRepo.createNotification(notificationData);

            expect(mockRepo.create).toHaveBeenCalledWith(notificationData);
            expect(result).toEqual(createdNotification);
        });

        it('should create notification with null reportId', async () => {
            const notificationData: Partial<NotificationDAO> = {
                userId: 5,
                reportId: null,
                type: 'STATUS_CHANGE',
                message: 'General notification',
                read: false
            };

            const createdNotification: NotificationDAO = {
                id: 10,
                ...notificationData as any,
                createdAt: new Date()
            };

            mockRepo.create.mockReturnValue(createdNotification);
            mockRepo.save.mockResolvedValue(createdNotification);

            const result = await notificationRepo.createNotification(notificationData);

            expect(result.reportId).toBeNull();
            expect(mockRepo.save).toHaveBeenCalled();
        });
    });

    // ===================== createStatusChangeNotification =====================
    describe('createStatusChangeNotification', () => {
        it('should create status change notification for non-anonymous report', async () => {
            const mockReport: ReportDAO = {
                id: 10,
                title: 'Test Report',
                author: { id: 1, username: 'user1' } as UserDAO,
                state: 'ASSIGNED',
                reason: null
            } as any;

            const expectedNotification: NotificationDAO = {
                id: 1,
                userId: 1,
                reportId: 10,
                type: 'STATUS_CHANGE',
                message: 'Your report #10 is now ASSIGNED',
                createdAt: new Date(),
                read: false
            };

            mockRepo.save.mockResolvedValue(expectedNotification);

            const result = await notificationRepo.createStatusChangeNotification(mockReport);

            expect(mockRepo.save).toHaveBeenCalledWith({
                userId: 1,
                reportId: 10,
                type: 'STATUS_CHANGE',
                message: 'Your report #10 is now ASSIGNED',
                read: false
            });
            expect(result).toEqual(expectedNotification);
        });

        it('should create notification with declined reason', async () => {
            const mockReport: ReportDAO = {
                id: 15,
                title: 'Test Report',
                author: { id: 2, username: 'user2' } as UserDAO,
                state: 'DECLINED',
                reason: 'Insufficient information'
            } as any;

            const expectedNotification: NotificationDAO = {
                id: 2,
                userId: 2,
                reportId: 15,
                type: 'STATUS_CHANGE',
                message: 'Your report #15 has been DECLINED. Reason: Insufficient information',
                createdAt: new Date(),
                read: false
            };

            mockRepo.save.mockResolvedValue(expectedNotification);

            const result = await notificationRepo.createStatusChangeNotification(mockReport);

            expect(mockRepo.save).toHaveBeenCalledWith({
                userId: 2,
                reportId: 15,
                type: 'STATUS_CHANGE',
                message: 'Your report #15 has been DECLINED. Reason: Insufficient information',
                read: false
            });
            expect(result?.message).toContain('DECLINED');
            expect(result?.message).toContain('Insufficient information');
        });

        it('should create notification with N/A reason when declined without reason', async () => {
            const mockReport: ReportDAO = {
                id: 20,
                title: 'Test Report',
                author: { id: 3, username: 'user3' } as UserDAO,
                state: 'DECLINED',
                reason: null
            } as any;

            const expectedNotification: NotificationDAO = {
                id: 3,
                userId: 3,
                reportId: 20,
                type: 'STATUS_CHANGE',
                message: 'Your report #20 has been DECLINED. Reason: N/A',
                createdAt: new Date(),
                read: false
            };

            mockRepo.save.mockResolvedValue(expectedNotification);

            const result = await notificationRepo.createStatusChangeNotification(mockReport);

            expect(result?.message).toContain('Reason: N/A');
        });

        it('should return null for anonymous report (no author)', async () => {
            const mockReport: ReportDAO = {
                id: 25,
                title: 'Anonymous Report',
                author: null,
                state: 'PENDING',
                anonymity: true
            } as any;

            const result = await notificationRepo.createStatusChangeNotification(mockReport);

            expect(result).toBeNull();
            expect(mockRepo.save).not.toHaveBeenCalled();
        });

        it('should return null for report with author but no author id', async () => {
            const mockReport: ReportDAO = {
                id: 30,
                title: 'Test Report',
                author: { username: 'user4' } as UserDAO, // No id
                state: 'PENDING'
            } as any;

            const result = await notificationRepo.createStatusChangeNotification(mockReport);

            expect(result).toBeNull();
            expect(mockRepo.save).not.toHaveBeenCalled();
        });

        it('should create notification for IN_PROGRESS state', async () => {
            const mockReport: ReportDAO = {
                id: 35,
                title: 'Test Report',
                author: { id: 5, username: 'user5' } as UserDAO,
                state: 'IN_PROGRESS',
                reason: null
            } as any;

            const expectedNotification: NotificationDAO = {
                id: 4,
                userId: 5,
                reportId: 35,
                type: 'STATUS_CHANGE',
                message: 'Your report #35 is now IN_PROGRESS',
                createdAt: new Date(),
                read: false
            };

            mockRepo.save.mockResolvedValue(expectedNotification);

            const result = await notificationRepo.createStatusChangeNotification(mockReport);

            expect(result?.message).toBe('Your report #35 is now IN_PROGRESS');
        });

        it('should create notification for RESOLVED state', async () => {
            const mockReport: ReportDAO = {
                id: 40,
                title: 'Test Report',
                author: { id: 6, username: 'user6' } as UserDAO,
                state: 'RESOLVED',
                reason: null
            } as any;

            const expectedNotification: NotificationDAO = {
                id: 5,
                userId: 6,
                reportId: 40,
                type: 'STATUS_CHANGE',
                message: 'Your report #40 is now RESOLVED',
                createdAt: new Date(),
                read: false
            };

            mockRepo.save.mockResolvedValue(expectedNotification);

            const result = await notificationRepo.createStatusChangeNotification(mockReport);

            expect(result?.message).toBe('Your report #40 is now RESOLVED');
        });
    });

    // ===================== createOfficerMessageNotification =====================
    describe('createOfficerMessageNotification', () => {
        it('should create officer message notification for non-anonymous report', async () => {
            const mockReport: ReportDAO = {
                id: 10,
                title: 'Test Report',
                author: { id: 1, username: 'user1' } as UserDAO,
                state: 'ASSIGNED'
            } as any;

            const officerId = 5;
            const messageText = 'Please provide more details';

            const expectedNotification: NotificationDAO = {
                id: 1,
                userId: 1,
                reportId: 10,
                type: 'OFFICER_MESSAGE',
                message: 'Message from officer #5: Please provide more details',
                createdAt: new Date(),
                read: false
            };

            mockRepo.save.mockResolvedValue(expectedNotification);

            const result = await notificationRepo.createOfficerMessageNotification(
                mockReport,
                officerId,
                messageText
            );

            expect(mockRepo.save).toHaveBeenCalledWith({
                userId: 1,
                reportId: 10,
                type: 'OFFICER_MESSAGE',
                message: 'Message from officer #5: Please provide more details',
                read: false
            });
            expect(result).toEqual(expectedNotification);
            expect(result?.message).toContain(`officer #${officerId}`);
            expect(result?.message).toContain(messageText);
        });

        it('should return null for anonymous report', async () => {
            const mockReport: ReportDAO = {
                id: 15,
                title: 'Anonymous Report',
                author: null,
                state: 'PENDING',
                anonymity: true
            } as any;

            const result = await notificationRepo.createOfficerMessageNotification(
                mockReport,
                5,
                'Test message'
            );

            expect(result).toBeNull();
            expect(mockRepo.save).not.toHaveBeenCalled();
        });

        it('should return null for report with author but no author id', async () => {
            const mockReport: ReportDAO = {
                id: 20,
                title: 'Test Report',
                author: { username: 'user2' } as UserDAO, // No id
                state: 'ASSIGNED'
            } as any;

            const result = await notificationRepo.createOfficerMessageNotification(
                mockReport,
                10,
                'Test message'
            );

            expect(result).toBeNull();
            expect(mockRepo.save).not.toHaveBeenCalled();
        });

        it('should create notification with long message text', async () => {
            const mockReport: ReportDAO = {
                id: 25,
                title: 'Test Report',
                author: { id: 3, username: 'user3' } as UserDAO,
                state: 'IN_PROGRESS'
            } as any;

            const longMessage = 'This is a very long message that contains a lot of information about the report and what needs to be done to resolve it properly.';
            const officerId = 15;

            const expectedNotification: NotificationDAO = {
                id: 2,
                userId: 3,
                reportId: 25,
                type: 'OFFICER_MESSAGE',
                message: `Message from officer #${officerId}: ${longMessage}`,
                createdAt: new Date(),
                read: false
            };

            mockRepo.save.mockResolvedValue(expectedNotification);

            const result = await notificationRepo.createOfficerMessageNotification(
                mockReport,
                officerId,
                longMessage
            );

            expect(result?.message).toContain(longMessage);
            expect(result?.message.length).toBeGreaterThan(100);
        });

        it('should create notification with special characters in message', async () => {
            const mockReport: ReportDAO = {
                id: 30,
                title: 'Test Report',
                author: { id: 4, username: 'user4' } as UserDAO,
                state: 'ASSIGNED'
            } as any;

            const messageText = 'Test with special chars: @#$%^&*()';
            const officerId = 20;

            const expectedNotification: NotificationDAO = {
                id: 3,
                userId: 4,
                reportId: 30,
                type: 'OFFICER_MESSAGE',
                message: `Message from officer #${officerId}: ${messageText}`,
                createdAt: new Date(),
                read: false
            };

            mockRepo.save.mockResolvedValue(expectedNotification);

            const result = await notificationRepo.createOfficerMessageNotification(
                mockReport,
                officerId,
                messageText
            );

            expect(result?.message).toContain(messageText);
        });

        it('should create notification with empty message text', async () => {
            const mockReport: ReportDAO = {
                id: 35,
                title: 'Test Report',
                author: { id: 5, username: 'user5' } as UserDAO,
                state: 'ASSIGNED'
            } as any;

            const officerId = 25;
            const emptyMessage = '';

            const expectedNotification: NotificationDAO = {
                id: 4,
                userId: 5,
                reportId: 35,
                type: 'OFFICER_MESSAGE',
                message: `Message from officer #${officerId}: `,
                createdAt: new Date(),
                read: false
            };

            mockRepo.save.mockResolvedValue(expectedNotification);

            const result = await notificationRepo.createOfficerMessageNotification(
                mockReport,
                officerId,
                emptyMessage
            );

            expect(result?.message).toBe(`Message from officer #${officerId}: `);
        });
    });
});