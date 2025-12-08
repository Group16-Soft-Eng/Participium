//! MAPPER SERVICE (converts DAO to DTO)

import { UserDAO } from "@dao/UserDAO";
import { OfficerDAO } from "@dao/OfficerDAO";
import { ReportDAO } from "@dao/ReportDAO";
import { User } from "@dto/User";
import { Officer } from "@dto/Officer";
import { Report } from "@dto/Report";
import { OfficerRole as ModelOfficerRole } from "@models/enums/OfficerRole";
import { OfficeType as ModelOfficeType } from "@models/enums/OfficeType";

// Usa gli enum del DTO per tipizzare il risultato
import { OfficerRole as DtoOfficerRole } from "@dto/OfficerRole";
import { OfficeType as DtoOfficeType } from "@dto/OfficeType";

/**
 * DAO -> DTO: User
 */
export function mapUserDAOToDTO(dao: UserDAO): User {
  return {
    id: dao.id,
    username: dao.username,
    firstName: dao.firstName,
    lastName: dao.lastName,
    email: dao.email,
    // Non restituiamo mai la password in DTO!
    password: undefined,
    avatar: dao.avatar || undefined,
    telegramUsername: dao.telegramUsername || undefined,
    emailNotifications: dao.emailNotifications
  };
}

/**
 * DAO -> DTO: Officer
 */
export function mapOfficerDAOToDTO(dao: OfficerDAO): Officer {
  return {
    id: dao.id,
    username: dao.username,
    name: dao.name,
    surname: dao.surname,
    email: dao.email,
    roles: (dao.roles ?? []).map(r => ({
      // converte tra enum di model -> enum di dto
      role: (r.officerRole as unknown as DtoOfficerRole) as DtoOfficerRole,
      office: r.officeType == null
        ? null
        : ((r.officeType as unknown as DtoOfficeType) as DtoOfficeType)
    })),
    password: undefined
  };
}

/**
 * DAO -> DTO: Report
 */
export function mapReportDAOToDTO(dao: ReportDAO): Report {
  return {
    id: dao.id,
    title: dao.title,
    location: dao.location,
    author: dao.author ? mapUserDAOToDTO(dao.author) : undefined,
    anonymity: dao.anonymity,
    date: dao.date.toISOString(),
    category: dao.category as any,
    document: {
      description: dao.document?.Description,
      photos: dao.document?.Photos
    },
    state: dao.state,
    assignedOfficerId: dao.assignedOfficerId ?? undefined,
    reason: dao.reason ?? undefined
  };
}
