import { Injectable } from '@nestjs/common';
import { AuthApi } from '../api/AuthApi';
import { LoginUserRequest,  } from '../models';


@Injectable()
export class AuthApiImpl extends AuthApi {
  
  async loginOfficer(loginUserRequest: LoginUserRequest, request: Request): Promise<string> {
    // TODO: Implementare login officer con JWT
    throw new Error('Method not implemented');
  }

  async loginUser(loginUserRequest: LoginUserRequest, request: Request): Promise<string> {
    // TODO: Implementare login user con JWT
    throw new Error('Method not implemented');
  }
}