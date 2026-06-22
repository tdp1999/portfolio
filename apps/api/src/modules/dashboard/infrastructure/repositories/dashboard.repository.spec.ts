import { PostStatus } from '@prisma/client';
import { DashboardRepository } from './dashboard.repository';
import { PrismaService } from '../../../../infrastructure/prisma';

describe('DashboardRepository', () => {
  let repo: DashboardRepository;
  let blogPostCount: jest.Mock;
  let mediaCount: jest.Mock;
  let prisma: { blogPost: { count: jest.Mock }; media: { count: jest.Mock } };

  beforeEach(() => {
    blogPostCount = jest.fn();
    mediaCount = jest.fn();
    prisma = { blogPost: { count: blogPostCount }, media: { count: mediaCount } };
    repo = new DashboardRepository(prisma as unknown as PrismaService);
  });

  it('maps the four counts to the stats DTO in order', async () => {
    // call order in Promise.all: totalPosts, mediaFiles, published, drafts
    blogPostCount
      .mockResolvedValueOnce(24) // totalPosts
      .mockResolvedValueOnce(18) // published
      .mockResolvedValueOnce(6); // drafts
    mediaCount.mockResolvedValueOnce(156); // mediaFiles

    const stats = await repo.getStats();

    expect(stats).toEqual({ totalPosts: 24, mediaFiles: 156, published: 18, drafts: 6 });
  });

  it('excludes soft-deleted records and filters published/draft by status', async () => {
    blogPostCount.mockResolvedValue(0);
    mediaCount.mockResolvedValue(0);

    await repo.getStats();

    expect(blogPostCount).toHaveBeenCalledWith({ where: { deletedAt: null } });
    expect(mediaCount).toHaveBeenCalledWith({ where: { deletedAt: null } });
    expect(blogPostCount).toHaveBeenCalledWith({
      where: { deletedAt: null, status: PostStatus.PUBLISHED },
    });
    expect(blogPostCount).toHaveBeenCalledWith({
      where: { deletedAt: null, status: PostStatus.DRAFT },
    });
  });
});
