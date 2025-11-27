import "reflect-metadata";
import { DataSource } from "typeorm";
import { CONFIG } from "@config";
import {createClient} from "redis";
import { OfficerRepository } from "@repositories/OfficerRepository";
import { OfficerDAO } from "@dao/OfficerDAO";
import { OfficerRole } from "@models/enums/OfficerRole";
import { OfficeType } from "../../generated";
export const AppDataSource = new DataSource({
    type: CONFIG.DB_TYPE as any,
    host: CONFIG.DB_HOST,
    port: CONFIG.DB_PORT,
    username: CONFIG.DB_USERNAME,
    password: CONFIG.DB_PASSWORD,
    database: CONFIG.DB_NAME,
    entities: CONFIG.DB_ENTITIES,
    synchronize: true, // SOLO in dev!
    logging: false
});

export async function initializeDatabase() {
    await AppDataSource.initialize();
    console.log("Successfully connected to DB");
    //search if there is at least one officer, if not create a default one
    const officerRepo = new OfficerRepository();
    const officerCount = await officerRepo.getAdminOfficers();
    if (officerCount === null || officerCount.length === 0) {
      const adminData = {
        username : "admin",
        name: "admin",
        surname: "admin",
        email: "admin@admin.com",
        password: "admin", // In a real app, ensure to hash passwords!
        role: OfficerRole.MUNICIPAL_ADMINISTRATOR
      } as OfficerDAO;
        await officerRepo.createOfficer(adminData.name, adminData.username, adminData.surname, adminData.email, adminData.password, adminData.role, null as any);
        console.log("Created default officer with badge number 0001 and password 'password'");
    }
}

export async function closeDatabase() {
    try {
      await AppDataSource.destroy();
      console.log("Database connection closed");
    } catch (error) {
      console.error("Error while closing database:", error);
    }
}

//redis
export const redisClient = createClient({
    url: `redis://${CONFIG.REDIS_HOST}:${CONFIG.REDIS_PORT}`
});

export async function initializeRedis() {
  redisClient.on("error", (err: unknown) => console.log("Redis Client Error", err));
  await redisClient.connect();
  console.log("Successfully connected to Redis");
}

export async function closeRedis() {
    try {
      await redisClient.quit();
      console.log("Redis connection closed");
    } catch (error) {
      console.error("Error while closing Redis:", error);
    }
}