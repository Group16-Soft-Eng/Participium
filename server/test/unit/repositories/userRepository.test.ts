import "reflect-metadata";
import { UserRepository } from "../../../src/repositories/UserRepository";
import { OfficerRepository } from "../../../src/repositories/OfficerRepository";
import { UserDAO } from "../../../src/models/dao/UserDAO";
import { Repository } from "typeorm";
import { AppDataSource } from "../../../src/database/connection";
import { hashPassword } from "../../../src/services/authService";
import { NotFoundError, ConflictError } from "../../../src/utils/utils";

// Mock dei moduli
jest.mock("../../../src/services/authService");

describe("UserRepository Unit Tests", () => {
  let userRepository: UserRepository;
  let mockRepo: jest.Mocked<Repository<UserDAO>>;

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

    userRepository = new UserRepository();
  });

  describe("getAllUsers", () => {
    it("dovrebbe restituire tutti gli utenti", async () => {
      const mockUsers: UserDAO[] = [
        {
          id: 1,
          username: "user1",
          firstName: "First",
          lastName: "User",
          email: "user1@example.com",
          password: "hash1",
        avatar: null,
        telegramUsername: null,
        emailNotifications: false
        },
        {
          id: 2,
          username: "user2",
          firstName: "Second",
          lastName: "User",
          email: "user2@example.com",
          password: "hash2",
        avatar: null,
        telegramUsername: null,
        emailNotifications: false
        }
      ];

      mockRepo.find.mockResolvedValue(mockUsers);

      const result = await userRepository.getAllUsers();

      expect(result).toEqual(mockUsers);
      expect(mockRepo.find).toHaveBeenCalledTimes(1);
    });
  });

  describe("getUserByUsername", () => {
    it("dovrebbe restituire un utente quando esiste", async () => {
      const mockUser: UserDAO = {
        id: 1,
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "hashedpassword",
        avatar: null,
        telegramUsername: null,
        emailNotifications: false
      };

      mockRepo.find.mockResolvedValue([mockUser]);

      const result = await userRepository.getUserByUsername("testuser");

      expect(result).toEqual(mockUser);
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { username: "testuser" } });
    });

    it("dovrebbe lanciare NotFoundError quando l'utente non esiste", async () => {
      mockRepo.find.mockResolvedValue([]);

      await expect(userRepository.getUserByUsername("nonexistent"))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe("getUserByEmail", () => {
    it("dovrebbe restituire un utente quando esiste", async () => {
      const mockUser: UserDAO = {
        id: 1,
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "hashedpassword",
        avatar: null,
        telegramUsername: null,
        emailNotifications: false
      };

      mockRepo.find.mockResolvedValue([mockUser]);

      const result = await userRepository.getUserByEmail("test@example.com");

      expect(result).toEqual(mockUser);
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { email: "test@example.com" } });
    });

    it("dovrebbe lanciare NotFoundError quando l'utente non esiste", async () => {
      mockRepo.find.mockResolvedValue([]);

      await expect(userRepository.getUserByEmail("nonexistent@example.com"))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe("getUserById", () => {
    it("dovrebbe restituire un utente quando esiste", async () => {
      const mockUser: UserDAO = {
        id: 1,
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "hashedpassword",
        avatar: null,
        telegramUsername: null,
        emailNotifications: false
      };

      mockRepo.find.mockResolvedValue([mockUser]);

      const result = await userRepository.getUserById(1);

      expect(result).toEqual(mockUser);
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it("dovrebbe lanciare NotFoundError quando l'utente non esiste", async () => {
      mockRepo.find.mockResolvedValue([]);

      await expect(userRepository.getUserById(999))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe("createUser", () => {
    it("dovrebbe creare un nuovo utente con successo", async () => {
      const newUser = {
        username: "newuser",
        firstName: "New",
        lastName: "User",
        email: "new@example.com",
        password: "plainpassword",
        avatar: null,
        telegramUsername: null,
        emailNotifications: false
      };

      const savedUser: UserDAO = {
        id: 1,
        ...newUser,
        password: "hashedpassword"
      };

      // Mock: username e email non esistono
      mockRepo.find.mockResolvedValue([]);
      
      // Mock: officer non esiste
      jest.spyOn(OfficerRepository.prototype, 'getOfficerByEmail').mockRejectedValue(new NotFoundError("Not found"));
      jest.spyOn(OfficerRepository.prototype, 'getOfficersByUsername').mockResolvedValue([]);

      // Mock: hashing password
      (hashPassword as jest.Mock).mockResolvedValue("hashedpassword");

      // Mock: salvataggio
      mockRepo.save.mockResolvedValue(savedUser);

      const result = await userRepository.createUser(
        newUser.username,
        newUser.firstName,
        newUser.lastName,
        newUser.email,
        newUser.password
      );

      expect(result).toEqual(savedUser);
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { username: newUser.username } });
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { email: newUser.email } });
      expect(OfficerRepository.prototype.getOfficerByEmail).toHaveBeenCalledWith(newUser.email);
      expect(OfficerRepository.prototype.getOfficersByUsername).toHaveBeenCalledWith(newUser.username);
      expect(hashPassword).toHaveBeenCalledWith(newUser.password);
      expect(mockRepo.save).toHaveBeenCalledWith({
        username: newUser.username,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        password: "hashedpassword"
      });
    });

    it("dovrebbe lanciare ConflictError se username già esiste", async () => {
      const existingUser: UserDAO = {
        id: 1,
        username: "existinguser",
        firstName: "Existing",
        lastName: "User",
        email: "existing@example.com",
        password: "hash",
        avatar: null,
        telegramUsername: null,
        emailNotifications: false
      };

      // Username esiste
      mockRepo.find.mockResolvedValue([existingUser]);

      await expect(userRepository.createUser(
        "existinguser",
        "New",
        "User",
        "new@example.com",
        "password"
      )).rejects.toThrow(ConflictError);
    });

    it("dovrebbe lanciare ConflictError se email già esiste", async () => {
      const existingUser: UserDAO = {
        id: 1,
        username: "user1",
        firstName: "Existing",
        lastName: "User",
        email: "existing@example.com",
        password: "hash",
        avatar: null,
        telegramUsername: null,
        emailNotifications: false
      };

      // Username non esiste, ma email esiste
      mockRepo.find
        .mockResolvedValueOnce([]) // username check
        .mockResolvedValueOnce([existingUser]); // email check

      jest.spyOn(OfficerRepository.prototype, 'getOfficerByEmail').mockRejectedValue(new NotFoundError("Not found"));
      jest.spyOn(OfficerRepository.prototype, 'getOfficersByUsername').mockResolvedValue([]);

      await expect(userRepository.createUser(
        "newuser",
        "New",
        "User",
        "existing@example.com",
        "password"
      )).rejects.toThrow(ConflictError);
    });

    it("dovrebbe lanciare Error se email è già usata da un officer", async () => {
      const mockOfficer = {
        id: 1,
        username: "officer1",
        email: "officer@example.com",
        password: "hash",
        role: "ROLE_1"
      };

      mockRepo.find.mockResolvedValue([]); // username non esiste
      jest.spyOn(OfficerRepository.prototype, 'getOfficerByEmail').mockResolvedValue(mockOfficer as any);

      await expect(userRepository.createUser(
        "newuser",
        "New",
        "User",
        "officer@example.com",
        "password"
      )).rejects.toThrow("Email 'officer@example.com' is already used.");
    });

    it("dovrebbe lanciare Error se username è già usato da un officer", async () => {
      const mockOfficer = {
        id: 1,
        username: "officerusername",
        email: "officer@example.com",
        password: "hash",
        role: "ROLE_1"
      };

      mockRepo.find.mockResolvedValue([]); // username non esiste nei users
      jest.spyOn(OfficerRepository.prototype, 'getOfficerByEmail').mockRejectedValue(new NotFoundError("Not found"));
      jest.spyOn(OfficerRepository.prototype, 'getOfficersByUsername').mockResolvedValue([mockOfficer] as any);

      await expect(userRepository.createUser(
        "officerusername",
        "New",
        "User",
        "new@example.com",
        "password"
      )).rejects.toThrow("Username 'officerusername' is already used.");
    });
  });

  describe("deleteUser", () => {
    it("dovrebbe eliminare un utente esistente", async () => {
      const mockUser: UserDAO = {
        id: 1,
        username: "userToDelete",
        firstName: "Delete",
        lastName: "Me",
        email: "delete@example.com",
        password: "hash",
        avatar: null,
        telegramUsername: null,
        emailNotifications: false
      };

      mockRepo.find.mockResolvedValue([mockUser]);
      mockRepo.remove.mockResolvedValue(mockUser);

      await userRepository.deleteUser("userToDelete");

      expect(mockRepo.find).toHaveBeenCalledWith({ where: { username: "userToDelete" } });
      expect(mockRepo.remove).toHaveBeenCalledWith(mockUser);
    });

    it("dovrebbe lanciare NotFoundError se l'utente non esiste", async () => {
      mockRepo.find.mockResolvedValue([]);

      await expect(userRepository.deleteUser("nonexistent"))
        .rejects
        .toThrow(NotFoundError);
    });
  });
});
