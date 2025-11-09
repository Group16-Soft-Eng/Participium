//! USER REPOSITORY

import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { UserDAO } from "@dao/UserDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils/utils";
import { hashPassword } from "@services/authService";

export class UserRepository {
  private repo: Repository<UserDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(UserDAO);
  }

  async getAllUsers(): Promise<UserDAO[]> {
    return this.repo.find();
  }

  async getUserByUsername(username: string): Promise<UserDAO> {
    return findOrThrowNotFound(
      await this.repo.find({ where: { username } }),
      () => true,
      `User with username '${username}' not found`
    );
  }


  async getUserById(id: number): Promise<UserDAO> {
    return findOrThrowNotFound(
      await this.repo.find({ where: { id } }),
      () => true,
      `User with id '${id}' not found`
    );
  }

 
  async createUser(
    username: string,
    firstName: string,
    lastName: string,
    email: string,
    plainPassword: string
  ): Promise<UserDAO> {
    // Check if username already exists
    throwConflictIfFound(
      await this.repo.find({ where: { username } }),
      () => true,
      `User with username '${username}' already exists`
    );

    // Check if email already exists
    throwConflictIfFound(
      await this.repo.find({ where: { email } }),
      () => true,
      `User with email '${email}' already exists`
    );

    // Hash password
    const hashedPassword = await hashPassword(plainPassword);

    // Create and save user
    return this.repo.save({
      username,
      firstName,
      lastName,
      email,
      password: hashedPassword
    });
  }

  async deleteUser(username: string): Promise<void> {
    const user = await this.getUserByUsername(username);
    await this.repo.remove(user);
  }
}
