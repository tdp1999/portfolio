import { ListPostsQuery, ListPostsHandler } from './list-posts.query';
import { GetPostByIdQuery, GetPostByIdHandler } from './get-post-by-id.query';
import { ListPublicPostsQuery, ListPublicPostsHandler } from './list-public-posts.query';
import { GetPublicPostBySlugQuery, GetPublicPostBySlugHandler } from './get-public-post-by-slug.query';
import { ListFeaturedPostsQuery, ListFeaturedPostsHandler } from './list-featured-posts.query';
import { IBlogPostRepository } from '../ports/blog-post.repository.port';
import { ICategoryRepository } from '../../../category/application/ports/category.repository.port';
import { ITagRepository } from '../../../tag/application/ports/tag.repository.port';
import { IProfileRepository } from '../../../profile/application/ports/profile.repository.port';
import { IUserRepository } from '../../../user/application/ports/user.repository.port';
import { BlogPost } from '../../domain/entities/blog-post.entity';
import { IBlogPostProps } from '../../domain/blog-post.types';
import { BlogPostReadResult } from '../../infrastructure/mapper/blog-post.mapper';
import { Category } from '../../../category/domain/entities/category.entity';
import { Tag } from '../../../tag/domain/entities/tag.entity';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const POST_ID = '550e8400-e29b-41d4-a716-446655440001';

const baseProps: IBlogPostProps = {
  id: POST_ID,
  slug: 'hello',
  language: 'EN',
  title: 'Hello',
  excerpt: null,
  content: 'Body',
  readTimeMinutes: 1,
  status: 'PUBLISHED',
  featured: false,
  publishedAt: new Date('2026-01-01'),
  metaTitle: null,
  metaDescription: null,
  authorId: USER_ID,
  featuredImageId: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  createdById: USER_ID,
  updatedById: USER_ID,
  deletedAt: null,
  deletedById: null,
};

const makeReadResult = (overrides: Partial<IBlogPostProps> = {}): BlogPostReadResult => ({
  entity: BlogPost.load({ ...baseProps, ...overrides }),
  relations: {
    categories: [{ id: 'c1', name: 'Tech', slug: 'tech' }],
    tags: [{ id: 't1', name: 'Angular', slug: 'angular' }],
  },
  featuredImageUrl: null,
});

function makeBlogRepoMock(): jest.Mocked<IBlogPostRepository> {
  return {
    add: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
    findById: jest.fn(),
    findByIdIncludeDeleted: jest.fn(),
    list: jest.fn(),
    findBySlug: jest.fn(),
    listPublic: jest.fn(),
    listFeatured: jest.fn(),
    findRelated: jest.fn(),
    slugExists: jest.fn(),
  };
}

