import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './',
  testMatch: ['<rootDir>/tests/unit/**/*.test.ts', '<rootDir>/tests/integration/**/*.test.ts'],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@/(.*)$': '<rootDir>/$1',
    "^@config": "<rootDir>/src/config/config",
    "^@database": "<rootDir>/src/database/connection",
    "^@database/(.*)$": "<rootDir>/src/database/$1",
    "^@controllers/(.*)$": "<rootDir>/src/controllers/$1",
    "^@repositories/(.*)$": "<rootDir>/src/repositories/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",
    "^@routes/(.*)$": "<rootDir>/src/routes/$1",
    "^@dto/(.*)$": "<rootDir>/src/models/dto/$1",
    "^@dao/(.*)$": "<rootDir>/src/models/dao/$1",
    "^@models/(.*)$": "<rootDir>/src/models/$1",
    "^@middlewares/(.*)$": "<rootDir>/src/middlewares/$1",
    
    "^@utils$": "<rootDir>/src/utils/utils",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@app$": "<rootDir>/src/app"
  }
};

export default config;
