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
  CreateProjectCommand,
  UpdateProjectCommand,
  DeleteProjectCommand,
  RestoreProjectCommand,
  ReorderProjectsCommand,
} from '../application/commands';
import {
  ListProjectsQuery,
  GetProjectByIdQuery,
  GetProjectBySlugQuery,
  ListPublicProjectsQuery,
  ListFeaturedProjectsQuery,
} from '../application/queries';

@Controller('projects')
export class ProjectController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  // ── Public ─────────────────────────────────────────────────────────────────

  @Get()
  async listPublic() {
    return await this.queryBus.execute(new ListPublicProjectsQuery());
  }

  // NOTE: Must be registered before :slug to avoid route collision.
  @Get('featured')
  async listFeatured() {
    return await this.queryBus.execute(new ListFeaturedProjectsQuery());
  }

  // ── Admin List ──────────────────────────────────────────────────────────────
  // NOTE: Must be registered before :slug to avoid route collision.

  @Get('admin/list')
  @UseGuards(JwtAccessGuard, RoleGuard)
  @Roles(['ADMIN'])
  async listAdmin(@Query() query: unknown) {
    return await this.queryBus.execute(new ListProjectsQuery(query));
  }

  @Get(':idOrSlug')
  async getOne(@Param('idOrSlug') idOrSlug: string) {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (UUID_REGEX.test(idOrSlug)) {
      return await this.queryBus.execute(new GetProjectByIdQuery(idOrSlug));
    }
    return await this.queryBus.execute(new GetProjectBySlugQuery(idOrSlug));
  }

  // ── Admin ───────────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAccessGuard, RoleGuard)
  @Roles(['ADMIN'])
  async create(@Body() body: unknown, @Req() req: AuthenticatedRequest) {
    const id = await this.commandBus.execute(new CreateProjectCommand(body, req.user.id));
    return { id };
  }

  @Patch('reorder')
  @UseGuards(JwtAccessGuard, RoleGuard)
  @Roles(['ADMIN'])
  async reorder(@Body() body: unknown, @Req() req: AuthenticatedRequest): Promise<{ success: boolean }> {
    await this.commandBus.execute(new ReorderProjectsCommand(body, req.user.id));
    return { success: true };
  }

  @Patch(':id/restore')
  @UseGuards(JwtAccessGuard, RoleGuard)
  @Roles(['ADMIN'])
  async restore(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<{ success: boolean }> {
    await this.commandBus.execute(new RestoreProjectCommand(id, req.user.id));
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
    await this.commandBus.execute(new UpdateProjectCommand(id, body, req.user.id));
    return { success: true };
  }

  @Delete(':id')
  @UseGuards(JwtAccessGuard, RoleGuard)
  @Roles(['ADMIN'])
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<{ success: boolean }> {
    await this.commandBus.execute(new DeleteProjectCommand(id, req.user.id));
    return { success: true };
  }
}
