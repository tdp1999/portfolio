import { BlogPostMapper, PrismaBlogPostWithRelations } from './blog-post.mapper';

describe('BlogPostMapper', () => {
  const rawBlogPost: PrismaBlogPostWithRelations = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    slug: 'test-post',
    language: 'EN',
    title: 'Test Post',
    excerpt: 'A test excerpt',
    content: 'This is test content for the blog post.',
    readTimeMinutes: 1,
    status: 'DRAFT',
    featured: false,
    publishedAt: null,
    metaTitle: 'SEO Title',
    metaDescription: 'SEO Description',
    authorId: '550e8400-e29b-41d4-a716-446655440000',
    featuredImageId: '550e8400-e29b-41d4-a716-446655440099',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    createdById: '550e8400-e29b-41d4-a716-446655440000',
    updatedById: '550e8400-e29b-41d4-a716-446655440000',
    deletedAt: null,
    deletedById: null,
    categories: [
      {
        postId: '550e8400-e29b-41d4-a716-446655440001',
        categoryId: '550e8400-e29b-41d4-a716-446655440010',
        category: {
          id: '550e8400-e29b-41d4-a716-446655440010',
          name: 'Tech',
          slug: 'tech',
          description: null,
          displayOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdById: '550e8400-e29b-41d4-a716-446655440000',
          updatedById: '550e8400-e29b-41d4-a716-446655440000',
          deletedAt: null,
          deletedById: null,
        },
      },
    ],
    tags: [
      {
        postId: '550e8400-e29b-41d4-a716-446655440001',
        tagId: '550e8400-e29b-41d4-a716-446655440020',
        tag: {
          id: '550e8400-e29b-41d4-a716-446655440020',
          name: 'TypeScript',
          slug: 'typescript',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdById: '550e8400-e29b-41d4-a716-446655440000',
          updatedById: '550e8400-e29b-41d4-a716-446655440000',
          deletedAt: null,
          deletedById: null,
        },
      },
    ],
    featuredImage: {
      id: '550e8400-e29b-41d4-a716-446655440099',
      originalFilename: 'hero.jpg',
      mimeType: 'image/jpeg',
      publicId: 'dev/hero',
      url: 'https://res.cloudinary.com/test/image/upload/hero.jpg',
      format: 'jpg',
      bytes: 50000,
      width: 1200,
      height: 630,
      altText: 'Hero image',
      caption: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: '550e8400-e29b-41d4-a716-446655440000',
      updatedById: '550e8400-e29b-41d4-a716-446655440000',
      deletedAt: null,
      deletedById: null,
    },
  };

  describe('toDomain()', () => {
    it('should map Prisma record to domain entity', () => {
      const entity = BlogPostMapper.toDomain(rawBlogPost);

      expect(entity.id).toBe(rawBlogPost.id);
      expect(entity.slug).toBe('test-post');
      expect(entity.title).toBe('Test Post');
      expect(entity.language).toBe('EN');
      expect(entity.content).toBe(rawBlogPost.content);
      expect(entity.status).toBe('DRAFT');
      expect(entity.featured).toBe(false);
      expect(entity.publishedAt).toBeNull();
      expect(entity.authorId).toBe(rawBlogPost.authorId);
      expect(entity.featuredImageId).toBe(rawBlogPost.featuredImageId);
      expect(entity.metaTitle).toBe('SEO Title');
    });
  });

  describe('toRelations()', () => {
    it('should map categories and tags from junction tables', () => {
      const relations = BlogPostMapper.toRelations(rawBlogPost);

      expect(relations.categories).toHaveLength(1);
      expect(relations.categories[0]).toEqual({
        id: '550e8400-e29b-41d4-a716-446655440010',
        name: 'Tech',
        slug: 'tech',
      });

      expect(relations.tags).toHaveLength(1);
      expect(relations.tags[0]).toEqual({
        id: '550e8400-e29b-41d4-a716-446655440020',
        name: 'TypeScript',
        slug: 'typescript',
      });
    });

    it('should return empty arrays when no categories or tags', () => {
      const raw = { ...rawBlogPost, categories: [], tags: [] };

      const relations = BlogPostMapper.toRelations(raw);

      expect(relations.categories).toEqual([]);
      expect(relations.tags).toEqual([]);
    });
  });

  describe('toReadResult()', () => {
    it('should combine entity, relations, and featured image URL', () => {
      const result = BlogPostMapper.toReadResult(rawBlogPost);

      expect(result.entity.id).toBe(rawBlogPost.id);
      expect(result.relations.categories).toHaveLength(1);
      expect(result.relations.tags).toHaveLength(1);
      expect(result.featuredImageUrl).toBe('https://res.cloudinary.com/test/image/upload/hero.jpg');
    });

    it('should return null featured image URL when no image', () => {
      const raw = { ...rawBlogPost, featuredImage: null };

      const result = BlogPostMapper.toReadResult(raw);

      expect(result.featuredImageUrl).toBeNull();
    });
  });

  describe('toPrisma()', () => {
    it('should map domain entity to Prisma create input', () => {
      const entity = BlogPostMapper.toDomain(rawBlogPost);

      const prismaData = BlogPostMapper.toPrisma(entity);

      expect(prismaData.id).toBe(rawBlogPost.id);
      expect(prismaData.slug).toBe('test-post');
      expect(prismaData.title).toBe('Test Post');
      expect(prismaData.language).toBe('EN');
      expect(prismaData.status).toBe('DRAFT');
      expect(prismaData.authorId).toBe(rawBlogPost.authorId);
      expect(prismaData.createdById).toBe(rawBlogPost.createdById);
      expect(prismaData.updatedById).toBe(rawBlogPost.updatedById);
    });
  });
});
