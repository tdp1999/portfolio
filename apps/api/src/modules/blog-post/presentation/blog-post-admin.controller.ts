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
import { CreatePostCommand, UpdatePostCommand, DeletePostCommand, RestorePostCommand } from '../application/commands';
import { ListPostsQuery, GetPostByIdQuery, ConvertMarkdownQuery } from '../application/queries';
import type { ConvertMarkdownResultDto } from '../application/blog-post.dto';

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

  // Stateless transform — converts Markdown to editor JSON for the console to
  // prefill the editor. Does NOT create a post (the author Saves via POST / above).
  @Post('convert-markdown')
  @HttpCode(HttpStatus.OK)
  async convertMarkdown(@Body() body: unknown): Promise<ConvertMarkdownResultDto> {
    return this.queryBus.execute(new ConvertMarkdownQuery(body));
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
