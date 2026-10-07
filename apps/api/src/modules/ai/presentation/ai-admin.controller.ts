import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { JwtAccessGuard } from '../../auth/application/guards/jwt-access.guard';
import { Roles, RoleGuard } from '../../auth/application/guards/role.guard';
import { TestAiConnectionCommand } from '../application/commands';
import { AiCallDto, AiLimitsDto, AiStatusDto, AiTestResultDto, AiUsageDto } from '../application/ai.dto';
import { GetAiLimitsQuery, GetAiStatusQuery, GetAiUsageQuery, ListAiCallsQuery } from '../application/queries';

@Controller('ai')
@UseGuards(JwtAccessGuard, RoleGuard)
@Roles(['ADMIN'])
export class AiAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Get('status')
  status(): Promise<AiStatusDto> {
    return this.queryBus.execute(new GetAiStatusQuery());
  }

  @Get('usage')
  usage(@Query('range') range?: string): Promise<AiUsageDto> {
    return this.queryBus.execute(new GetAiUsageQuery(range));
  }

  @Get('limits')
  limits(): Promise<AiLimitsDto> {
    return this.queryBus.execute(new GetAiLimitsQuery());
  }

  @Get('calls')
  calls(@Query('limit') limit?: string): Promise<AiCallDto[]> {
    return this.queryBus.execute(new ListAiCallsQuery(limit));
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  test(@Body() body: unknown): Promise<AiTestResultDto> {
    return this.commandBus.execute(new TestAiConnectionCommand(body));
  }
}
