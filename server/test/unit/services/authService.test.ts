import "reflect-metadata";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  verifyToken 
} from "../../../../src/services/authService";

// Mock delle librerie esterne
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

describe("AuthService Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("hashPassword", () => {
    it("dovrebbe hashare una password in chiaro", async () => {
      const plainPassword = "mySecurePassword123";
      const hashedPassword = "$2b$10$hashedPasswordExample";

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await hashPassword(plainPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 10);
      expect(result).toBe(hashedPassword);
    });

    it("dovrebbe usare SALT_ROUNDS corretto (10)", async () => {
      const plainPassword = "password";
      
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");

      await hashPassword(plainPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 10);
    });
  });

  describe("verifyPassword", () => {
    it("dovrebbe restituire true con password corretta", async () => {
      const plainPassword = "correctPassword";
      const hashedPassword = "$2b$10$hashedPasswordExample";

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await verifyPassword(plainPassword, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(result).toBe(true);
    });

    it("dovrebbe restituire false con password errata", async () => {
      const plainPassword = "wrongPassword";
      const hashedPassword = "$2b$10$hashedPasswordExample";

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await verifyPassword(plainPassword, hashedPassword);

      expect(result).toBe(false);
    });
  });

  describe("generateToken", () => {
    it("dovrebbe generare un JWT token valido", () => {
      const payload = {
        id: 1,
        username: "testuser",
        type: "user"
      };
      const mockToken = "mock.jwt.token";

      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const result = generateToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        expect.any(String), // JWT_SECRET
        { expiresIn: expect.any(String) } // TOKEN_LIFESPAN
      );
      expect(result).toBe(mockToken);
    });

    it("dovrebbe includere id, username e type nel payload", () => {
      const payload = {
        id: 42,
        username: "officer1",
        type: "ROLE_1"
      };

      (jwt.sign as jest.Mock).mockReturnValue("token");

      generateToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 42,
          username: "officer1",
          type: "ROLE_1"
        }),
        expect.any(String),
        expect.any(Object)
      );
    });
  });

  describe("verifyToken", () => {
    it("dovrebbe verificare e decodificare un token valido", () => {
      const mockToken = "valid.jwt.token";
      const decodedPayload = {
        id: 1,
        username: "testuser",
        type: "user"
      };

      (jwt.verify as jest.Mock).mockReturnValue(decodedPayload);

      const result = verifyToken(mockToken);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, expect.any(String));
      expect(result).toEqual(decodedPayload);
    });

    it("dovrebbe lanciare errore con token non valido", () => {
      const invalidToken = "invalid.token";

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("jwt malformed");
      });

      expect(() => verifyToken(invalidToken))
        .toThrow("Invalid or expired token");
    });

    it("dovrebbe lanciare errore con token scaduto", () => {
      const expiredToken = "expired.jwt.token";

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("jwt expired");
      });

      expect(() => verifyToken(expiredToken))
        .toThrow("Invalid or expired token");
    });
  });
});
