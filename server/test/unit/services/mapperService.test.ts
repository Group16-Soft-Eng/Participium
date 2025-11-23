import "reflect-metadata";
import { 
  mapUserDAOToDTO, 
  mapOfficerDAOToDTO, 
  mapReportDAOToDTO 
} from "../../../src/services/mapperService";
import { UserDAO } from "../../../src/models/dao/UserDAO";
import { OfficerDAO } from "../../../src/models/dao/OfficerDAO";
import { ReportDAO } from "../../../src/models/dao/ReportDAO";
import { OfficeType } from "../../../src/models/enums/OfficeType";
import { OfficerRole } from "../../../src/models/enums/OfficerRole";

describe("MapperService Unit Tests", () => {
  describe("mapUserDAOToDTO", () => {
    it("dovrebbe mappare correttamente UserDAO a User DTO", () => {
      const userDAO: Partial<UserDAO> = {
        id: 1,
        username: "testuser",
        firstName: "Mario",
        lastName: "Rossi",
        email: "mario@example.com",
        password: "hashedPassword123"
      };

      const result = mapUserDAOToDTO(userDAO as UserDAO);

      expect(result).toEqual({
        id: 1,
        username: "testuser",
        firstName: "Mario",
        lastName: "Rossi",
        email: "mario@example.com",
        password: undefined // La password non deve mai essere esposta nel DTO
      });
    });

    it("non dovrebbe includere la password nel DTO", () => {
      const userDAO: Partial<UserDAO> = {
        id: 1,
        username: "user",
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "secretHashedPassword"
      };

      const result = mapUserDAOToDTO(userDAO as UserDAO);

      expect(result.password).toBeUndefined();
      expect(result).not.toHaveProperty("password", "secretHashedPassword");
    });
  });

  describe("mapOfficerDAOToDTO", () => {
    it("dovrebbe mappare correttamente OfficerDAO a Officer DTO", () => {
      const officerDAO: Partial<OfficerDAO> = {
        id: 1,
        username: "officer1",
        name: "Luigi",
        surname: "Bianchi",
        email: "luigi@office.com",
        password: "hashedPassword456",
        role: OfficerRole.TECHNICAL_OFFICE_STAFF,
        office: OfficeType.SAFETY
      };

      const result = mapOfficerDAOToDTO(officerDAO as OfficerDAO);

      expect(result).toEqual({
        id: 1,
        username: "officer1",
        name: "Luigi",
        surname: "Bianchi",
        email: "luigi@office.com",
        role: OfficerRole.TECHNICAL_OFFICE_STAFF,
        office: OfficeType.SAFETY,
        password: undefined // La password non deve mai essere esposta nel DTO
      });
    });

    it("non dovrebbe includere la password nel DTO", () => {
      const officerDAO: Partial<OfficerDAO> = {
        id: 1,
        username: "officer",
        name: "Test",
        surname: "Officer",
        email: "test@office.com",
        password: "secretHashedPassword",
        role: OfficerRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER,
        office: OfficeType.SAFETY
      };

      const result = mapOfficerDAOToDTO(officerDAO as OfficerDAO);

      expect(result.password).toBeUndefined();
    });
  });

  describe("mapReportDAOToDTO", () => {
    it("dovrebbe mappare correttamente ReportDAO a Report DTO con autore", () => {
      const mockDate = new Date("2025-01-15T10:30:00Z");
      
      const reportDAO: Partial<ReportDAO> = {
        id: 1,
        title: "Buca sulla strada",
        location: {
          Coordinates: {
            latitude: 45.464211,
            longitude: 9.191383
          }
        },
        author: {
          id: 1,
          username: "testuser",
          firstName: "Mario",
          lastName: "Rossi",
          email: "mario@test.com",
          password: "hashed"
        } as UserDAO,
        anonymity: false,
        date: mockDate,
        category: OfficeType.SAFETY,
        document: {
          Description: "Descrizione dettagliata della buca",
          Photos: ["photo1.jpg", "photo2.jpg"]
        }
      };

      const result = mapReportDAOToDTO(reportDAO as ReportDAO);

      expect(result).toEqual({
        id: 1,
        title: "Buca sulla strada",
        location: {
          Coordinates: {
            latitude: 45.464211,
            longitude: 9.191383
          }
        },
        author: {
          id: 1,
          username: "testuser",
          firstName: "Mario",
          lastName: "Rossi",
          email: "mario@test.com",
          password: undefined
        },
        anonymity: false,
        date: mockDate.toISOString(),
        category: OfficeType.SAFETY,
        document: {
          description: "Descrizione dettagliata della buca",
          photos: ["photo1.jpg", "photo2.jpg"]
        }
      });
    });

    it("dovrebbe mappare correttamente ReportDAO a Report DTO senza autore (anonimo)", () => {
      const mockDate = new Date("2025-01-15T10:30:00Z");
      
      const reportDAO: Partial<ReportDAO> = {
        id: 2,
        title: "Segnalazione anonima",
        location: {
          Coordinates: {
            latitude: 45.5,
            longitude: 9.2
          }
        },
        author: null,
        anonymity: true,
        date: mockDate,
        category: OfficeType.INFRASTRUCTURE,
        document: {
          Description: "Descrizione report anonimo",
          Photos: ["photo.jpg"]
        }
      };

      const result = mapReportDAOToDTO(reportDAO as ReportDAO);

      expect(result.author).toBeUndefined();
      expect(result.anonymity).toBe(true);
    });

    it("dovrebbe convertire la data in formato ISO string", () => {
      const mockDate = new Date("2025-01-15T10:30:00Z");
      
      const reportDAO: Partial<ReportDAO> = {
        id: 3,
        title: "Test Date",
        location: { Coordinates: { latitude: 45, longitude: 9 } },
        author: null,
        anonymity: true,
        date: mockDate,
        category: OfficeType.SANITATION,
        document: {
          Description: "Test",
          Photos: ["test.jpg"]
        }
      };

      const result = mapReportDAOToDTO(reportDAO as ReportDAO);

      expect(result.date).toBe("2025-01-15T10:30:00.000Z");
      expect(typeof result.date).toBe("string");
    });
  });
});
