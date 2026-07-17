// Mock the rich-text barrel with a factory so the real RichTextService — which
// imports the ESM `document-engine-core` — is never loaded into this node-env spec.
// The commands import `plainTextFromDoc` from the rte-core barrel, which also pulls
// `rte.sanitize` → the ESM `isomorphic-dompurify`; stub it so this node-env spec loads.
// Read-time asserts nothing here (the mocked canonical is empty), so returning '' is fine.
jest.mock('@portfolio/shared/features/rte-core', () => ({
  plainTextFromDoc: jest.fn(() => ''),
}));

jest.mock('../../../rich-text', () => ({
  RichTextService: class {
    toCanonicalFormTranslatable = jest.fn().mockResolvedValue({
      json: { en: { schemaVersion: 1, content: {} }, vi: { schemaVersion: 1, content: {} } },
      canonical: { en: { schemaVersion: 1, content: [] }, vi: { schemaVersion: 1, content: [] } },
      html: { en: '', vi: '' },
      schemaVersion: 1,
    });
  },
}));

import { CreatePostCommand, CreatePostHandler } from './create-post.command';
import { UpdatePostCommand, UpdatePostHandler } from './update-post.command';
import { DeletePostCommand, DeletePostHandler } from './delete-post.command';
import { RestorePostCommand, RestorePostHandler } from './restore-post.command';
import { BulkPostCommand, BulkPostHandler } from './bulk-post.command';
import { BlogPostErrorCode } from '@portfolio/shared/errors';
import { IBlogPostRepository, BulkPostTarget } from '../ports/blog-post.repository.port';
import { BlogPost } from '../../domain/entities/blog-post.entity';
import { IBlogPostProps } from '../../domain/blog-post.types';
import { BlogPostReadResult } from '../../infrastructure/mapper/blog-post.mapper';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const POST_ID = '550e8400-e29b-41d4-a716-446655440001';
const CAT_ID = '550e8400-e29b-41d4-a716-446655440010';
const TAG_ID = '550e8400-e29b-41d4-a716-446655440020';
const COVER_ID = '550e8400-e29b-41d4-a716-446655440099';

// A single editor document — the create schema requires `contentJson`, so every
// create payload carries one; the mocked rich-text service canonicalizes it.
const CONTENT_JSON = { schemaVersion: 1, content: { type: 'doc', content: [] } };
// A persisted bilingual body — publishing an existing post (update → PUBLISHED without
// re-sending contentJson) requires the loaded entity to already carry contentJson.
const BILINGUAL_JSON = { en: { schemaVersion: 1, content: {} }, vi: { schemaVersion: 1, content: {} } };

const baseProps: IBlogPostProps = {
  id: POST_ID,
  slug: 'hello-world',
  language: 'EN',
  title: 'Hello World',
  excerpt: null,
  contentJson: null,
  contentHtml: null,
  contentSchemaVersion: 1,
  contentCanonical: null,
  readTimeMinutes: 1,
  status: 'DRAFT',
  featured: false,
  publishedAt: null,
  metaTitle: null,
  metaDescription: null,
  authorId: USER_ID,
  featuredImageId: '550e8400-e29b-41d4-a716-446655440099',
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
    bulkSoftDelete: jest.fn().mockResolvedValue(0),
    bulkRestore: jest.fn().mockResolvedValue(0),
    bulkPermanentDelete: jest.fn().mockResolvedValue(0),
    bulkSetStatus: jest.fn().mockResolvedValue(0),
    findBulkTargets: jest.fn().mockResolvedValue([]),
    findTakenSlugs: jest.fn().mockResolvedValue([]),
    findById: jest.fn(),
    findByIdIncludeDeleted: jest.fn(),
    list: jest.fn(),
    findBySlug: jest.fn(),
    listPublic: jest.fn(),
    listFeatured: jest.fn(),
    findRelatedByPrimaryCategory: jest.fn(),
    slugExists: jest.fn().mockResolvedValue(false),
  };
}

