import { Body, Controller, Get, Post, Param, Query, Req } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UsersApi } from '../api';
import { User,  } from '../models';

@Controller()
export class UsersApiController {
  constructor(private readonly usersApi: UsersApi) {}

  @Post('/users')
  createUser(@Body() user: User, @Req() request: Request): User | Promise<User> | Observable<User> {
    return this.usersApi.createUser(user, request);
  }

  @Get('/users/logout')
  logoutUser(@Req() request: Request): void | Promise<void> | Observable<void> {
    return this.usersApi.logoutUser(request);
  }

} 