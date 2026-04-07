import { CreatePostCommand, CreatePostHandler } from './create-post.command';
import { UpdatePostCommand, UpdatePostHandler } from './update-post.command';
import { DeletePostCommand, DeletePostHandler } from './delete-post.command';
import { RestorePostCommand, RestorePostHandler } from './restore-post.command';
import { ImportMarkdownCommand, ImportMarkdownHandler, extractH1Title } from './import-markdown.command';
import { IBlogPostRepository } from '../ports/blog-post.repository.port';
import { BlogPost } from '../../domain/entities/blog-post.entity';
import { IBlogPostProps } from '../../domain/blog-post.types';
import { BlogPostReadResult } from '../../infrastructure/mapper/blog-post.mapper';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const POST_ID = '550e8400-e29b-41d4-a716-446655440001';
const CAT_ID = '550e8400-e29b-41d4-a716-446655440010';
const TAG_ID = '550e8400-e29b-41d4-a716-446655440020';

const baseProps: IBlogPostProps = {
  id: POST_ID,
  slug: 'hello-world',
  language: 'EN',
  title: 'Hello World',
  excerpt: null,
  content: 'Body',
  readTimeMinutes: 1,
  status: 'DRAFT',
  featured: false,
  publishedAt: null,
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

const loadEntity = (overrides: Partial<IBlogPostProps> = {}) => BlogPost.load({ ...baseProps, ...overrides });

const makeReadResult = (overrides: Partial<IBlogPostProps> = {}): BlogPostReadResult => ({
  entity: loadEntity(overrides),
  relations: {
    categories: [{ id: CAT_ID, name: 'Tech', slug: 'tech' }],
    tags: [{ id: TAG_ID, name: 'Angular', slug: 'angular' }],
  },
  featuredImageUrl: null,
});

function makeRepoMock(): jest.Mocked<IBlogPostRepository> {
  return {
    add: jest.fn().mockResolvedValue(POST_ID),
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
    slugExists: jest.fn().mockResolvedValue(false),
  };
}

describe('BlogPost Commands', () => {
  let repo: jest.Mocked<IBlogPostRepository>;

  beforeEach(() => {
    repo = makeRepoMock();
  });

  // ---------- CreatePostCommand ----------
  describe('CreatePostHandler', () => {
    const handler = () => new CreatePostHandler(repo);
    const validDto = { title: 'Hello', content: 'Body' };

    it('creates a draft post and returns id', async () => {
      const id = await handler().execute(new CreatePostCommand(validDto, USER_ID));
      expect(id).toBe(POST_ID);
      expect(repo.add).toHaveBeenCalledTimes(1);
      const arg = repo.add.mock.calls[0][0];
      expect(arg.entity.status).toBe('DRAFT');
      expect(arg.entity.authorId).toBe(USER_ID);
      expect(arg.categoryIds).toEqual([]);
    });

    it('publishes when status=PUBLISHED', async () => {
      await handler().execute(new CreatePostCommand({ ...validDto, status: 'PUBLISHED' }, USER_ID));
      const arg = repo.add.mock.calls[0][0];
      expect(arg.entity.status).toBe('PUBLISHED');
      expect(arg.entity.publishedAt).toBeInstanceOf(Date);
    });

    it('rejects invalid input', async () => {
      await expect(handler().execute(new CreatePostCommand({ title: '' }, USER_ID))).rejects.toThrow();
      expect(repo.add).not.toHaveBeenCalled();
    });

    it('appends suffix on slug collision', async () => {
      repo.slugExists.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
      await handler().execute(new CreatePostCommand(validDto, USER_ID));
      const arg = repo.add.mock.calls[0][0];
      expect(arg.entity.slug).toBe('hello-2');
    });

    it('passes through categoryIds and tagIds', async () => {
      await handler().execute(new CreatePostCommand({ ...validDto, categoryIds: [CAT_ID], tagIds: [TAG_ID] }, USER_ID));
      const arg = repo.add.mock.calls[0][0];
      expect(arg.categoryIds).toEqual([CAT_ID]);
      expect(arg.tagIds).toEqual([TAG_ID]);
    });
  });

  // ---------- UpdatePostCommand ----------
  describe('UpdatePostHandler', () => {
    const handler = () => new UpdatePostHandler(repo);

    it('updates an existing post', async () => {
      repo.findByIdIncludeDeleted.mockResolvedValue(makeReadResult());
      await handler().execute(new UpdatePostCommand(POST_ID, { title: 'New Title' }, USER_ID));
      expect(repo.update).toHaveBeenCalledTimes(1);
      const [id, input] = repo.update.mock.calls[0];
      expect(id).toBe(POST_ID);
      expect(input.entity.title).toBe('New Title');
    });

    it('throws NotFound when post missing', async () => {
      repo.findByIdIncludeDeleted.mockResolvedValue(null);
      await expect(handler().execute(new UpdatePostCommand(POST_ID, { title: 'X' }, USER_ID))).rejects.toThrow();
    });

    it('auto-sets publishedAt on first PUBLISHED transition', async () => {
      repo.findByIdIncludeDeleted.mockResolvedValue(makeReadResult({ status: 'DRAFT', publishedAt: null }));
      await handler().execute(new UpdatePostCommand(POST_ID, { status: 'PUBLISHED' }, USER_ID));
      const input = repo.update.mock.calls[0][1];
      expect(input.entity.status).toBe('PUBLISHED');
      expect(input.entity.publishedAt).toBeInstanceOf(Date);
    });

    it('recalculates readTime when content changes', async () => {
      const longContent = Array(600).fill('word').join(' ');
      repo.findByIdIncludeDeleted.mockResolvedValue(makeReadResult({ readTimeMinutes: 1 }));
      await handler().execute(new UpdatePostCommand(POST_ID, { content: longContent }, USER_ID));
      const input = repo.update.mock.calls[0][1];
      expect(input.entity.readTimeMinutes).toBe(3);
    });

    it('preserves existing categories when not provided', async () => {
      repo.findByIdIncludeDeleted.mockResolvedValue(makeReadResult());
      await handler().execute(new UpdatePostCommand(POST_ID, { title: 'X' }, USER_ID));
      const input = repo.update.mock.calls[0][1];
      expect(input.categoryIds).toEqual([CAT_ID]);
      expect(input.tagIds).toEqual([TAG_ID]);
    });

    it('replaces categories when explicitly provided', async () => {
      const NEW_CAT = '550e8400-e29b-41d4-a716-446655440099';
      repo.findByIdIncludeDeleted.mockResolvedValue(makeReadResult());
      await handler().execute(new UpdatePostCommand(POST_ID, { categoryIds: [NEW_CAT] }, USER_ID));
      const input = repo.update.mock.calls[0][1];
      expect(input.categoryIds).toEqual([NEW_CAT]);
    });
  });

  // ---------- DeletePostCommand ----------
  describe('DeletePostHandler', () => {
    const handler = () => new DeletePostHandler(repo);

    it('soft-deletes an existing post', async () => {
      repo.findByIdIncludeDeleted.mockResolvedValue(makeReadResult());
      await handler().execute(new DeletePostCommand(POST_ID, USER_ID));
      expect(repo.softDelete).toHaveBeenCalledTimes(1);
    });

    it('throws when already deleted', async () => {
      repo.findByIdIncludeDeleted.mockResolvedValue(makeReadResult({ deletedAt: new Date(), deletedById: USER_ID }));
      await expect(handler().execute(new DeletePostCommand(POST_ID, USER_ID))).rejects.toThrow();
    });

    it('throws when not found', async () => {
      repo.findByIdIncludeDeleted.mockResolvedValue(null);
      await expect(handler().execute(new DeletePostCommand(POST_ID, USER_ID))).rejects.toThrow();
    });
  });

  // ---------- RestorePostCommand ----------
  describe('RestorePostHandler', () => {
    const handler = () => new RestorePostHandler(repo);

    it('restores a soft-deleted post', async () => {
      repo.findByIdIncludeDeleted.mockResolvedValue(makeReadResult({ deletedAt: new Date(), deletedById: USER_ID }));
      await handler().execute(new RestorePostCommand(POST_ID, USER_ID));
      expect(repo.restore).toHaveBeenCalledTimes(1);
    });

    it('throws when not deleted', async () => {
      repo.findByIdIncludeDeleted.mockResolvedValue(makeReadResult());
      await expect(handler().execute(new RestorePostCommand(POST_ID, USER_ID))).rejects.toThrow();
    });

    it('throws when not found', async () => {
      repo.findByIdIncludeDeleted.mockResolvedValue(null);
      await expect(handler().execute(new RestorePostCommand(POST_ID, USER_ID))).rejects.toThrow();
    });
  });

  // ---------- ImportMarkdownCommand ----------
  describe('ImportMarkdownHandler', () => {
    const handler = () => new ImportMarkdownHandler(repo);

    it('extracts title from h1', () => {
      expect(extractH1Title('# My Title\n\nbody')).toBe('My Title');
      expect(extractH1Title('no heading here')).toBeNull();
    });

    it('imports markdown with h1 heading as DRAFT', async () => {
      const id = await handler().execute(new ImportMarkdownCommand({ content: '# Imported\n\nbody' }, USER_ID));
      expect(id).toBe(POST_ID);
      const arg = repo.add.mock.calls[0][0];
      expect(arg.entity.title).toBe('Imported');
      expect(arg.entity.status).toBe('DRAFT');
    });

    it('imports with explicit title when no h1', async () => {
      await handler().execute(new ImportMarkdownCommand({ title: 'Manual', content: 'no heading body' }, USER_ID));
      const arg = repo.add.mock.calls[0][0];
      expect(arg.entity.title).toBe('Manual');
    });

    it('throws when no h1 and no explicit title', async () => {
      await expect(
        handler().execute(new ImportMarkdownCommand({ content: 'body without heading' }, USER_ID))
      ).rejects.toThrow();
    });

    it('throws on empty content', async () => {
      await expect(handler().execute(new ImportMarkdownCommand({ content: '' }, USER_ID))).rejects.toThrow();
    });
  });
});
