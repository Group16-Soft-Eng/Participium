import { Injectable } from '@nestjs/common';
import { UsersApi } from '../api/UsersApi';
import { User } from '../models';

@Injectable()
export class UsersApiImpl extends UsersApi {
  
  async createUser(user: User, request: Request): Promise<User> {
    throw new Error('Method not implemented');
  }

  async logoutUser(request: Request): Promise<void> {
    throw new Error('Method not implemented');
  }
}