import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { ClaimBriefCommand, ClaimWorkCommand, SubmitBriefCommand, SubmitResultsCommand } from '../application/commands';
import { MachineTokenGuard } from '../application/guards/machine-token.guard';
import { GetWorkflowProfileQuery, ListBriefItemsQuery } from '../application/queries';

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

  @Post('briefs/claim')
  @HttpCode(HttpStatus.OK)
  async claimBrief() {
    return await this.commandBus.execute(new ClaimBriefCommand());
  }

  @Get('briefs/:id/items')
  async briefItems(@Param('id') id: string, @Query() query: unknown) {
    return await this.queryBus.execute(new ListBriefItemsQuery(id, query));
  }

  @Post('briefs/:id/result')
  @HttpCode(HttpStatus.OK)
  async submitBrief(@Param('id') id: string, @Body() body: unknown) {
    return await this.commandBus.execute(new SubmitBriefCommand(id, body));
  }

  @Get('profile')
  async profile() {
    return await this.queryBus.execute(new GetWorkflowProfileQuery());
  }
}
