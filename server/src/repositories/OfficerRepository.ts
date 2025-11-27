//! OFFICER REPOSITORY

import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { OfficerDAO } from "@dao/OfficerDAO";
import { OfficerRole } from "@models/enums/OfficerRole";
import { OfficeType } from "@models/enums/OfficeType";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils/utils";
import { UserRepository } from "./UserRepository";
import { hashPassword } from "@services/authService";

export class OfficerRepository {
  private repo: Repository<OfficerDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(OfficerDAO);
  }

  async getAllOfficers(): Promise<OfficerDAO[]> {
    return this.repo.find();
  }
  async getAdminOfficers(): Promise<OfficerDAO[]> {
    return this.repo.find({ where: { role: OfficerRole.MUNICIPAL_ADMINISTRATOR } });
  }
  async getOfficerByEmail(email: string): Promise<OfficerDAO> {
    return findOrThrowNotFound(
      await this.repo.find({ where: { email } }),
      () => true,
      `Officer with email '${email}' not found`
    );
  }

  async getOfficerById(id: number): Promise<OfficerDAO> {
    return findOrThrowNotFound(
      await this.repo.find({ where: { id } }),
      () => true,
      `Officer with id '${id}' not found`
    );
  }

  async getOfficersByUsername(username: string): Promise<OfficerDAO[]> { 
    return this.repo.find({ where: { username } });
  }
  


  async getOfficersByOffice(office: OfficeType): Promise<OfficerDAO[]> {
    return this.repo.find({ where: { office } });
  }

  async createOfficer(
    username: string,
    name: string,
    surname: string,
    email: string,
    plainPassword: string,
    role: OfficerRole,
    office: OfficeType
  ): Promise<OfficerDAO> {
    // Check if email already exists
    throwConflictIfFound(
      await this.repo.find({ where: { email } }),
      () => true,
      `Officer with email '${email}' already exists`
    );

    const userRepo = new UserRepository();
    const existingUser = await userRepo.getUserByEmail(email).catch(() => null);
    if (existingUser) {
      throw new Error(`Email '${email}' is already used.`);
    }
    const hashedPassword = await hashPassword(plainPassword);

    return this.repo.save({
      username,
      name,
      surname,
      email,
      password: hashedPassword,
      role,
      office
    });
  }


  async updateOfficer(
    id: number,
    username: string,
    name: string,
    surname: string,
    email: string,
    role: OfficerRole,
    office: OfficeType
  ): Promise<OfficerDAO> {
    const officerToUpdate = await this.getOfficerById(id);


    officerToUpdate.username = username;
    officerToUpdate.name = name;
    officerToUpdate.surname = surname;
    officerToUpdate.email = email;
    officerToUpdate.password = officerToUpdate.password; // keep existing password
    officerToUpdate.role = role;
    officerToUpdate.office = office;

    return this.repo.save(officerToUpdate);
  }

  async deleteOfficer(email: string): Promise<void> {
    const officer = await this.getOfficerByEmail(email);
    await this.repo.remove(officer);
  }
}
