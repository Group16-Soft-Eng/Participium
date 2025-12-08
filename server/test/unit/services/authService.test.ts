import "reflect-metadata";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  saveSession,
  getSession,
  deleteSession,
  validateSession,
  addToBlacklist,
  isTokenBlacklisted,
  blacklistUserSessions
} from "../../../src/services/authService";
import { redisClient } from "../../../src/database/connection";

jest.mock("bcrypt");
jest.mock("jsonwebtoken");
jest.mock("../../../src/database", () => ({
  redisClient: {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn()
  }
}));

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

  describe("saveSession", () => {
    it("dovrebbe salvare la sessione in Redis", async () => {
      (redisClient.set as jest.Mock).mockResolvedValue("OK");
      await saveSession(1, "token123", "web", 1000);
      expect(redisClient.set).toHaveBeenCalledWith(
        "session:1:web",
        expect.stringContaining('"token":"token123"'),
        { EX: 1000 }
      );
    });
  });

  describe("getSession", () => {
    it("dovrebbe restituire la sessione se esiste", async () => {
      const sessionData = JSON.stringify({ token: "token123", sessionType: "web", createdAt: 123456 });
      (redisClient.get as jest.Mock).mockResolvedValue(sessionData);
      const result = await getSession(1, "web");
      expect(redisClient.get).toHaveBeenCalledWith("session:1:web");
      expect(result).toEqual({ token: "token123", sessionType: "web", createdAt: 123456 });
    });

    it("dovrebbe restituire null se la sessione non esiste", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      const result = await getSession(1, "web");
      expect(result).toBeNull();
    });
  });

  describe("deleteSession", () => {
    it("dovrebbe eliminare la sessione da Redis", async () => {
      (redisClient.del as jest.Mock).mockResolvedValue(1);
      await deleteSession(1, "web");
      expect(redisClient.del).toHaveBeenCalledWith("session:1:web");
    });
  });

  describe("validateSession", () => {
    it("dovrebbe restituire false se il token è in blacklist", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue("blacklisted");
      const result = await validateSession(1, "token123", "web");
      expect(result).toBe(false);
    });

    it("dovrebbe restituire true se la sessione è valida e non in blacklist", async () => {
      (redisClient.get as jest.Mock)
        .mockResolvedValueOnce(null) // isTokenBlacklisted
        .mockResolvedValueOnce(JSON.stringify({ token: "token123", sessionType: "web", createdAt: 123456 }));
      const result = await validateSession(1, "token123", "web");
      expect(result).toBe(true);
    });

    it("dovrebbe restituire false se la sessione non esiste", async () => {
      (redisClient.get as jest.Mock)
        .mockResolvedValueOnce(null) // isTokenBlacklisted
        .mockResolvedValueOnce(null); // getSession
      const result = await validateSession(1, "token123", "web");
      expect(result).toBe(false);
    });

    it("dovrebbe restituire false se il token non corrisponde", async () => {
      (redisClient.get as jest.Mock)
        .mockResolvedValueOnce(null) // isTokenBlacklisted
        .mockResolvedValueOnce(JSON.stringify({ token: "otherToken", sessionType: "web", createdAt: 123456 }));
      const result = await validateSession(1, "token123", "web");
      expect(result).toBe(false);
    });
  });

  describe("addToBlacklist", () => {
    it("dovrebbe aggiungere il token alla blacklist con ttl", async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 1000 });
      (redisClient.set as jest.Mock).mockResolvedValue("OK");
      await addToBlacklist("token123", "test-reason");
      expect(redisClient.set).toHaveBeenCalledWith(
        "blacklist:token123",
        expect.stringContaining('"reason":"test-reason"'),
        { EX: expect.any(Number) }
      );
    });

    it("non dovrebbe aggiungere se il ttl è negativo", async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ exp: Math.floor(Date.now() / 1000) - 10 });
      await addToBlacklist("token123", "expired");
      expect(redisClient.set).not.toHaveBeenCalled();
    });
  });

  describe("isTokenBlacklisted", () => {
    it("dovrebbe restituire true se il token è in blacklist", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue("blacklisted");
      const result = await isTokenBlacklisted("token123");
      expect(redisClient.get).toHaveBeenCalledWith("blacklist:token123");
      expect(result).toBe(true);
    });

    it("dovrebbe restituire false se il token non è in blacklist", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      const result = await isTokenBlacklisted("token123");
      expect(result).toBe(false);
    });
  });

  describe("blacklistUserSessions", () => {
    it("dovrebbe blacklistare e cancellare la sessione se esiste", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify({ token: "token123", sessionType: "web", createdAt: 123456 }));
      (jwt.verify as jest.Mock).mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 1000 });
      (redisClient.set as jest.Mock).mockResolvedValue("OK");
      (redisClient.del as jest.Mock).mockResolvedValue(1);

      await blacklistUserSessions(1, "web", "logout");
      expect(redisClient.set).toHaveBeenCalledWith(
        "blacklist:token123",
        expect.stringContaining('"reason":"logout"'),
        { EX: expect.any(Number) }
      );
      expect(redisClient.del).toHaveBeenCalledWith("session:1:web");
    });

    it("non dovrebbe fare nulla se la sessione non esiste", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      await blacklistUserSessions(1, "web", "logout");
      expect(redisClient.set).not.toHaveBeenCalled();
      expect(redisClient.del).not.toHaveBeenCalled();
    });
  });
});
