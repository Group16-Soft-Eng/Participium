import "reflect-metadata";
import { loginUser, loginOfficer } from "../../../../src/controllers/authController";
import { UserRepository } from "../../../../src/repositories/UserRepository";
import { OfficerRepository } from "../../../../src/repositories/OfficerRepository";
import { verifyPassword, generateToken } from "../../../../src/services/authService";
import { UnauthorizedError } from "../../../../src/utils/utils";

// Mock dei moduli
jest.mock("../../../../src/repositories/UserRepository");
jest.mock("../../../../src/repositories/OfficerRepository");
jest.mock("../../../../src/services/authService");

describe("AuthController Unit Tests", () => {
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockOfficerRepo: jest.Mocked<OfficerRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUserRepo = new UserRepository() as jest.Mocked<UserRepository>;
    mockOfficerRepo = new OfficerRepository() as jest.Mocked<OfficerRepository>;
    
    (UserRepository as jest.MockedClass<typeof UserRepository>).mockImplementation(() => mockUserRepo);
    (OfficerRepository as jest.MockedClass<typeof OfficerRepository>).mockImplementation(() => mockOfficerRepo);
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

      mockUserRepo.getUserByUsername = jest.fn().mockResolvedValue(mockUser);
      (verifyPassword as jest.Mock).mockResolvedValue(true);
      (generateToken as jest.Mock).mockReturnValue("mock-token");

      const result = await loginUser("testuser", "password123", false);

      expect(result).toBe("mock-token");
      expect(mockUserRepo.getUserByUsername).toHaveBeenCalledWith("testuser");
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

      mockUserRepo.getUserByEmail = jest.fn().mockResolvedValue(mockUser);
      (verifyPassword as jest.Mock).mockResolvedValue(true);
      (generateToken as jest.Mock).mockReturnValue("mock-token");

      const result = await loginUser("test@example.com", "password123", true);

      expect(result).toBe("mock-token");
      expect(mockUserRepo.getUserByEmail).toHaveBeenCalledWith("test@example.com");
    });

    it("dovrebbe lanciare UnauthorizedError con password errata", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        password: "hashedpassword"
      };

      mockUserRepo.getUserByUsername = jest.fn().mockResolvedValue(mockUser);
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

      mockOfficerRepo.getOfficerByEmail = jest.fn().mockResolvedValue(mockOfficer);
      (verifyPassword as jest.Mock).mockResolvedValue(true);
      (generateToken as jest.Mock).mockReturnValue("mock-officer-token");

      const result = await loginOfficer("officer@example.com", "password123", true);

      expect(result).toBe("mock-officer-token");
      expect(mockOfficerRepo.getOfficerByEmail).toHaveBeenCalledWith("officer@example.com");
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

      mockOfficerRepo.getOfficersByUsername = jest.fn().mockResolvedValue([mockOfficer]);
      (verifyPassword as jest.Mock).mockResolvedValue(true);
      (generateToken as jest.Mock).mockReturnValue("mock-officer-token");

      const result = await loginOfficer("officer1", "password123", false);

      expect(result).toBe("mock-officer-token");
      expect(mockOfficerRepo.getOfficersByUsername).toHaveBeenCalledWith("officer1");
    });

    it("dovrebbe lanciare UnauthorizedError con password errata", async () => {
      const mockOfficer = {
        id: 1,
        email: "officer@example.com",
        password: "hashedpassword",
        role: "ROLE_1"
      };

      mockOfficerRepo.getOfficerByEmail = jest.fn().mockResolvedValue(mockOfficer);
      (verifyPassword as jest.Mock).mockResolvedValue(false);

      await expect(loginOfficer("officer@example.com", "wrongpassword", true))
        .rejects
        .toThrow(UnauthorizedError);
    });

    it("dovrebbe lanciare UnauthorizedError quando username non esiste", async () => {
      mockOfficerRepo.getOfficersByUsername = jest.fn().mockResolvedValue([]);

      await expect(loginOfficer("nonexistent", "password123", false))
        .rejects
        .toThrow(UnauthorizedError);
    });
  });
});
