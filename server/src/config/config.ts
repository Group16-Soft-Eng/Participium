import { readdirSync } from "fs";
import path = require("path");
import * as dotenv from "dotenv";

dotenv.config();

const DB_ENTITIES_FOLDER = "../models/dao";
const DB_ENTITIES_PATH = path.join(__dirname, DB_ENTITIES_FOLDER);
const APP_V1_BASE_URL = "/api/v1";

export const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_IN_PRODUCTION";
export const TOKEN_LIFESPAN = "24h";

export const CONFIG = {
  APP_PORT: process.env.PORT || 5000,

  DB_TYPE: process.env.DB_TYPE || "sqlite",
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  DB_USERNAME: process.env.DB_USERNAME || "app",
  DB_PASSWORD: process.env.DB_PASSWORD || "app",
  DB_NAME: process.env.DB_NAME || "participium.db",

  DB_ENTITIES: readdirSync(DB_ENTITIES_PATH)
    .filter((file) => file.endsWith(".ts") || file.endsWith(".js"))
    .map(
      (file) =>
        require(path.join(DB_ENTITIES_PATH, file))[
          Object.keys(require(path.join(DB_ENTITIES_PATH, file)))[0]
        ]
    ),

  SWAGGER_FILE_PATH: path.resolve(__dirname, "../../api/openapi.json"),

  ROUTES: {
    V1_SWAGGER: APP_V1_BASE_URL + "/doc",
    V1_AUTH: APP_V1_BASE_URL + "/auth",
    V1_USERS: APP_V1_BASE_URL + "/users",
    V1_OFFICERS: APP_V1_BASE_URL + "/officers",
    V1_MAINTAINERS: APP_V1_BASE_URL + "/maintainers",
    V1_REPORTS: APP_V1_BASE_URL + "/reports",
    V1_INFO_TYPES: APP_V1_BASE_URL + "/info-types",
    V1_NOTIFICATIONS: APP_V1_BASE_URL + "/notifications",
    V1_PUBLICS: APP_V1_BASE_URL + "/publics",
    V1_ADMIN: APP_V1_BASE_URL + "/admin"
  },

  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379
  
};