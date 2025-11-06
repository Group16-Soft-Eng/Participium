import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ApiImplementations } from './api-implementations'
import { AuthApi } from './api';
import { AuthApiController } from './controllers';
import { OfficersApi } from './api';
import { OfficersApiController } from './controllers';
import { ReportsApi } from './api';
import { ReportsApiController } from './controllers';
import { UsersApi } from './api';
import { UsersApiController } from './controllers';

@Module({})
export class ApiModule {
  static forRoot(apiImplementations: ApiImplementations): DynamicModule {
      const providers: Provider[] = [
        {
          provide: AuthApi,
          useClass: apiImplementations.authApi
        },
        {
          provide: OfficersApi,
          useClass: apiImplementations.officersApi
        },
        {
          provide: ReportsApi,
          useClass: apiImplementations.reportsApi
        },
        {
          provide: UsersApi,
          useClass: apiImplementations.usersApi
        },
      ];

      return {
        module: ApiModule,
        controllers: [
          AuthApiController,
          OfficersApiController,
          ReportsApiController,
          UsersApiController,
        ],
        providers: [...providers],
        exports: [...providers]
      }
    }
}

