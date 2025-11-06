import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { LoginUserRequest,  } from '../models';


@Injectable()
export abstract class AuthApi {

  abstract loginOfficer(loginUserRequest: LoginUserRequest,  request: Request): string | Promise<string> | Observable<string>;


  abstract loginUser(loginUserRequest: LoginUserRequest,  request: Request): string | Promise<string> | Observable<string>;

} 