// Stubbed rich-text pipeline (the real service is jest.mocked above). Exercised on
// create (contentJson is required) and on update when contentJson is sent. `canonical`
// is an empty PortableDocument per locale so read-time derivation resolves to 0.
const richTextStub = {
  toCanonicalFormTranslatable: jest.fn().mockResolvedValue({
    json: { en: { schemaVersion: 1, content: {} }, vi: { schemaVersion: 1, content: {} } },
    canonical: { en: { schemaVersion: 1, content: [] }, vi: { schemaVersion: 1, content: [] } },
    html: { en: '', vi: '' },
    schemaVersion: 1,
  }),
} as never;
type RichTextStub = { toCanonicalFormTranslatable: jest.Mock };
const rtStub = richTextStub as RichTextStub;

describe('BlogPost Commands', () => {
  let repo: jest.Mocked<IBlogPostRepository>;

  beforeEach(() => {
    repo = makeRepoMock();
  });

  // ---------- CreatePostCommand ----------
  describe('CreatePostHandler', () => {
    const handler = () => new CreatePostHandler(repo, richTextStub);
    const validDto = { title: 'Hello', contentJson: CONTENT_JSON, featuredImageId: COVER_ID };

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

    it('PST-011: rejects payload without featuredImageId', async () => {
      await expect(
        handler().execute(new CreatePostCommand({ title: 'Hello', contentJson: CONTENT_JSON }, USER_ID))
      ).rejects.toThrow();
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

    it('canonicalizes contentJson wrapped under the post language and stores the triple', async () => {
      const contentJson = { schemaVersion: 1, content: { type: 'doc', content: [] } };
      rtStub.toCanonicalFormTranslatable.mockClear();
      await handler().execute(new CreatePostCommand({ ...validDto, language: 'VI', contentJson }, USER_ID));

      // Single doc wrapped into the bilingual envelope keyed by language (VI carries it).
      const [envelope, fieldName] = rtStub.toCanonicalFormTranslatable.mock.calls[0];
      expect(envelope.vi).toEqual(contentJson);
      expect(envelope.en.content.content).toEqual([]);
      expect(fieldName).toBe('blog-post.content');

      const arg = repo.add.mock.calls[0][0];
      expect(arg.entity.toProps().contentJson).toEqual({
        en: { schemaVersion: 1, content: {} },
        vi: { schemaVersion: 1, content: {} },
      });
    });

    it('always runs the rich pipeline (contentJson is required on create)', async () => {
      rtStub.toCanonicalFormTranslatable.mockClear();
      await handler().execute(new CreatePostCommand(validDto, USER_ID));
      expect(rtStub.toCanonicalFormTranslatable).toHaveBeenCalledTimes(1);
    });
  });

  // ---------- UpdatePostCommand ----------
  describe('UpdatePostHandler', () => {
    const handler = () => new UpdatePostHandler(repo, richTextStub);

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
      repo.findByIdIncludeDeleted.mockResolvedValue(
        makeReadResult({ status: 'DRAFT', publishedAt: null, contentJson: BILINGUAL_JSON })
      );
      await handler().execute(new UpdatePostCommand(POST_ID, { status: 'PUBLISHED' }, USER_ID));
      const input = repo.update.mock.calls[0][1];
      expect(input.entity.status).toBe('PUBLISHED');
      expect(input.entity.publishedAt).toBeInstanceOf(Date);
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

    it('canonicalizes contentJson wrapped under the post language and stores the triple', async () => {
      const contentJson = { schemaVersion: 1, content: { type: 'doc', content: [] } };
      rtStub.toCanonicalFormTranslatable.mockClear();
      repo.findByIdIncludeDeleted.mockResolvedValue(makeReadResult({ language: 'EN' }));
      await handler().execute(new UpdatePostCommand(POST_ID, { contentJson }, USER_ID));

      const [envelope, fieldName] = rtStub.toCanonicalFormTranslatable.mock.calls[0];
      expect(envelope.en).toEqual(contentJson);
      expect(envelope.vi.content.content).toEqual([]);
      expect(fieldName).toBe('blog-post.content');

      const input = repo.update.mock.calls[0][1];
      expect(input.entity.toProps().contentJson).toEqual({
        en: { schemaVersion: 1, content: {} },
        vi: { schemaVersion: 1, content: {} },
      });
    });

    it('skips the rich pipeline when no contentJson is sent', async () => {
      rtStub.toCanonicalFormTranslatable.mockClear();
      repo.findByIdIncludeDeleted.mockResolvedValue(makeReadResult());
      await handler().execute(new UpdatePostCommand(POST_ID, { title: 'X' }, USER_ID));
      expect(rtStub.toCanonicalFormTranslatable).not.toHaveBeenCalled();
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

  // ---------- BulkPostCommand ----------
  describe('BulkPostHandler', () => {
    const handler = () => new BulkPostHandler(repo);
    const ID_A = '550e8400-e29b-41d4-a716-4466554400aa';
    const ID_B = '550e8400-e29b-41d4-a716-4466554400bb';

    const target = (over: Partial<BulkPostTarget> & { id: string }): BulkPostTarget => ({
      title: 'Hello World',
      slug: 'hello-world',
      hasContent: true,
      isDeleted: false,
      ...over,
    });

    const run = (action: string, ids: string[] = [ID_A]) =>
      handler().execute(new BulkPostCommand({ ids, action }, USER_ID));

    it('rejects a malformed payload', async () => {
      await expect(run('publish', [])).rejects.toThrow();
      await expect(
        handler().execute(new BulkPostCommand({ ids: ['not-a-uuid'], action: 'publish' }, USER_ID))
      ).rejects.toThrow();
      await expect(
        handler().execute(new BulkPostCommand({ ids: [ID_A], action: 'explode' }, USER_ID))
      ).rejects.toThrow();
    });

    it('dispatches delete to repo.bulkSoftDelete', async () => {
      repo.findBulkTargets.mockResolvedValue([target({ id: ID_A })]);
      repo.bulkSoftDelete.mockResolvedValue(1);
      await run('delete');
      expect(repo.bulkSoftDelete).toHaveBeenCalledWith([ID_A], USER_ID);
    });

    it('dispatches permanent-delete to repo.bulkPermanentDelete', async () => {
      repo.findBulkTargets.mockResolvedValue([target({ id: ID_A, isDeleted: true })]);
      repo.bulkPermanentDelete.mockResolvedValue(1);
      await run('permanent-delete');
      expect(repo.bulkPermanentDelete).toHaveBeenCalledWith([ID_A]);
    });

    it('maps publish → PUBLISHED and unpublish → DRAFT', async () => {
      repo.findBulkTargets.mockResolvedValue([target({ id: ID_A })]);
      repo.bulkSetStatus.mockResolvedValue(1);

      await run('publish');
      expect(repo.bulkSetStatus).toHaveBeenCalledWith([ID_A], 'PUBLISHED', USER_ID);

      await run('unpublish');
      expect(repo.bulkSetStatus).toHaveBeenLastCalledWith([ID_A], 'DRAFT', USER_ID);
    });

    // Every repo method has a trash-state rail in its WHERE clause. Without a matching
    // check here the row is dropped by SQL and lands in neither count nor skipped —
    // the console would report a clean success for a post it never touched.
    it.each([
      ['publish', true],
      ['unpublish', true],
      ['delete', true],
      ['restore', false],
      ['permanent-delete', false],
    ] as const)('holds back %s when the post is in the wrong trash state', async (action, isDeleted) => {
      repo.findBulkTargets.mockResolvedValue([target({ id: ID_A, isDeleted })]);

      const result = await run(action);

      expect(result).toEqual({ count: 0, skipped: [{ id: ID_A, errorCode: BlogPostErrorCode.NOT_FOUND }] });
      expect(repo.bulkSetStatus).not.toHaveBeenCalled();
      expect(repo.bulkSoftDelete).not.toHaveBeenCalled();
      expect(repo.bulkRestore).not.toHaveBeenCalled();
      expect(repo.bulkPermanentDelete).not.toHaveBeenCalled();
    });

    it('reports an id that no longer exists as NOT_FOUND', async () => {
      repo.findBulkTargets.mockResolvedValue([target({ id: ID_A })]);
      repo.bulkSetStatus.mockResolvedValue(1);

      const result = await run('publish', [ID_A, ID_B]);

      expect(repo.bulkSetStatus).toHaveBeenCalledWith([ID_A], 'PUBLISHED', USER_ID);
      expect(result).toEqual({ count: 1, skipped: [{ id: ID_B, errorCode: BlogPostErrorCode.NOT_FOUND }] });
    });

    it('accounts for every submitted id', async () => {
      repo.findBulkTargets.mockResolvedValue([
        target({ id: ID_A }), // publishes
        target({ id: ID_B, hasContent: false }), // CONTENT_REQUIRED
      ]);
      repo.bulkSetStatus.mockResolvedValue(1);

      const ids = [ID_A, ID_B, '550e8400-e29b-41d4-a716-4466554400cc']; // third is gone
      const { count, skipped } = await run('publish', ids);

      expect(count + skipped.length).toBe(ids.length);
    });

    // The bulk SQL bypasses BlogPost.update(), so the CONTENT_REQUIRED invariant
    // has to be re-checked here or an empty draft reaches the public site.
    it('holds back posts that cannot be published', async () => {
      repo.findBulkTargets.mockResolvedValue([target({ id: ID_A }), target({ id: ID_B, hasContent: false })]);
      repo.bulkSetStatus.mockResolvedValue(1);

      const result = await run('publish', [ID_A, ID_B]);

      expect(repo.bulkSetStatus).toHaveBeenCalledWith([ID_A], 'PUBLISHED', USER_ID);
      expect(result).toEqual({ count: 1, skipped: [{ id: ID_B, errorCode: BlogPostErrorCode.CONTENT_REQUIRED }] });
    });

    it('treats a blank title as unpublishable', async () => {
      repo.findBulkTargets.mockResolvedValue([target({ id: ID_A, title: '   ' })]);
      const result = await run('publish');
      expect(repo.bulkSetStatus).not.toHaveBeenCalled();
      expect(result.skipped).toEqual([{ id: ID_A, errorCode: BlogPostErrorCode.CONTENT_REQUIRED }]);
    });

    // Slug uniqueness is app-enforced among active rows only (no DB constraint),
    // so restoring onto a taken slug would silently produce two posts on one URL.
    it('holds back a restore whose slug is already live', async () => {
      repo.findBulkTargets.mockResolvedValue([
        target({ id: ID_A, slug: 'free', isDeleted: true }),
        target({ id: ID_B, slug: 'taken', isDeleted: true }),
      ]);
      repo.findTakenSlugs.mockResolvedValue(['taken']);
      repo.bulkRestore.mockResolvedValue(1);

      const result = await run('restore', [ID_A, ID_B]);

      expect(repo.bulkRestore).toHaveBeenCalledWith([ID_A], USER_ID);
      expect(result).toEqual({ count: 1, skipped: [{ id: ID_B, errorCode: BlogPostErrorCode.SLUG_CONFLICT }] });
    });

    // Two trashed posts can share a slug: neither collides with a live row, but
    // restoring both would collide with each other.
    it('holds back a same-batch slug collision', async () => {
      repo.findBulkTargets.mockResolvedValue([
        target({ id: ID_A, slug: 'dup', isDeleted: true }),
        target({ id: ID_B, slug: 'dup', isDeleted: true }),
      ]);
      repo.bulkRestore.mockResolvedValue(1);

      const result = await run('restore', [ID_A, ID_B]);

      expect(repo.bulkRestore).toHaveBeenCalledWith([ID_A], USER_ID);
      expect(result.skipped).toEqual([{ id: ID_B, errorCode: BlogPostErrorCode.SLUG_CONFLICT }]);
    });

    it('skips the write entirely when nothing is eligible', async () => {
      repo.findBulkTargets.mockResolvedValue([target({ id: ID_A, hasContent: false })]);
      const result = await run('publish');
      expect(repo.bulkSetStatus).not.toHaveBeenCalled();
      expect(result.count).toBe(0);
    });
  });
});
