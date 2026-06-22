import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user';
import { DashboardController } from './presentation/dashboard.controller';
import { DashboardRepository } from './infrastructure/repositories/dashboard.repository';
import { DASHBOARD_REPOSITORY } from './application/dashboard.token';
import { GetDashboardStatsHandler } from './application/queries';

const queryHandlers = [GetDashboardStatsHandler];

@Module({
  imports: [CqrsModule, forwardRef(() => AuthModule), forwardRef(() => UserModule)],
  controllers: [DashboardController],
  providers: [
    {
      provide: DASHBOARD_REPOSITORY,
      useClass: DashboardRepository,
    },
    ...queryHandlers,
  ],
})
export class DashboardModule {}
