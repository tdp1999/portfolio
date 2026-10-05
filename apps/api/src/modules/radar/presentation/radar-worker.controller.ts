import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { ClaimWorkCommand, SubmitResultsCommand } from '../application/commands';
import { MachineTokenGuard } from '../application/guards/machine-token.guard';
import { GetWorkflowProfileQuery } from '../application/queries';

/** Routes for the external worker (Claude Code, `/radar work`). Machine token only, no user session. */
@Controller('radar/work')
@UseGuards(ThrottlerGuard, MachineTokenGuard)
@Throttle({ default: { limit: 120, ttl: 60_000 } })
export class RadarWorkerController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post('claim')
  @HttpCode(HttpStatus.OK)
  async claim(@Body() body: unknown) {
    return await this.commandBus.execute(new ClaimWorkCommand(body));
  }

  @Post('results')
  @HttpCode(HttpStatus.OK)
  async submitResults(@Body() body: unknown) {
    return await this.commandBus.execute(new SubmitResultsCommand(body));
  }

  @Get('profile')
  async profile() {
    return await this.queryBus.execute(new GetWorkflowProfileQuery());
  }
}
