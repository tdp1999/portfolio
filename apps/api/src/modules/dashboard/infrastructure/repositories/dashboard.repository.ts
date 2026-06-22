import { Injectable } from '@nestjs/common';
import { PostStatus } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma';
import { IDashboardRepository } from '../../application/ports/dashboard.repository.port';
import { DashboardStatsDto } from '../../application/dashboard.dto';

@Injectable()
export class DashboardRepository implements IDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<DashboardStatsDto> {
    const [totalPosts, mediaFiles, published, drafts] = await Promise.all([
      this.prisma.blogPost.count({ where: { deletedAt: null } }),
      this.prisma.media.count({ where: { deletedAt: null } }),
      this.prisma.blogPost.count({ where: { deletedAt: null, status: PostStatus.PUBLISHED } }),
      this.prisma.blogPost.count({ where: { deletedAt: null, status: PostStatus.DRAFT } }),
    ]);

    return { totalPosts, mediaFiles, published, drafts };
  }
}
