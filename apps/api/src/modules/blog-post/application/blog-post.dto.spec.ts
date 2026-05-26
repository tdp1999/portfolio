import {
  CreateBlogPostSchema,
  UpdateBlogPostSchema,
  BlogPostQuerySchema,
  PublicBlogPostQuerySchema,
  ImportMarkdownSchema,
} from './blog-post.dto';

const COVER_ID = '550e8400-e29b-41d4-a716-446655440099';

const VALID_CREATE = {
  title: 'Hello World',
  content: 'Some body content',
  featuredImageId: COVER_ID,
};

describe('CreateBlogPostSchema', () => {
  it('parses valid input and applies defaults', () => {
    const result = CreateBlogPostSchema.safeParse(VALID_CREATE);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.language).toBe('EN');
      expect(result.data.status).toBe('DRAFT');
      expect(result.data.featured).toBe(false);
      expect(result.data.categoryIds).toEqual([]);
      expect(result.data.tagIds).toEqual([]);
    }
  });

  it('rejects missing title', () => {
    expect(CreateBlogPostSchema.safeParse({ content: 'x', featuredImageId: COVER_ID }).success).toBe(false);
  });

  it('rejects missing content', () => {
    expect(CreateBlogPostSchema.safeParse({ title: 'x', featuredImageId: COVER_ID }).success).toBe(false);
  });

  it('PST-011: rejects missing featuredImageId', () => {
    expect(CreateBlogPostSchema.safeParse({ title: 'x', content: 'y' }).success).toBe(false);
  });

  it('strips HTML from title', () => {
    const result = CreateBlogPostSchema.safeParse({
      ...VALID_CREATE,
      title: '<script>alert(1)</script>Hi',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title).toBe('alert(1)Hi');
  });

  it('strips HTML from excerpt and metaTitle', () => {
    const result = CreateBlogPostSchema.safeParse({
      ...VALID_CREATE,
      excerpt: '<b>x</b>',
      metaTitle: '<i>y</i>',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.excerpt).toBe('x');
      expect(result.data.metaTitle).toBe('y');
    }
  });

  it('rejects invalid uuid in categoryIds', () => {
    expect(CreateBlogPostSchema.safeParse({ ...VALID_CREATE, categoryIds: ['not-a-uuid'] }).success).toBe(false);
  });

  it('rejects invalid status enum', () => {
    expect(CreateBlogPostSchema.safeParse({ ...VALID_CREATE, status: 'WEIRD' }).success).toBe(false);
  });
});

describe('UpdateBlogPostSchema', () => {
  it('accepts a partial update', () => {
    expect(UpdateBlogPostSchema.safeParse({ title: 'New' }).success).toBe(true);
  });

  it('rejects empty payload', () => {
    expect(UpdateBlogPostSchema.safeParse({}).success).toBe(false);
  });

  it('allows nullable excerpt', () => {
    expect(UpdateBlogPostSchema.safeParse({ excerpt: null }).success).toBe(true);
  });
});

describe('BlogPostQuerySchema', () => {
  it('applies pagination defaults', () => {
    const r = BlogPostQuerySchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.page).toBe(1);
      expect(r.data.limit).toBe(20);
      expect(r.data.sortBy).toBe('updatedAt');
      expect(r.data.includeDeleted).toBe(false);
    }
  });

  it('coerces includeDeleted from string', () => {
    const r = BlogPostQuerySchema.safeParse({ includeDeleted: 'true' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.includeDeleted).toBe(true);
  });

  it('accepts category/tag slug filters', () => {
    const r = BlogPostQuerySchema.safeParse({ categorySlug: 'tech', tagSlug: 'angular' });
    expect(r.success).toBe(true);
  });
});

describe('PublicBlogPostQuerySchema', () => {
  it('does not accept status filter', () => {
    const r = PublicBlogPostQuerySchema.safeParse({ status: 'DRAFT' });
    expect(r.success).toBe(true);
    if (r.success) expect((r.data as Record<string, unknown>).status).toBeUndefined();
  });

  it("defaults sort to 'newest'", () => {
    const r = PublicBlogPostQuerySchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.sort).toBe('newest');
  });

  it("accepts sort='oldest'", () => {
    const r = PublicBlogPostQuerySchema.safeParse({ sort: 'oldest' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.sort).toBe('oldest');
  });

  it('rejects unknown sort values', () => {
    expect(PublicBlogPostQuerySchema.safeParse({ sort: 'random' }).success).toBe(false);
  });

  it('trims search and treats empty/whitespace as undefined', () => {
    const r1 = PublicBlogPostQuerySchema.safeParse({ search: '  ' });
    expect(r1.success).toBe(true);
    if (r1.success) expect(r1.data.search).toBeUndefined();

    const r2 = PublicBlogPostQuerySchema.safeParse({ search: '  hydration  ' });
    expect(r2.success).toBe(true);
    if (r2.success) expect(r2.data.search).toBe('hydration');
  });
});

describe('ImportMarkdownSchema', () => {
  it('requires content', () => {
    expect(ImportMarkdownSchema.safeParse({}).success).toBe(false);
  });

  it('allows missing title (cover still required)', () => {
    const r = ImportMarkdownSchema.safeParse({ content: '# Title\n\nbody', featuredImageId: COVER_ID });
    expect(r.success).toBe(true);
  });

  it('PST-011: rejects missing featuredImageId', () => {
    expect(ImportMarkdownSchema.safeParse({ content: '# Title\n\nbody' }).success).toBe(false);
  });
});
