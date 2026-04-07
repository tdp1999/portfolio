import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ListPublicPostsQuery, GetPublicPostBySlugQuery, ListFeaturedPostsQuery } from '../application/queries';

@Controller('blog')
export class BlogPostPublicController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async list(@Query() query: unknown) {
    return await this.queryBus.execute(new ListPublicPostsQuery(query));
  }

  @Get('featured')
  async featured() {
    return await this.queryBus.execute(new ListFeaturedPostsQuery());
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    return await this.queryBus.execute(new GetPublicPostBySlugQuery(slug));
  }
}
