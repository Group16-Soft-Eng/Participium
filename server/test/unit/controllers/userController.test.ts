import "reflect-metadata";
import { createUser, getUser, getAllUsers, deleteUser } from "../../../../src/controllers/userController";
import { UserRepository } from "../../../../src/repositories/UserRepository";
import { mapUserDAOToDTO } from "../../../../src/services/mapperService";

// Mock dei moduli
jest.mock("../../../../src/repositories/UserRepository");
jest.mock("../../../../src/services/mapperService");

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
});
