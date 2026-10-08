import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { JwtAccessGuard } from '../../auth/application/guards/jwt-access.guard';
import { RoleGuard, Roles } from '../../auth/application/guards/role.guard';
import {
  CreateChecklistRunCommand,
  DeleteChecklistRunCommand,
  SaveChecklistRunBodyCommand,
  UpdateChecklistRunCommand,
} from '../application/commands';
import {
  GetChecklistDocQuery,
  GetChecklistRunQuery,
  ListChecklistDocsQuery,
  ListChecklistRunsQuery,
} from '../application/queries';

/** The Owner's checklist routes, called from the landing site's /checklist area (CHK-004). */
@Controller('checklist')
@UseGuards(JwtAccessGuard, RoleGuard)
@Roles(['ADMIN'])
export class ChecklistController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Get('docs')
  async listDocs(@Query() query: unknown) {
    return await this.queryBus.execute(new ListChecklistDocsQuery(query));
  }

  @Get('docs/:kind/:slug')
  async getDoc(@Param('kind') kind: string, @Param('slug') slug: string) {
    return await this.queryBus.execute(new GetChecklistDocQuery(kind, slug));
  }

  @Get('runs')
  async listRuns() {
    return await this.queryBus.execute(new ListChecklistRunsQuery());
  }

  @Post('runs')
  @HttpCode(HttpStatus.CREATED)
  async createRun(@Body() body: unknown) {
    const id = await this.commandBus.execute(new CreateChecklistRunCommand(body));
    return { id };
  }

  @Get('runs/:id')
  async getRun(@Param('id') id: string) {
    return await this.queryBus.execute(new GetChecklistRunQuery(id));
  }

  @Put('runs/:id')
  async saveRunBody(@Param('id') id: string, @Body() body: unknown) {
    return await this.commandBus.execute(new SaveChecklistRunBodyCommand(id, body));
  }

  @Patch('runs/:id')
  async updateRun(@Param('id') id: string, @Body() body: unknown): Promise<{ success: boolean }> {
    await this.commandBus.execute(new UpdateChecklistRunCommand(id, body));
    return { success: true };
  }

  @Delete('runs/:id')
  async deleteRun(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.commandBus.execute(new DeleteChecklistRunCommand(id));
    return { success: true };
  }
}
