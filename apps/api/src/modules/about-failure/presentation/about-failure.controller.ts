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
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthenticatedRequest } from '../../../shared/types';
import { JwtAccessGuard } from '../../auth/application/guards/jwt-access.guard';
import { RoleGuard, Roles } from '../../auth/application/guards/role.guard';
import {
  CreateAboutFailureCommand,
  UpdateAboutFailureCommand,
  DeleteAboutFailureCommand,
  ReorderAboutFailuresCommand,
} from '../application/commands';
import { ListAboutFailuresQuery, GetAboutFailureByIdQuery } from '../application/queries';

// ── Public ──────────────────────────────────────────────────────────────────

@Controller('about/failures')
export class AboutFailureController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async list() {
    return await this.queryBus.execute(new ListAboutFailuresQuery({ onlyPublished: true }));
  }
}

// ── Admin ───────────────────────────────────────────────────────────────────

@Controller('admin/about/failures')
@UseGuards(JwtAccessGuard, RoleGuard)
@Roles(['ADMIN'])
export class AdminAboutFailureController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Get()
  async list() {
    return await this.queryBus.execute(new ListAboutFailuresQuery({ onlyPublished: false }));
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.queryBus.execute(new GetAboutFailureByIdQuery(id));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: unknown, @Req() req: AuthenticatedRequest) {
    const id = await this.commandBus.execute(new CreateAboutFailureCommand(body, req.user.id));
    return { id };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest
  ): Promise<{ success: boolean }> {
    await this.commandBus.execute(new UpdateAboutFailureCommand(id, body, req.user.id));
    return { success: true };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<{ success: boolean }> {
    await this.commandBus.execute(new DeleteAboutFailureCommand(id, req.user.id));
    return { success: true };
  }

  @Post('reorder')
  @HttpCode(HttpStatus.OK)
  async reorder(@Body() body: unknown, @Req() req: AuthenticatedRequest): Promise<{ success: boolean }> {
    await this.commandBus.execute(new ReorderAboutFailuresCommand(body, req.user.id));
    return { success: true };
  }
}
