import { Body, Controller, Post, Param, Query, Req } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthApi } from '../api';
import { LoginUserRequest,  } from '../models';

@Controller()
export class AuthApiController {
  constructor(private readonly authApi: AuthApi) {}

  @Post('/auth/officers')
  loginOfficer(@Body() loginUserRequest: LoginUserRequest, @Req() request: Request): string | Promise<string> | Observable<string> {
    return this.authApi.loginOfficer(loginUserRequest, request);
  }

  @Post('/auth/users')
  loginUser(@Body() loginUserRequest: LoginUserRequest, @Req() request: Request): string | Promise<string> | Observable<string> {
    return this.authApi.loginUser(loginUserRequest, request);
  }

} 