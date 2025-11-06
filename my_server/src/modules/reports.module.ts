import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './../openapi/models/report';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report])
  ],
  exports: [TypeOrmModule]
})
export class ReportsModule {}