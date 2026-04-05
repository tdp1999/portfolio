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
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthenticatedRequest } from '../../../shared/types';
import { JwtAccessGuard } from '../../auth/application/guards/jwt-access.guard';
import { RoleGuard, Roles } from '../../auth/application/guards/role.guard';
import {
  CreateExperienceCommand,
  UpdateExperienceCommand,
  DeleteExperienceCommand,
  RestoreExperienceCommand,
  ReorderExperiencesCommand,
} from '../application/commands';
import {
  ListExperiencesQuery,
  ListPublicExperiencesQuery,
  GetExperienceByIdQuery,
  GetExperienceBySlugQuery,
} from '../application/queries';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Controller('experiences')
export class ExperienceController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  // ── Public ─────────────────────────────────────────────────────────────────

  @Get()
  async listPublic() {
    return await this.queryBus.execute(new ListPublicExperiencesQuery());
  }

  // ── Admin List ──────────────────────────────────────────────────────────────
  // NOTE: Must be registered before @Get(':idOrSlug') to avoid route collision.

  @Get('admin/list')
  @UseGuards(JwtAccessGuard, RoleGuard)
  @Roles(['ADMIN'])
  async listAdmin(@Query() query: unknown) {
    return await this.queryBus.execute(new ListExperiencesQuery(query));
  }

  @Get(':idOrSlug')
  async getOne(@Param('idOrSlug') idOrSlug: string) {
    if (UUID_REGEX.test(idOrSlug)) {
      return await this.queryBus.execute(new GetExperienceByIdQuery(idOrSlug));
    }
    return await this.queryBus.execute(new GetExperienceBySlugQuery(idOrSlug));
  }

  // ── Admin ───────────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAccessGuard, RoleGuard)
  @Roles(['ADMIN'])
  async create(@Body() body: unknown, @Req() req: AuthenticatedRequest) {
    const id = await this.commandBus.execute(new CreateExperienceCommand(body, req.user.id));
    return { id };
  }

  // NOTE: PATCH /experiences/reorder must be registered BEFORE /:id to avoid route conflict
  @Patch('reorder')
  @UseGuards(JwtAccessGuard, RoleGuard)
  @Roles(['ADMIN'])
  async reorder(@Body() body: unknown, @Req() req: AuthenticatedRequest): Promise<{ success: boolean }> {
    await this.commandBus.execute(new ReorderExperiencesCommand(body, req.user.id));
    return { success: true };
  }

  @Patch(':id/restore')
  @UseGuards(JwtAccessGuard, RoleGuard)
  @Roles(['ADMIN'])
  async restore(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<{ success: boolean }> {
    await this.commandBus.execute(new RestoreExperienceCommand(id, req.user.id));
    return { success: true };
  }

  @Put(':id')
  @UseGuards(JwtAccessGuard, RoleGuard)
  @Roles(['ADMIN'])
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest
  ): Promise<{ success: boolean }> {
    await this.commandBus.execute(new UpdateExperienceCommand(id, body, req.user.id));
    return { success: true };
  }

  @Delete(':id')
  @UseGuards(JwtAccessGuard, RoleGuard)
  @Roles(['ADMIN'])
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<{ success: boolean }> {
    await this.commandBus.execute(new DeleteExperienceCommand(id, req.user.id));
    return { success: true };
  }
}
