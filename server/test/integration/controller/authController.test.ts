import "reflect-metadata";
jest.mock('@services/authService', () => {
  const original = jest.requireActual('@services/authService');
  return {
    ...original,
    saveSession: jest.fn().mockResolvedValue(undefined),
  };
});

import { initializeTestDatabase, closeTestDatabase, clearDatabase } from "../../setup/test-datasource";
import { UserRepository } from "../../../src/repositories/UserRepository";
import { OfficerRepository } from "../../../src/repositories/OfficerRepository";
import { MaintainerRepository } from "../../../src/repositories/MaintainerRepository";
import * as authController from "../../../src/controllers/authController";
import { OfficerRole } from "../../../src/models/enums/OfficerRole";
import { OfficeType } from "../../../src/models/enums/OfficeType";
import * as authService from "../../../src/services/authService";

describe("Auth Controller Integration Tests", () => {
  let userRepo: UserRepository;
  let officerRepo: OfficerRepository;
  let maintainerRepo: MaintainerRepository;

  beforeAll(async () => {
    await initializeTestDatabase();
    userRepo = new UserRepository();
    officerRepo = new OfficerRepository();
    maintainerRepo = new MaintainerRepository();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  // Helper function to create and activate a user
  async function createActiveUser(username: string, firstName: string, lastName: string, email: string, password: string) {
    const user = await userRepo.createUser(username, firstName, lastName, email, password);
    const repo = (userRepo as any).repo;
    user.isActive = true;
    await repo.save(user);
    return user;
  }

  // ===================== loginUserByUsername =====================
  describe("loginUserByUsername", () => {
    it("should login user with valid username and password", async () => {
      await createActiveUser("testuser", "Test", "User", "test@example.com", "Password@123");
      const token = await authController.loginUserByUsername("testuser", "Password@123");

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(authService.saveSession).toHaveBeenCalled();
    });

    it("should throw error when user not found", async () => {
      await expect(authController.loginUserByUsername("nonexistent", "Password@123"))
        .rejects.toThrow("User with username 'nonexistent' not found");
    });

    it("should throw error when password is incorrect", async () => {
      await createActiveUser("testuser2", "Test", "User", "test2@example.com", "Password@123");

      await expect(authController.loginUserByUsername("testuser2", "WrongPassword"))
        .rejects.toThrow("Invalid username or password");
    });

    it("should throw error when user is not active", async () => {
      await userRepo.createUser("inactive", "Inactive", "User", "inactive@example.com", "Password@123");

      await expect(authController.loginUserByUsername("inactive", "Password@123"))
        .rejects.toThrow("User account is not active");
    });
  });

  // ===================== loginUserByMail =====================
  describe("loginUserByMail", () => {
    it("should login user with valid email and password", async () => {
      await createActiveUser("emailuser", "Email", "User", "email@example.com", "Password@123");

      const token = await authController.loginUserByMail("email@example.com", "Password@123");

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(authService.saveSession).toHaveBeenCalled();
    });

    it("should throw error when email not found", async () => {
      await expect(authController.loginUserByMail("nonexistent@example.com", "Password@123"))
        .rejects.toThrow("User with email 'nonexistent@example.com' not found");
    });

    it("should throw error when password is incorrect", async () => {
      await createActiveUser("testuser3", "Test", "User", "test3@example.com", "Password@123");

      await expect(authController.loginUserByMail("test3@example.com", "WrongPassword"))
        .rejects.toThrow("Invalid email or password");
    });

    it("should throw error when user is not active", async () => {
      await userRepo.createUser("inactive2", "Inactive", "User", "inactive2@example.com", "Password@123");

      await expect(authController.loginUserByMail("inactive2@example.com", "Password@123"))
        .rejects.toThrow("User account is not active");
    });
  });

  // ===================== loginUser =====================
  describe("loginUser", () => {
    it("should login user with email when isEmail is true", async () => {
      await createActiveUser("user1", "User", "One", "user1@example.com", "Password@123");

      const token = await authController.loginUser("user1@example.com", "Password@123", true);

      expect(token).toBeDefined();
    });

    it("should login user with username when isEmail is false", async () => {
      await createActiveUser("user2", "User", "Two", "user2@example.com", "Password@123");

      const token = await authController.loginUser("user2", "Password@123", false);

      expect(token).toBeDefined();
    });
  });

  // ===================== loginOfficerByMail =====================
  describe("loginOfficerByMail", () => {
    it("should login officer with valid email and password", async () => {
      await officerRepo.createOfficer(
        "officer1",
        "Officer",
        "One",
        "officer1@example.com",
        "Password@123",
        [{ role: OfficerRole.MUNICIPAL_ADMINISTRATOR, office: null }]
      );

      const token = await authController.loginOfficerByMail("officer1@example.com", "Password@123");

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(authService.saveSession).toHaveBeenCalled();
    });

    it("should login officer with multiple roles", async () => {
      await officerRepo.createOfficer(
        "multirole",
        "Multi",
        "Role",
        "multirole@example.com",
        "Password@123",
        [
          { role: OfficerRole.MUNICIPAL_ADMINISTRATOR, office: null },
          { role: OfficerRole.TECHNICAL_OFFICE_STAFF, office: OfficeType.INFRASTRUCTURE }
        ]
      );

      const token = await authController.loginOfficerByMail("multirole@example.com", "Password@123");

      expect(token).toBeDefined();
    });

    it("should throw error when officer not found", async () => {
      await expect(authController.loginOfficerByMail("nonexistent@example.com", "Password@123"))
        .rejects.toThrow("Officer with email 'nonexistent@example.com' not found");
    });

    it("should throw error when password is incorrect", async () => {
      await officerRepo.createOfficer(
        "officer2",
        "Officer",
        "Two",
        "officer2@example.com",
        "Password@123",
        [{ role: OfficerRole.MUNICIPAL_ADMINISTRATOR, office: null }]
      );

      await expect(authController.loginOfficerByMail("officer2@example.com", "WrongPassword"))
        .rejects.toThrow("Invalid email or password");
    });
  });

  // ===================== loginOfficerByUsername =====================
  describe("loginOfficerByUsername", () => {
    it("should login officer with valid username and password", async () => {
      await officerRepo.createOfficer(
        "officer3",
        "Officer",
        "Three",
        "officer3@example.com",
        "Password@123",
        [{ role: OfficerRole.MUNICIPAL_ADMINISTRATOR, office: null }]
      );

      const token = await authController.loginOfficerByUsername("officer3", "Password@123");

      expect(token).toBeDefined();
      expect(authService.saveSession).toHaveBeenCalled();
    });

    it("should throw error when officer not found", async () => {
      await expect(authController.loginOfficerByUsername("nonexistent", "Password@123"))
        .rejects.toThrow("Invalid username or password");
    });

    it("should throw error when password is incorrect", async () => {
      await officerRepo.createOfficer(
        "officer4",
        "Officer",
        "Four",
        "officer4@example.com",
        "Password@123",
        [{ role: OfficerRole.MUNICIPAL_ADMINISTRATOR, office: null }]
      );

      await expect(authController.loginOfficerByUsername("officer4", "WrongPassword"))
        .rejects.toThrow("Invalid username or password");
    });
  });

  // ===================== loginOfficer =====================
  describe("loginOfficer", () => {
    it("should login officer with email when isEmail is true", async () => {
      await officerRepo.createOfficer(
        "officer5",
        "Officer",
        "Five",
        "officer5@example.com",
        "Password@123",
        [{ role: OfficerRole.MUNICIPAL_ADMINISTRATOR, office: null }]
      );

      const token = await authController.loginOfficer("officer5@example.com", "Password@123", true);

      expect(token).toBeDefined();
    });

    it("should login officer with username when isEmail is false", async () => {
      await officerRepo.createOfficer(
        "officer6",
        "Officer",
        "Six",
        "officer6@example.com",
        "Password@123",
        [{ role: OfficerRole.MUNICIPAL_ADMINISTRATOR, office: null }]
      );

      const token = await authController.loginOfficer("officer6", "Password@123", false);

      expect(token).toBeDefined();
    });
  });

  // ===================== getUserByTelegramUsername =====================
  describe("getUserByTelegramUsername", () => {
    it("should login user with telegram username", async () => {
      const user = await createActiveUser("telegram", "Telegram", "User", "telegram@example.com", "Password@123");
      await userRepo.updateProfile(user.id, { telegramUsername: "telegram_user" });

      const token = await authController.getUserByTelegramUsername("telegram_user");

      expect(token).toBeDefined();
      expect(authService.saveSession).toHaveBeenCalled();
    });

    it("should throw error when telegram username not found", async () => {
      await expect(authController.getUserByTelegramUsername("nonexistent_tg"))
        .rejects.toThrow("User with telegram username 'nonexistent_tg' not found");
    });
  });

  // ===================== loginMaintainerByMail =====================
  describe("loginMaintainerByMail", () => {
    it("should login maintainer with valid email and password", async () => {
      await maintainerRepo.createMaintainer(
        "Maintainer One",
        "maintainer1@example.com",
        "Password@123",
        [OfficeType.INFRASTRUCTURE],
        true
      );

      const token = await authController.loginMaintainerByMail("maintainer1@example.com", "Password@123");

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(authService.saveSession).toHaveBeenCalled();
    });

    it("should login maintainer with multiple categories", async () => {
      await maintainerRepo.createMaintainer(
        "Multi Maintainer",
        "multi@example.com",
        "Password@123",
        [OfficeType.INFRASTRUCTURE, OfficeType.ENVIRONMENT],
        true
      );

      const token = await authController.loginMaintainerByMail("multi@example.com", "Password@123");

      expect(token).toBeDefined();
    });

    it("should throw error when maintainer not found", async () => {
      await expect(authController.loginMaintainerByMail("nonexistent@example.com", "Password@123"))
        .rejects.toThrow("Maintainer with email 'nonexistent@example.com' not found");
    });

    it("should throw error when password is incorrect", async () => {
      await maintainerRepo.createMaintainer(
        "Maintainer Two",
        "maintainer2@example.com",
        "Password@123",
        [OfficeType.INFRASTRUCTURE],
        true
      );

      await expect(authController.loginMaintainerByMail("maintainer2@example.com", "WrongPassword"))
        .rejects.toThrow("Invalid email or password");
    });
  });

  // ===================== loginMaintainerByUsername =====================
  describe("loginMaintainerByUsername", () => {
    it("should login maintainer with valid username and password", async () => {
      await maintainerRepo.createMaintainer(
        "Maintainer Three",
        "maintainer3@example.com",
        "Password@123",
        [OfficeType.INFRASTRUCTURE],
        true
      );

      const token = await authController.loginMaintainerByUsername("Maintainer Three", "Password@123");

      expect(token).toBeDefined();
      expect(authService.saveSession).toHaveBeenCalled();
    });

    it("should throw error when maintainer not found", async () => {
      await expect(authController.loginMaintainerByUsername("Nonexistent Maintainer", "Password@123"))
        .rejects.toThrow("Invalid username or password");
    });

    it("should throw error when password is incorrect", async () => {
      await maintainerRepo.createMaintainer(
        "Maintainer Four",
        "maintainer4@example.com",
        "Password@123",
        [OfficeType.INFRASTRUCTURE],
        true
      );

      await expect(authController.loginMaintainerByUsername("Maintainer Four", "WrongPassword"))
        .rejects.toThrow("Invalid username or password");
    });
  });

  // ===================== loginMaintainer =====================
  describe("loginMaintainer", () => {
    it("should login maintainer with email when isEmail is true", async () => {
      await maintainerRepo.createMaintainer(
        "Maintainer Five",
        "maintainer5@example.com",
        "Password@123",
        [OfficeType.INFRASTRUCTURE],
        true
      );

      const token = await authController.loginMaintainer("maintainer5@example.com", "Password@123", true);

      expect(token).toBeDefined();
    });

    it("should login maintainer with username when isEmail is false", async () => {
      await maintainerRepo.createMaintainer(
        "Maintainer Six",
        "maintainer6@example.com",
        "Password@123",
        [OfficeType.INFRASTRUCTURE],
        true
      );

      const token = await authController.loginMaintainer("Maintainer Six", "Password@123", false);

      expect(token).toBeDefined();
    });
  });

  // ===================== Edge Cases and Security =====================
  describe("Edge Cases and Security", () => {
    it("should handle user without password field", async () => {
      const user = await createActiveUser("nopass", "No", "Pass", "nopass@example.com", "Password@123");
      const repo = (userRepo as any).repo;
      user.password = "";
      await repo.save(user);

      await expect(authController.loginUserByUsername("nopass", "Password@123"))
        .rejects.toThrow("Invalid username or password");
    });

    it("should handle officer without password field", async () => {
      const officer = await officerRepo.createOfficer(
        "nopassofficer",
        "No",
        "Pass",
        "nopass@officer.com",
        "Password@123",
        [{ role: OfficerRole.MUNICIPAL_ADMINISTRATOR, office: null }]
      );
      const repo = (officerRepo as any).repo;
      officer.password = "";
      await repo.save(officer);

      await expect(authController.loginOfficerByMail("nopass@officer.com", "Password@123"))
        .rejects.toThrow("Invalid email or password");
    });

    it("should handle maintainer without password field", async () => {
      const maintainer = await maintainerRepo.createMaintainer(
        "No Pass Maintainer",
        "nopass@maintainer.com",
        "Password@123",
        [OfficeType.INFRASTRUCTURE],
        true
      );
      const repo = (maintainerRepo as any).repo;
      maintainer.password = "";
      await repo.save(maintainer);

      await expect(authController.loginMaintainerByMail("nopass@maintainer.com", "Password@123"))
        .rejects.toThrow("Invalid email or password");
    });

    it("should generate different tokens for different users", async () => {
      await createActiveUser("user1", "User", "One", "user1@test.com", "Password@123");
      await createActiveUser("user2", "User", "Two", "user2@test.com", "Password@123");

      const token1 = await authController.loginUserByUsername("user1", "Password@123");
      const token2 = await authController.loginUserByUsername("user2", "Password@123");

      expect(token1).not.toBe(token2);
    });

    it("should handle officer with no roles", async () => {
      await officerRepo.createOfficer(
        "noroles",
        "No",
        "Roles",
        "noroles@example.com",
        "Password@123",
        []
      );

      const token = await authController.loginOfficerByMail("noroles@example.com", "Password@123");

      expect(token).toBeDefined();
    });
  });
});