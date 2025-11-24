import "reflect-metadata";
import { OfficerRepository } from "../../../src/repositories/OfficerRepository";
import { UserRepository } from "../../../src/repositories/UserRepository";
import { OfficerDAO } from "../../../src/models/dao/OfficerDAO";
import { Repository } from "typeorm";
import { AppDataSource } from "../../../src/database/connection";
import { OfficerRole } from "../../../src/models/enums/OfficerRole";
import { OfficeType } from "../../../src/models/enums/OfficeType";
import { hashPassword } from "../../../src/services/authService";
import { NotFoundError, ConflictError } from "../../../src/utils/utils";

// Mock dei moduli
jest.mock("../../../src/services/authService");

describe("OfficerRepository Unit Tests", () => {
  let officerRepository: OfficerRepository;
  let mockRepo: jest.Mocked<Repository<OfficerDAO>>;

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

    officerRepository = new OfficerRepository();
  });

  describe("getAllOfficers", () => {
    it("dovrebbe restituire tutti gli officers", async () => {
      const mockOfficers: OfficerDAO[] = [
        {
          id: 1,
          username: "officer1",
          name: "John",
          surname: "Doe",
          email: "john@example.com",
          password: "hash1",
          role: OfficerRole.MUNICIPAL_ADMINISTRATOR,
          office: OfficeType.INFRASTRUCTURE
        },
        {
          id: 2,
          username: "officer2",
          name: "Jane",
          surname: "Smith",
          email: "jane@example.com",
          password: "hash2",
          role: OfficerRole.TECHNICAL_OFFICE_STAFF,
          office: OfficeType.INFRASTRUCTURE
        }
      ];

      mockRepo.find.mockResolvedValue(mockOfficers);

      const result = await officerRepository.getAllOfficers();

      expect(result).toEqual(mockOfficers);
      expect(mockRepo.find).toHaveBeenCalledTimes(1);
    });
  });

  describe("getOfficerByEmail", () => {
    it("dovrebbe restituire un officer quando esiste", async () => {
      const mockOfficer: OfficerDAO = {
        id: 1,
        username: "officer1",
        name: "John",
        surname: "Doe",
        email: "john@example.com",
        password: "hashedpassword",
        role: OfficerRole.MUNICIPAL_ADMINISTRATOR,
        office: OfficeType.INFRASTRUCTURE
      };

      mockRepo.find.mockResolvedValue([mockOfficer]);

      const result = await officerRepository.getOfficerByEmail("john@example.com");

      expect(result).toEqual(mockOfficer);
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { email: "john@example.com" } });
    });

    it("dovrebbe lanciare NotFoundError quando l'officer non esiste", async () => {
      mockRepo.find.mockResolvedValue([]);

      await expect(officerRepository.getOfficerByEmail("nonexistent@example.com"))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe("getOfficerById", () => {
    it("dovrebbe restituire un officer quando esiste", async () => {
      const mockOfficer: OfficerDAO = {
        id: 1,
        username: "officer1",
        name: "John",
        surname: "Doe",
        email: "john@example.com",
        password: "hashedpassword",
        role: OfficerRole.TECHNICAL_OFFICE_STAFF,
        office: OfficeType.INFRASTRUCTURE
      };

      mockRepo.find.mockResolvedValue([mockOfficer]);

      const result = await officerRepository.getOfficerById(1);

      expect(result).toEqual(mockOfficer);
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it("dovrebbe lanciare NotFoundError quando l'officer non esiste", async () => {
      mockRepo.find.mockResolvedValue([]);

      await expect(officerRepository.getOfficerById(999))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe("getOfficersByUsername", () => {
    it("dovrebbe restituire array di officers con username specifico", async () => {
      const mockOfficers: OfficerDAO[] = [
        {
          id: 1,
          username: "testuser",
          name: "John",
          surname: "Doe",
          email: "john@example.com",
          password: "hash",
          role: OfficerRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER,
          office: OfficeType.INFRASTRUCTURE
        }
      ];

      mockRepo.find.mockResolvedValue(mockOfficers);

      const result = await officerRepository.getOfficersByUsername("testuser");

      expect(result).toEqual(mockOfficers);
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { username: "testuser" } });
    });

    it("dovrebbe restituire array vuoto se username non esiste", async () => {
      mockRepo.find.mockResolvedValue([]);

      const result = await officerRepository.getOfficersByUsername("nonexistent");

      expect(result).toEqual([]);
    });
  });

  describe("getOfficersByOffice", () => {
    it("dovrebbe restituire officers per ufficio specifico", async () => {
      const mockOfficers: OfficerDAO[] = [
        {
          id: 1,
          username: "officer1",
          name: "John",
          surname: "Doe",
          email: "john@example.com",
          password: "hash1",
          role: OfficerRole.TECHNICAL_OFFICE_STAFF,
          office: OfficeType.INFRASTRUCTURE
        },
        {
          id: 2,
          username: "officer2",
          name: "Jane",
          surname: "Smith",
          email: "jane@example.com",
          password: "hash2",
          role: OfficerRole.TECHNICAL_OFFICE_STAFF,
          office: OfficeType.INFRASTRUCTURE
        }
      ];

      mockRepo.find.mockResolvedValue(mockOfficers);

      const result = await officerRepository.getOfficersByOffice(OfficeType.INFRASTRUCTURE);

      expect(result).toEqual(mockOfficers);
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { office: OfficeType.INFRASTRUCTURE } });
    });
  });

  describe("createOfficer", () => {
    it("dovrebbe creare un nuovo officer con successo", async () => {
      const newOfficer = {
        username: "newofficer",
        name: "New",
        surname: "Officer",
        email: "new@example.com",
        password: "plainpassword",
        role: OfficerRole.MUNICIPAL_ADMINISTRATOR,
        office: OfficeType.INFRASTRUCTURE
      };

      const savedOfficer: OfficerDAO = {
        id: 1,
        ...newOfficer,
        password: "hashedpassword"
      };

      // Mock: email non esiste
      mockRepo.find.mockResolvedValue([]);

      // Mock: user non esiste
      jest.spyOn(UserRepository.prototype, 'getUserByEmail').mockRejectedValue(new NotFoundError("Not found"));

      // Mock: hashing password
      (hashPassword as jest.Mock).mockResolvedValue("hashedpassword");

      // Mock: salvataggio
      mockRepo.save.mockResolvedValue(savedOfficer);

      const result = await officerRepository.createOfficer(
        newOfficer.username,
        newOfficer.name,
        newOfficer.surname,
        newOfficer.email,
        newOfficer.password,
        newOfficer.role,
        newOfficer.office
      );

      expect(result).toEqual(savedOfficer);
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { email: newOfficer.email } });
      expect(UserRepository.prototype.getUserByEmail).toHaveBeenCalledWith(newOfficer.email);
      expect(hashPassword).toHaveBeenCalledWith(newOfficer.password);
      expect(mockRepo.save).toHaveBeenCalledWith({
        username: newOfficer.username,
        name: newOfficer.name,
        surname: newOfficer.surname,
        email: newOfficer.email,
        password: "hashedpassword",
        role: newOfficer.role,
        office: newOfficer.office
      });
    });

    it("dovrebbe lanciare ConflictError se email già esiste", async () => {
      const existingOfficer: OfficerDAO = {
        id: 1,
        username: "existing",
        name: "Existing",
        surname: "Officer",
        email: "existing@example.com",
        password: "hash",
        role: OfficerRole.TECHNICAL_OFFICE_STAFF,
        office: OfficeType.INFRASTRUCTURE
      };

      // Email esiste
      mockRepo.find.mockResolvedValue([existingOfficer]);

      await expect(officerRepository.createOfficer(
        "newofficer",
        "New",
        "Officer",
        "existing@example.com",
        "password",
        OfficerRole.MUNICIPAL_ADMINISTRATOR,
        OfficeType.INFRASTRUCTURE
      )).rejects.toThrow(ConflictError);
    });

    it("dovrebbe lanciare Error se email è già usata da un user", async () => {
      const mockUser = {
        id: 1,
        username: "user1",
        firstName: "User",
        lastName: "One",
        email: "user@example.com",
        password: "hash"
      };

      mockRepo.find.mockResolvedValue([]); // email non esiste tra officers
      jest.spyOn(UserRepository.prototype, 'getUserByEmail').mockResolvedValue(mockUser as any);

      await expect(officerRepository.createOfficer(
        "newofficer",
        "New",
        "Officer",
        "user@example.com",
        "password",
        OfficerRole.MUNICIPAL_ADMINISTRATOR,
        OfficeType.INFRASTRUCTURE
      )).rejects.toThrow("Email 'user@example.com' is already used.");
    });
  });

  describe("updateOfficer", () => {
    it("dovrebbe aggiornare un officer esistente", async () => {
      const existingOfficer: OfficerDAO = {
        id: 1,
        username: "oldusername",
        name: "Old",
        surname: "Name",
        email: "old@example.com",
        password: "oldhashedpassword",
        role: OfficerRole.TECHNICAL_OFFICE_STAFF,
        office: OfficeType.INFRASTRUCTURE
      };

      const updatedOfficer: OfficerDAO = {
        id: 1,
        username: "newusername",
        name: "New",
        surname: "Name",
        email: "new@example.com",
        password: "oldhashedpassword", // password non cambia
        role: OfficerRole.MUNICIPAL_ADMINISTRATOR,
        office: OfficeType.INFRASTRUCTURE
      };

      mockRepo.find.mockResolvedValue([existingOfficer]);
      mockRepo.save.mockResolvedValue(updatedOfficer);

      const result = await officerRepository.updateOfficer(
        1,
        "newusername",
        "New",
        "Name",
        "new@example.com",
        OfficerRole.MUNICIPAL_ADMINISTRATOR,
        OfficeType.INFRASTRUCTURE
      );

      expect(result).toEqual(updatedOfficer);
      expect(result.password).toBe("oldhashedpassword"); // password preserved
      expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        username: "newusername",
        name: "New",
        surname: "Name",
        email: "new@example.com",
        role: OfficerRole.MUNICIPAL_ADMINISTRATOR,
        office: OfficeType.INFRASTRUCTURE
      }));
    });

    it("dovrebbe lanciare NotFoundError se l'officer non esiste", async () => {
      mockRepo.find.mockResolvedValue([]);

      await expect(officerRepository.updateOfficer(
        999,
        "username",
        "Name",
        "Surname",
        "email@example.com",
        OfficerRole.MUNICIPAL_ADMINISTRATOR,
        OfficeType.INFRASTRUCTURE
      )).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteOfficer", () => {
    it("dovrebbe eliminare un officer esistente", async () => {
      const mockOfficer: OfficerDAO = {
        id: 1,
        username: "officerToDelete",
        name: "Delete",
        surname: "Me",
        email: "delete@example.com",
        password: "hash",
        role: OfficerRole.TECHNICAL_OFFICE_STAFF,
        office: OfficeType.INFRASTRUCTURE
      };

      mockRepo.find.mockResolvedValue([mockOfficer]);
      mockRepo.remove.mockResolvedValue(mockOfficer);

      await officerRepository.deleteOfficer("delete@example.com");

      expect(mockRepo.find).toHaveBeenCalledWith({ where: { email: "delete@example.com" } });
      expect(mockRepo.remove).toHaveBeenCalledWith(mockOfficer);
    });

    it("dovrebbe lanciare NotFoundError se l'officer non esiste", async () => {
      mockRepo.find.mockResolvedValue([]);

      await expect(officerRepository.deleteOfficer("nonexistent@example.com"))
        .rejects
        .toThrow(NotFoundError);
    });
  });
});
