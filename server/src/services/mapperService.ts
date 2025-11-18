//! MAPPER SERVICE (converts DAO to DTO)

import { UserDAO } from "@dao/UserDAO";
import { OfficerDAO } from "@dao/OfficerDAO";
import { ReportDAO } from "@dao/ReportDAO";
import { User } from "@dto/User";
import { Officer } from "@dto/Officer";
import { Report } from "@dto/Report";

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
    password: undefined
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
    role: dao.role as any,
    office: dao.office as any,
    // Non restituiamo mai la password in DTO!
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
    //? aggiunti per la getAssigned (non la retrieve che prende solo i pending, ma in generale la getAssigned che prende tutti i report assegnati anche non-pending)
    state: dao.state as any,
    reason: dao.reason || undefined,
    assignedOfficerId: (dao as any).assignedOfficerId || undefined
  };
}
