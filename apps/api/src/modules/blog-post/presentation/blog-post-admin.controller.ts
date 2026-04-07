import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
  CreatePostCommand,
  UpdatePostCommand,
  DeletePostCommand,
  RestorePostCommand,
  ImportMarkdownCommand,
} from '../application/commands';
import { ListPostsQuery, GetPostByIdQuery } from '../application/queries';

@Controller('admin/blog')
@UseGuards(JwtAccessGuard, RoleGuard)
@Roles(['ADMIN'])
export class BlogPostAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Get()
  async list(@Query() query: unknown) {
    return await this.queryBus.execute(new ListPostsQuery(query));
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.queryBus.execute(new GetPostByIdQuery(id));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: unknown, @Req() req: AuthenticatedRequest): Promise<{ id: string }> {
    const id = await this.commandBus.execute(new CreatePostCommand(body, req.user.id));
    return { id };
  }

  @Post('import-markdown')
  @HttpCode(HttpStatus.CREATED)
  async importMarkdown(@Body() body: unknown, @Req() req: AuthenticatedRequest): Promise<{ id: string }> {
    const id = await this.commandBus.execute(new ImportMarkdownCommand(body, req.user.id));
    return { id };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest
  ): Promise<{ success: boolean }> {
    await this.commandBus.execute(new UpdatePostCommand(id, body, req.user.id));
    return { success: true };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<{ success: boolean }> {
    await this.commandBus.execute(new DeletePostCommand(id, req.user.id));
    return { success: true };
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<{ success: boolean }> {
    await this.commandBus.execute(new RestorePostCommand(id, req.user.id));
    return { success: true };
  }
}
