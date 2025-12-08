import "reflect-metadata";
import {
  loginUser,
  loginOfficer,
  getUserByTelegramUsername,
  loginUserByMail,
  loginUserByUsername,
  loginOfficerByMail,
  loginOfficerByUsername
} from "../../../src/controllers/authController";
import { UserRepository } from "../../../src/repositories/UserRepository";
import { OfficerRepository } from "../../../src/repositories/OfficerRepository";
import { verifyPassword, generateToken, saveSession } from "../../../src/services/authService";
import { UnauthorizedError } from "../../../src/utils/utils";

jest.mock("../../../src/services/authService");

describe("AuthController Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loginUser", () => {
    it("dovrebbe restituire un token con credenziali valide (username)", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "hashedpassword"
      };

      // Spy sui metodi del repository
      jest.spyOn(UserRepository.prototype, 'getUserByUsername').mockResolvedValue(mockUser as any);
      (verifyPassword as jest.Mock).mockResolvedValue(true);
      (generateToken as jest.Mock).mockReturnValue("mock-token");

      const result = await loginUser("testuser", "password123", false);

      expect(result).toBe("mock-token");
      expect(UserRepository.prototype.getUserByUsername).toHaveBeenCalledWith("testuser");
      expect(verifyPassword).toHaveBeenCalledWith("password123", "hashedpassword");
      expect(generateToken).toHaveBeenCalledWith({
        id: 1,
        username: "testuser",
        type: "user"
      });
    });

    it("dovrebbe restituire un token con credenziali valide (email)", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "hashedpassword"
      };

      jest.spyOn(UserRepository.prototype, 'getUserByEmail').mockResolvedValue(mockUser as any);
      (verifyPassword as jest.Mock).mockResolvedValue(true);
      (generateToken as jest.Mock).mockReturnValue("mock-token");

      const result = await loginUser("test@example.com", "password123", true);

      expect(result).toBe("mock-token");
      expect(UserRepository.prototype.getUserByEmail).toHaveBeenCalledWith("test@example.com");
    });

    it("dovrebbe lanciare UnauthorizedError con password errata", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        password: "hashedpassword"
      };

      jest.spyOn(UserRepository.prototype, 'getUserByUsername').mockResolvedValue(mockUser as any);
      (verifyPassword as jest.Mock).mockResolvedValue(false);

      await expect(loginUser("testuser", "wrongpassword", false))
        .rejects
        .toThrow(UnauthorizedError);
    });
  });

  describe("loginOfficer", () => {
    it("dovrebbe restituire un token con credenziali valide (email)", async () => {
      const mockOfficer = {
        id: 1,
        username: "officer1",
        email: "officer@example.com",
        password: "hashedpassword",
        role: "ROLE_1"
      };

      jest.spyOn(OfficerRepository.prototype, 'getOfficerByEmail').mockResolvedValue(mockOfficer as any);
      (verifyPassword as jest.Mock).mockResolvedValue(true);
      (generateToken as jest.Mock).mockReturnValue("mock-officer-token");

      const result = await loginOfficer("officer@example.com", "password123", true);

      expect(result).toBe("mock-officer-token");
      expect(OfficerRepository.prototype.getOfficerByEmail).toHaveBeenCalledWith("officer@example.com");
      expect(generateToken).toHaveBeenCalledWith({
        id: 1,
        username: "officer@example.com",
        type: "ROLE_1"
      });
    });

    it("dovrebbe restituire un token con credenziali valide (username)", async () => {
      const mockOfficer = {
        id: 1,
        username: "officer1",
        email: "officer@example.com",
        password: "hashedpassword",
        role: "ROLE_1"
      };

      jest.spyOn(OfficerRepository.prototype, 'getOfficersByUsername').mockResolvedValue([mockOfficer] as any);
      (verifyPassword as jest.Mock).mockResolvedValue(true);
      (generateToken as jest.Mock).mockReturnValue("mock-officer-token");

      const result = await loginOfficer("officer1", "password123", false);

      expect(result).toBe("mock-officer-token");
      expect(OfficerRepository.prototype.getOfficersByUsername).toHaveBeenCalledWith("officer1");
    });

    it("dovrebbe lanciare UnauthorizedError con password errata", async () => {
      const mockOfficer = {
        id: 1,
        email: "officer@example.com",
        password: "hashedpassword",
        role: "ROLE_1"
      };

      jest.spyOn(OfficerRepository.prototype, 'getOfficerByEmail').mockResolvedValue(mockOfficer as any);
      (verifyPassword as jest.Mock).mockResolvedValue(false);

      await expect(loginOfficer("officer@example.com", "wrongpassword", true))
        .rejects
        .toThrow(UnauthorizedError);
    });

    it("dovrebbe lanciare UnauthorizedError quando username non esiste", async () => {
      jest.spyOn(OfficerRepository.prototype, 'getOfficersByUsername').mockResolvedValue([] as any);

      await expect(loginOfficer("nonexistent", "password123", false))
        .rejects
        .toThrow(UnauthorizedError);
    });
  });

  describe("loginUserByMail", () => {
    it("should throw UnauthorizedError if user has no password", async () => {
      jest.spyOn(UserRepository.prototype, 'getUserByEmail').mockResolvedValue({ password: undefined } as any);
      await expect(loginUserByMail("mail@domain.com", "pass")).rejects.toThrow(UnauthorizedError);
    });

    it("should throw UnauthorizedError if password is invalid", async () => {
      jest.spyOn(UserRepository.prototype, 'getUserByEmail').mockResolvedValue({ password: "hashed" } as any);
      (verifyPassword as jest.Mock).mockResolvedValue(false);
      await expect(loginUserByMail("mail@domain.com", "wrong")).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("loginUserByUsername", () => {
    it("should throw UnauthorizedError if user has no password", async () => {
      jest.spyOn(UserRepository.prototype, 'getUserByUsername').mockResolvedValue({ password: undefined } as any);
      await expect(loginUserByUsername("user", "pass")).rejects.toThrow(UnauthorizedError);
    });

    it("should throw UnauthorizedError if password is invalid", async () => {
      jest.spyOn(UserRepository.prototype, 'getUserByUsername').mockResolvedValue({ password: "hashed" } as any);
      (verifyPassword as jest.Mock).mockResolvedValue(false);
      await expect(loginUserByUsername("user", "wrong")).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("loginOfficerByMail", () => {
    it("should throw UnauthorizedError if officer has no password", async () => {
      jest.spyOn(OfficerRepository.prototype, 'getOfficerByEmail').mockResolvedValue({ password: undefined } as any);
      await expect(loginOfficerByMail("mail@domain.com", "pass")).rejects.toThrow(UnauthorizedError);
    });

    it("should throw UnauthorizedError if password is invalid", async () => {
      jest.spyOn(OfficerRepository.prototype, 'getOfficerByEmail').mockResolvedValue({ password: "hashed" } as any);
      (verifyPassword as jest.Mock).mockResolvedValue(false);
      await expect(loginOfficerByMail("mail@domain.com", "wrong")).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("loginOfficerByUsername", () => {
    it("should throw UnauthorizedError if officers array is empty", async () => {
      jest.spyOn(OfficerRepository.prototype, 'getOfficersByUsername').mockResolvedValue([]);
      await expect(loginOfficerByUsername("user", "pass")).rejects.toThrow(UnauthorizedError);
    });

    it("should throw UnauthorizedError if officer has no password", async () => {
      jest.spyOn(OfficerRepository.prototype, 'getOfficersByUsername').mockResolvedValue([{ password: undefined }] as any);
      await expect(loginOfficerByUsername("user", "pass")).rejects.toThrow(UnauthorizedError);
    });

    it("should throw UnauthorizedError if password is invalid", async () => {
      jest.spyOn(OfficerRepository.prototype, 'getOfficersByUsername').mockResolvedValue([{ password: "hashed" }] as any);
      (verifyPassword as jest.Mock).mockResolvedValue(false);
      await expect(loginOfficerByUsername("user", "wrong")).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("getUserByTelegramUsername", () => {
    it("should return token for valid telegram username", async () => {
      const mockUser = { id: 1, username: "testuser" };
      jest.spyOn(UserRepository.prototype, 'getUseryTelegramUsername').mockResolvedValue(mockUser as any);
      (generateToken as jest.Mock).mockReturnValue("telegram-token");
      (saveSession as jest.Mock).mockResolvedValue(undefined);

      const result = await getUserByTelegramUsername("my_telegram");
      expect(result).toBe("telegram-token");
      expect(UserRepository.prototype.getUseryTelegramUsername).toHaveBeenCalledWith("my_telegram");
      expect(generateToken).toHaveBeenCalledWith({
        id: 1,
        username: "testuser",
        type: "user",
        sessionType: "telegram"
      });
      expect(saveSession).toHaveBeenCalledWith(1, "telegram-token", "telegram");
    });

    it("should throw UnauthorizedError if user not found", async () => {
      await expect(getUserByTelegramUsername("notfound")).rejects.toThrow(UnauthorizedError);
    });
  });
});
