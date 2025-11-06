// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiModule } from './openapi/api.module';

// Feature modules (dove metterai entities/services)
import { UsersModule } from './users/users.module';
import { ReportsModule } from './reports/reports.module';

// Le implementazioni che scriverai tu (una per ogni *Api)
import { AuthApiImpl } from './impl/auth.api.impl';
import { OfficersApiImpl } from './impl/officers.api.impl';
import { ReportsApiImpl } from './impl/reports.api.impl';
import { UsersApiImpl } from './impl/users.api.impl';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER || 'app',
      password: process.env.DB_PASSWORD || 'app',
      database: process.env.DB_NAME || 'app',
      autoLoadEntities: true,
      synchronize: true, // SOLO in dev
    }),

    UsersModule,
    ReportsModule,

    ApiModule.forRoot({
      authApi: AuthApiImpl,
      officersApi: OfficersApiImpl,
      reportsApi: ReportsApiImpl,
      usersApi: UsersApiImpl,
    }),
  ],
})
export class AppModule {}
