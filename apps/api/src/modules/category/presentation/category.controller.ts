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
import { CreateCategoryCommand, UpdateCategoryCommand, DeleteCategoryCommand } from '../application/commands';
import { ListCategoriesQuery, GetCategoryByIdQuery, GetCategoryBySlugQuery } from '../application/queries';

@Controller('categories')
export class CategoryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Get()
  async list(@Query() query: unknown) {
    return await this.queryBus.execute(new ListCategoriesQuery(query));
  }

  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    return await this.queryBus.execute(new GetCategoryBySlugQuery(slug));
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.queryBus.execute(new GetCategoryByIdQuery(id));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAccessGuard, RoleGuard)
  @Roles(['ADMIN'])
  async create(@Body() body: unknown, @Req() req: AuthenticatedRequest) {
    const id = await this.commandBus.execute(new CreateCategoryCommand(body, req.user.id));
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
    await this.commandBus.execute(new UpdateCategoryCommand(id, body, req.user.id));
    return { success: true };
  }

  @Delete(':id')
  @UseGuards(JwtAccessGuard, RoleGuard)
  @Roles(['ADMIN'])
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<{ success: boolean }> {
    await this.commandBus.execute(new DeleteCategoryCommand(id, req.user.id));
    return { success: true };
  }
}
