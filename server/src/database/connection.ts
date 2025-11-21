import "reflect-metadata";
import { DataSource } from "typeorm";
import { CONFIG } from "@config";
import {createClient} from "redis";
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
    redisClient.on("error", (err) => console.log("Redis Client Error", err));
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