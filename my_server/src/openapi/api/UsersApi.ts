import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { User,  } from '../models';


@Injectable()
export abstract class UsersApi {

  abstract createUser(user: User,  request: Request): User | Promise<User> | Observable<User>;


  abstract logoutUser( request: Request): void | Promise<void> | Observable<void>;

} 