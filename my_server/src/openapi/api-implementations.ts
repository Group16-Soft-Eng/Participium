import { Type } from '@nestjs/common';
import { AuthApi } from './api';
import { OfficersApi } from './api';
import { ReportsApi } from './api';
import { UsersApi } from './api';

/**
 * Provide this type to {@link ApiModule} to provide your API implementations
**/
export type ApiImplementations = {
  authApi: Type<AuthApi>
  officersApi: Type<OfficersApi>
  reportsApi: Type<ReportsApi>
  usersApi: Type<UsersApi>
};
