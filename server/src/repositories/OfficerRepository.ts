//! OFFICER REPOSITORY

import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { OfficerDAO } from "@dao/OfficerDAO";
import { OfficerRole } from "@models/enums/OfficerRole";
import { OfficeType } from "@models/enums/OfficeType";
import { findOrThrowNotFound, throwConflictIfFound } from "../utils/utils";
import { hashPassword } from "@services/authService";

export class OfficerRepository {
  private repo: Repository<OfficerDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(OfficerDAO);
  }

  async getAllOfficers(): Promise<OfficerDAO[]> {
    return this.repo.find();
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

  async deleteOfficer(email: string): Promise<void> {
    const officer = await this.getOfficerByEmail(email);
    await this.repo.remove(officer);
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
    const officer = await this.getOfficerById(id);
    officer.username = username;
    officer.name = name;
    officer.surname = surname;
    officer.email = email;
    officer.role = role;
    officer.office = office;
    return this.repo.save(officer);
  }
}
