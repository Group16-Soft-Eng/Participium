import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './../openapi/models/user';
import { Officer } from './../openapi/models/officer';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Officer])
  ],
  exports: [TypeOrmModule]
})
export class UsersModule {}