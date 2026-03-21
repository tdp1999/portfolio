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
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthenticatedRequest } from '../../../shared/types';
import { JwtAccessGuard } from '../../auth/application/guards/jwt-access.guard';
import { RoleGuard, Roles } from '../../auth/application/guards/role.guard';
import {
  CreateSkillCommand,
  UpdateSkillCommand,
  DeleteSkillCommand,
  RestoreSkillCommand,
} from '../application/commands';
import { ListSkillsQuery, GetSkillByIdQuery, GetSkillBySlugQuery, GetSkillChildrenQuery } from '../application/queries';

@Controller('skills')
export class SkillController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Get()
  async list(@Query() query: unknown) {
    return await this.queryBus.execute(new ListSkillsQuery(query));
  }

  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    return await this.queryBus.execute(new GetSkillBySlugQuery(slug));
  }

  @Get(':id/children')
  async getChildren(@Param('id') id: string) {
    return await this.queryBus.execute(new GetSkillChildrenQuery(id));
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.queryBus.execute(new GetSkillByIdQuery(id));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAccessGuard, RoleGuard)
  @Roles(['ADMIN'])
  async create(@Body() body: unknown, @Req() req: AuthenticatedRequest) {
    const id = await this.commandBus.execute(new CreateSkillCommand(body, req.user.id));
    return { id };
  }

  @Patch(':id')
  @UseGuards(JwtAccessGuard, RoleGuard)
  @Roles(['ADMIN'])
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest
  ): Promise<{ success: boolean }> {
    await this.commandBus.execute(new UpdateSkillCommand(id, body, req.user.id));
    return { success: true };
  }

  @Delete(':id')
  @UseGuards(JwtAccessGuard, RoleGuard)
  @Roles(['ADMIN'])
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<{ success: boolean }> {
    await this.commandBus.execute(new DeleteSkillCommand(id, req.user.id));
    return { success: true };
  }

  @Post(':id/restore')
  @UseGuards(JwtAccessGuard, RoleGuard)
  @Roles(['ADMIN'])
  async restore(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<{ success: boolean }> {
    await this.commandBus.execute(new RestoreSkillCommand(id, req.user.id));
    return { success: true };
  }
}
