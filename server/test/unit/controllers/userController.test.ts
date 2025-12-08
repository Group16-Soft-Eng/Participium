import "reflect-metadata";
import {
  createUser,
  getUser,
  getAllUsers,
  deleteUser,
  getMyProfile,
  updateMyProfile,
  logoutUser
} from "../../../src/controllers/userController";
import { UserRepository } from "../../../src/repositories/UserRepository";
import { mapUserDAOToDTO } from "../../../src/services/mapperService";
import { blacklistUserSessions, getSession } from "../../../src/services/authService";

jest.mock("../../../src/repositories/UserRepository");
jest.mock("../../../src/services/mapperService");
jest.mock("../../../src/services/authService");

describe("UserController Unit Tests", () => {
  let mockUserRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRepo = new UserRepository() as jest.Mocked<UserRepository>;
    (UserRepository as jest.MockedClass<typeof UserRepository>).mockImplementation(() => mockUserRepo);
  });

  describe("createUser", () => {
    it("dovrebbe creare un nuovo utente con successo", async () => {
      const userDto = {
        username: "newuser",
        firstName: "Mario",
        lastName: "Rossi",
        email: "mario@example.com",
        password: "password123"
      };
      const mockCreatedUser = { ...userDto, id: 1 };
      mockUserRepo.createUser = jest.fn().mockResolvedValue(mockCreatedUser);
      (mapUserDAOToDTO as jest.Mock).mockReturnValue(mockCreatedUser);

      const result = await createUser(userDto as any);

      expect(mockUserRepo.createUser).toHaveBeenCalledWith(
        "newuser",
        "Mario",
        "Rossi",
        "mario@example.com",
        "password123"
      );
      expect(mapUserDAOToDTO).toHaveBeenCalledWith(mockCreatedUser);
      expect(result).toEqual(mockCreatedUser);
    });

    it("dovrebbe lanciare errore se l'email non è valida", async () => {
      const userDto = {
        username: "newuser",
        firstName: "Mario",
        lastName: "Rossi",
        email: "invalid-email",
        password: "password123"
      };
      await expect(createUser(userDto as any)).rejects.toThrow("Invalid email format");
    });
  });

  describe("getUser", () => {
    it("dovrebbe recuperare un utente per username", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        email: "test@example.com"
      };
      mockUserRepo.getUserByUsername = jest.fn().mockResolvedValue(mockUser);
      (mapUserDAOToDTO as jest.Mock).mockReturnValue(mockUser);

      const result = await getUser("testuser");

      expect(mockUserRepo.getUserByUsername).toHaveBeenCalledWith("testuser");
      expect(mapUserDAOToDTO).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });

    it("dovrebbe gestire utente non trovato", async () => {
      mockUserRepo.getUserByUsername = jest.fn().mockResolvedValue(null);
      (mapUserDAOToDTO as jest.Mock).mockReturnValue(null);

      const result = await getUser("notfound");
      expect(mockUserRepo.getUserByUsername).toHaveBeenCalledWith("notfound");
      expect(result).toBeNull();
    });
  });

  describe("getAllUsers", () => {
    it("dovrebbe recuperare tutti gli utenti", async () => {
      const mockUsers = [
        { id: 1, username: "user1", firstName: "First", lastName: "User", email: "user1@example.com" },
        { id: 2, username: "user2", firstName: "Second", lastName: "User", email: "user2@example.com" }
      ];
      mockUserRepo.getAllUsers = jest.fn().mockResolvedValue(mockUsers);
      (mapUserDAOToDTO as jest.Mock).mockImplementation((user) => user);

      const result = await getAllUsers();

      expect(mockUserRepo.getAllUsers).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(mapUserDAOToDTO).toHaveBeenCalledTimes(2);
    });

    it("dovrebbe restituire un array vuoto quando non ci sono utenti", async () => {
      mockUserRepo.getAllUsers = jest.fn().mockResolvedValue([]);

      const result = await getAllUsers();

      expect(result).toEqual([]);
    });
  });

  describe("deleteUser", () => {
    it("dovrebbe eliminare un utente per username", async () => {
      mockUserRepo.deleteUser = jest.fn().mockResolvedValue(undefined);

      await deleteUser("testuser");

      expect(mockUserRepo.deleteUser).toHaveBeenCalledWith("testuser");
    });
  });

  describe("getMyProfile", () => {
    it("dovrebbe restituire il profilo utente con i campi extra", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        avatar: "/avatar.png",
        telegramUsername: "telegram_user",
        emailNotifications: false
      };
      mockUserRepo.getUserById = jest.fn().mockResolvedValue(mockUser);
      (mapUserDAOToDTO as jest.Mock).mockReturnValue({ ...mockUser });

      const result = await getMyProfile(1);

      expect(mockUserRepo.getUserById).toHaveBeenCalledWith(1);
      expect(result.avatar).toBe("/avatar.png");
      expect(result.telegramUsername).toBe("telegram_user");
      expect(result.emailNotifications).toBe(false);
    });

    it("dovrebbe gestire avatar/telegram/emailNotifications null", async () => {
      const mockUser = {
        id: 2,
        username: "testuser2",
        firstName: "Test2",
        lastName: "User2",
        email: "test2@example.com",
        avatar: undefined,
        telegramUsername: undefined,
        emailNotifications: undefined
      };
      mockUserRepo.getUserById = jest.fn().mockResolvedValue(mockUser);
      (mapUserDAOToDTO as jest.Mock).mockReturnValue({ ...mockUser });

      const result = await getMyProfile(2);

      expect(result.avatar).toBeNull();
      expect(result.telegramUsername).toBeNull();
      expect(result.emailNotifications).toBe(true);
    });
  });

  describe("updateMyProfile", () => {
    it("dovrebbe aggiornare il profilo utente", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        avatar: "/avatar.png",
        telegramUsername: "telegram_user",
        emailNotifications: true
      };
      mockUserRepo.getUserById = jest.fn().mockResolvedValue(mockUser);
      mockUserRepo.updateProfile = jest.fn().mockResolvedValue({ ...mockUser, telegramUsername: "new_telegram" });
      (mapUserDAOToDTO as jest.Mock).mockReturnValue({ ...mockUser, telegramUsername: "new_telegram" });
      (getSession as jest.Mock).mockResolvedValue({ token: "t", sessionType: "telegram", createdAt: Date.now() });
      (blacklistUserSessions as jest.Mock).mockResolvedValue(undefined);

      const result = await updateMyProfile(1, { telegramUsername: "new_telegram", emailNotifications: true, avatarPath: "/avatar.png" });

      expect(mockUserRepo.updateProfile).toHaveBeenCalledWith(1, {
        telegramUsername: "new_telegram",
        emailNotifications: true,
        avatarPath: "/avatar.png"
      });
      expect(getSession).toHaveBeenCalledWith(1, "telegram");
      expect(blacklistUserSessions).toHaveBeenCalledWith(1, "telegram", "telegram_username_changed");
      expect(result.telegramUsername).toBe("new_telegram");
    });

    it("non dovrebbe invalidare la sessione se telegramUsername non cambia", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        avatar: "/avatar.png",
        telegramUsername: "same_telegram",
        emailNotifications: true
      };
      mockUserRepo.getUserById = jest.fn().mockResolvedValue(mockUser);
      mockUserRepo.updateProfile = jest.fn().mockResolvedValue(mockUser);
      (mapUserDAOToDTO as jest.Mock).mockReturnValue(mockUser);

      const result = await updateMyProfile(1, { telegramUsername: "same_telegram", emailNotifications: true });

      expect(getSession).not.toHaveBeenCalled();
      expect(blacklistUserSessions).not.toHaveBeenCalled();
      expect(result.telegramUsername).toBe("same_telegram");
    });
  });

  describe("logoutUser", () => {
    it("dovrebbe semplicemente risolvere senza fare nulla", async () => {
      await expect(logoutUser()).resolves.toBeUndefined();
    });
  });
});
