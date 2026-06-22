import { Controller, Get, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { JwtAccessGuard } from '../../auth/application/guards/jwt-access.guard';
import { RoleGuard, Roles } from '../../auth/application/guards/role.guard';
import { GetDashboardStatsQuery } from '../application/queries';

@Controller('dashboard')
@UseGuards(JwtAccessGuard, RoleGuard)
@Roles(['ADMIN'])
export class DashboardController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('stats')
  async stats() {
    return await this.queryBus.execute(new GetDashboardStatsQuery());
  }
}