describe('BlogPost Queries', () => {
  // ---------- ListPostsQuery (admin) ----------
  describe('ListPostsHandler', () => {
    let repo: jest.Mocked<IBlogPostRepository>;
    let handler: ListPostsHandler;

    beforeEach(() => {
      repo = makeBlogRepoMock();
      repo.list.mockResolvedValue({ data: [makeReadResult()], total: 1 });
      handler = new ListPostsHandler(repo);
    });

    it('returns paginated admin list', async () => {
      const result = await handler.execute(new ListPostsQuery({ page: 1, limit: 10 }));
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(POST_ID);
      expect(result.page).toBe(1);
    });

    it('applies status filter', async () => {
      await handler.execute(new ListPostsQuery({ status: 'DRAFT' }));
      const opts = repo.list.mock.calls[0][0];
      expect(opts.status).toBe('DRAFT');
    });

    it('passes search', async () => {
      await handler.execute(new ListPostsQuery({ search: 'hello' }));
      expect(repo.list.mock.calls[0][0].search).toBe('hello');
    });

    it('returns empty result', async () => {
      repo.list.mockResolvedValueOnce({ data: [], total: 0 });
      const result = await handler.execute(new ListPostsQuery({}));
      expect(result.data).toEqual([]);
    });
  });

  // ---------- GetPostByIdQuery ----------
  describe('GetPostByIdHandler', () => {
    let repo: jest.Mocked<IBlogPostRepository>;
    let handler: GetPostByIdHandler;

    beforeEach(() => {
      repo = makeBlogRepoMock();
      handler = new GetPostByIdHandler(repo);
    });

    it('returns full admin detail', async () => {
      repo.findByIdIncludeDeleted.mockResolvedValue(makeReadResult());
      const r = await handler.execute(new GetPostByIdQuery(POST_ID));
      expect(r.id).toBe(POST_ID);
      expect(r.content).toBe('Body');
    });

    it('throws NotFound when missing', async () => {
      repo.findByIdIncludeDeleted.mockResolvedValue(null);
      await expect(handler.execute(new GetPostByIdQuery(POST_ID))).rejects.toThrow();
    });
  });

  // ---------- ListPublicPostsQuery ----------
  describe('ListPublicPostsHandler', () => {
    let repo: jest.Mocked<IBlogPostRepository>;
    let categoryRepo: jest.Mocked<ICategoryRepository>;
    let tagRepo: jest.Mocked<ITagRepository>;
    let handler: ListPublicPostsHandler;

    beforeEach(() => {
      repo = makeBlogRepoMock();
      categoryRepo = { findBySlug: jest.fn() } as unknown as jest.Mocked<ICategoryRepository>;
      tagRepo = { findBySlug: jest.fn() } as unknown as jest.Mocked<ITagRepository>;
      repo.listPublic.mockResolvedValue({ data: [makeReadResult()], total: 1 });
      handler = new ListPublicPostsHandler(repo, categoryRepo, tagRepo);
    });

    it('returns public list shape', async () => {
      const r = await handler.execute(new ListPublicPostsQuery({}));
      expect(r.data).toHaveLength(1);
      expect(r.data[0].slug).toBe('hello');
      expect(r.data[0]).not.toHaveProperty('content');
    });

    it('resolves categorySlug to id', async () => {
      categoryRepo.findBySlug.mockResolvedValue({ id: 'cat-1' } as Category);
      await handler.execute(new ListPublicPostsQuery({ categorySlug: 'tech' }));
      expect(categoryRepo.findBySlug).toHaveBeenCalledWith('tech');
      expect(repo.listPublic.mock.calls[0][0].categoryId).toBe('cat-1');
    });

    it('returns empty when category slug not found', async () => {
      categoryRepo.findBySlug.mockResolvedValue(null);
      const r = await handler.execute(new ListPublicPostsQuery({ categorySlug: 'missing' }));
      expect(r.data).toEqual([]);
      expect(r.total).toBe(0);
      expect(repo.listPublic).not.toHaveBeenCalled();
    });

    it('resolves tagSlug to id', async () => {
      tagRepo.findBySlug.mockResolvedValue({ id: 'tag-1' } as Tag);
      await handler.execute(new ListPublicPostsQuery({ tagSlug: 'angular' }));
      expect(repo.listPublic.mock.calls[0][0].tagId).toBe('tag-1');
    });
  });

  // ---------- GetPublicPostBySlugQuery ----------
  describe('GetPublicPostBySlugHandler', () => {
    let repo: jest.Mocked<IBlogPostRepository>;
    let profileRepo: jest.Mocked<IProfileRepository>;
    let userRepo: jest.Mocked<IUserRepository>;
    let handler: GetPublicPostBySlugHandler;

    beforeEach(() => {
      repo = makeBlogRepoMock();
      profileRepo = { findWithMedia: jest.fn() } as unknown as jest.Mocked<IProfileRepository>;
      userRepo = { findById: jest.fn() } as unknown as jest.Mocked<IUserRepository>;
      repo.findRelated.mockResolvedValue([]);
      handler = new GetPublicPostBySlugHandler(repo, profileRepo, userRepo);
    });

    it('returns full detail with related and author from profile', async () => {
      repo.findBySlug.mockResolvedValue(makeReadResult());
      profileRepo.findWithMedia.mockResolvedValue({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        profile: { fullName: { en: 'Phong', vi: 'Phong' }, bioShort: { en: 'Dev', vi: 'Dev' } } as any,
        avatarUrl: 'https://cdn/a.png',
        ogImageUrl: null,
      });
      repo.findRelated.mockResolvedValue([makeReadResult({ id: 'rel-1', slug: 'rel-1' })]);

      const r = await handler.execute(new GetPublicPostBySlugQuery('hello'));
      expect(r.author).toEqual({ id: USER_ID, name: 'Phong', avatarUrl: 'https://cdn/a.png', shortBio: 'Dev' });
      expect(r.relatedPosts).toHaveLength(1);
      expect(r.relatedPosts[0].slug).toBe('rel-1');
      expect(r.content).toBe('Body');
    });

    it('falls back to user.name when profile missing', async () => {
      repo.findBySlug.mockResolvedValue(makeReadResult());
      profileRepo.findWithMedia.mockResolvedValue(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userRepo.findById.mockResolvedValue({ name: 'Fallback User' } as any);

      const r = await handler.execute(new GetPublicPostBySlugQuery('hello'));
      expect(r.author).toEqual({ id: USER_ID, name: 'Fallback User', avatarUrl: null, shortBio: null });
    });

    it('returns null author when neither profile nor user found', async () => {
      repo.findBySlug.mockResolvedValue(makeReadResult());
      profileRepo.findWithMedia.mockResolvedValue(null);
      userRepo.findById.mockResolvedValue(null);

      const r = await handler.execute(new GetPublicPostBySlugQuery('hello'));
      expect(r.author).toBeNull();
    });

    it('throws NotFound for missing slug (covers DRAFT/PRIVATE/deleted via repo filter)', async () => {
      repo.findBySlug.mockResolvedValue(null);
      await expect(handler.execute(new GetPublicPostBySlugQuery('missing'))).rejects.toThrow();
    });
  });

  // ---------- ListFeaturedPostsQuery ----------
  describe('ListFeaturedPostsHandler', () => {
    let repo: jest.Mocked<IBlogPostRepository>;
    let handler: ListFeaturedPostsHandler;

    beforeEach(() => {
      repo = makeBlogRepoMock();
      handler = new ListFeaturedPostsHandler(repo);
    });

    it('returns mapped featured posts', async () => {
      repo.listFeatured.mockResolvedValue([makeReadResult({ featured: true })]);
      const r = await handler.execute(new ListFeaturedPostsQuery());
      expect(r).toHaveLength(1);
      expect(r[0]).not.toHaveProperty('content');
    });

    it('returns empty array when none featured', async () => {
      repo.listFeatured.mockResolvedValue([]);
      const r = await handler.execute(new ListFeaturedPostsQuery());
      expect(r).toEqual([]);
    });
  });
});
