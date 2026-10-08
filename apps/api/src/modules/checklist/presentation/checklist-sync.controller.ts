import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ThrottlerGuard } from '@nestjs/throttler';

import { SyncChecklistDocsCommand } from '../application/commands';
import { ChecklistSyncTokenGuard } from '../application/guards/checklist-sync-token.guard';

/** The push route for `pnpm checklist:push`. Sync token only, no user session (CHK-004). */
@Controller('checklist/sync')
@UseGuards(ThrottlerGuard, ChecklistSyncTokenGuard)
export class ChecklistSyncController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async sync(@Body() body: unknown) {
    return await this.commandBus.execute(new SyncChecklistDocsCommand(body));
  }
}
