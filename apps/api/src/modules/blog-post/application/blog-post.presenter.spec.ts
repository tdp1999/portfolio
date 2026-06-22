import { BlogPost } from '../domain/entities/blog-post.entity';
import { IBlogPostProps } from '../domain/blog-post.types';
import { BlogPostPresenter } from './blog-post.presenter';
import { BlogPostReadResult } from '../infrastructure/mapper/blog-post.mapper';

const USER_ID = '00000000-0000-0000-0000-000000000001';
const POST_ID = '00000000-0000-0000-0000-0000000000aa';

const baseProps: IBlogPostProps = {
  id: POST_ID,
  slug: 'hello-world',
  language: 'EN',
  title: 'Hello World',
  excerpt: 'A short excerpt',
  content: 'Body content here.',
  contentJson: null,
  contentHtml: null,
  contentSchemaVersion: 1,
  readTimeMinutes: 3,
  status: 'PUBLISHED',
  featured: true,
  publishedAt: new Date('2026-01-01'),
  metaTitle: 'Meta T',
  metaDescription: 'Meta D',
  authorId: USER_ID,
  featuredImageId: '00000000-0000-0000-0000-0000000000bb',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
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
  featuredImageUrl: 'https://cdn.example.com/img.png',
});

describe('BlogPostPresenter', () => {
  describe('toPublicList', () => {
    it('returns only public list fields', () => {
      const r = BlogPostPresenter.toPublicList(makeReadResult());
      expect(r.slug).toBe('hello-world');
      expect(r.title).toBe('Hello World');
      expect(r.excerpt).toBe('A short excerpt');
      expect(r.featuredImageUrl).toBe('https://cdn.example.com/img.png');
      expect(r.categories).toEqual([{ id: 'c1', name: 'Tech', slug: 'tech' }]);
      expect(r.tags).toEqual([{ id: 't1', name: 'Angular', slug: 'angular' }]);
      expect(r.readTimeMinutes).toBe(3);
      expect(r).not.toHaveProperty('content');
      expect(r).not.toHaveProperty('authorId');
    });
  });

  describe('toPublicDetail', () => {
    it('includes content, meta, author, and related posts', () => {
      const author = { id: USER_ID, name: 'Phong', avatarUrl: null, shortBio: 'Dev' };
      const related = [makeReadResult({ id: 'rel-1', slug: 'related-1', title: 'Related 1' })];
      const r = BlogPostPresenter.toPublicDetail(makeReadResult(), author, related);

      expect(r.content).toBe('Body content here.');
      expect(r.metaTitle).toBe('Meta T');
      expect(r.author).toEqual(author);
      expect(r.relatedPosts).toHaveLength(1);
      expect(r.relatedPosts[0].slug).toBe('related-1');
      expect(r.relatedPosts[0]).not.toHaveProperty('content');
    });

    it('handles null author', () => {
      const r = BlogPostPresenter.toPublicDetail(makeReadResult(), null, []);
      expect(r.author).toBeNull();
      expect(r.relatedPosts).toEqual([]);
    });
  });

  describe('toJsonLd', () => {
    const ORIGINAL_FRONTEND_URL = process.env['FRONTEND_URL'];
    beforeEach(() => {
      process.env['FRONTEND_URL'] = 'https://thunderphong.com/';
    });
    afterEach(() => {
      if (ORIGINAL_FRONTEND_URL === undefined) delete process.env['FRONTEND_URL'];
      else process.env['FRONTEND_URL'] = ORIGINAL_FRONTEND_URL;
    });

    it('returns schema.org BlogPosting with required fields', () => {
      const author = { id: USER_ID, name: 'Phong', avatarUrl: null, shortBio: null };
      const r = BlogPostPresenter.toJsonLd(makeReadResult(), author);

      expect(r['@context']).toBe('https://schema.org');
      expect(r['@type']).toBe('BlogPosting');
      expect(r.headline).toBe('Hello World');
      expect(r.description).toBe('Meta D');
      expect(r.datePublished).toBe(new Date('2026-01-01').toISOString());
      expect(r.dateModified).toBe(new Date('2026-01-02').toISOString());
      expect(r.author).toEqual({ '@type': 'Person', name: 'Phong', url: null });
      expect(r.publisher).toEqual({ '@type': 'Person', name: 'Phong' });
      expect(r.mainEntityOfPage).toBe('https://thunderphong.com/blog/hello-world');
      expect(r.inLanguage).toBe('en');
    });

    it('includes image only when featuredImageUrl present', () => {
      const r = BlogPostPresenter.toJsonLd(makeReadResult(), null);
      expect(r.image).toBe('https://cdn.example.com/img.png');
    });

    it('omits image (does not set to null) when no featured image', () => {
      const item = makeReadResult();
      item.featuredImageUrl = null;
      const r = BlogPostPresenter.toJsonLd(item, null);
      expect(r).not.toHaveProperty('image');
    });

    it('falls back description to excerpt when metaDescription missing', () => {
      const r = BlogPostPresenter.toJsonLd(makeReadResult({ metaDescription: null }), null);
      expect(r.description).toBe('A short excerpt');
    });

    it('falls back author name to "Phuong Tran" when author is null', () => {
      const r = BlogPostPresenter.toJsonLd(makeReadResult(), null);
      expect(r.author.name).toBe('Phuong Tran');
      expect(r.publisher.name).toBe('Phuong Tran');
    });

    it('reports VI posts with inLanguage = "vi"', () => {
      const r = BlogPostPresenter.toJsonLd(makeReadResult({ language: 'VI' }), null);
      expect(r.inLanguage).toBe('vi');
    });

    it('falls back datePublished to createdAt when publishedAt is null', () => {
      const r = BlogPostPresenter.toJsonLd(makeReadResult({ publishedAt: null }), null);
      expect(r.datePublished).toBe(new Date('2026-01-01').toISOString());
    });

    it('exposes jsonLd inside toPublicDetail payload (Option B)', () => {
      const r = BlogPostPresenter.toPublicDetail(makeReadResult(), null, []);
      expect(r.jsonLd['@type']).toBe('BlogPosting');
      expect(r.jsonLd.mainEntityOfPage).toBe('https://thunderphong.com/blog/hello-world');
    });
  });

  describe('toAdminList', () => {
    it('exposes status and audit timestamps', () => {
      const r = BlogPostPresenter.toAdminList(makeReadResult({ deletedAt: new Date('2026-02-01') }));
      expect(r.id).toBe(POST_ID);
      expect(r.status).toBe('PUBLISHED');
      expect(r.featured).toBe(true);
      expect(r.deletedAt).toEqual(new Date('2026-02-01'));
      expect(r).not.toHaveProperty('content');
    });
  });

  describe('toAdmin', () => {
    it('exposes full entity data including audit fields', () => {
      const r = BlogPostPresenter.toAdmin(makeReadResult());
      expect(r.content).toBe('Body content here.');
      expect(r.excerpt).toBe('A short excerpt');
      expect(r.metaDescription).toBe('Meta D');
      expect(r.authorId).toBe(USER_ID);
      expect(r.featuredImageId).toBe('00000000-0000-0000-0000-0000000000bb');
      expect(r.createdById).toBe(USER_ID);
      expect(r.updatedById).toBe(USER_ID);
    });
  });
});
