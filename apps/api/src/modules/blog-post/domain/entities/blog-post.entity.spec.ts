import { BlogPost } from './blog-post.entity';
import { IBlogPostProps } from '../blog-post.types';

describe('BlogPost Entity', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000';

  const validProps: IBlogPostProps = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    slug: 'my-first-post',
    language: 'EN',
    title: 'My First Post',
    excerpt: 'A short excerpt',
    content: 'This is the body of my first blog post with enough words.',
    readTimeMinutes: 1,
    status: 'DRAFT',
    featured: false,
    publishedAt: null,
    metaTitle: null,
    metaDescription: null,
    authorId: userId,
    featuredImageId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdById: userId,
    updatedById: userId,
    deletedAt: null,
    deletedById: null,
  };

  describe('create()', () => {
    it('should generate slug from title and set defaults', () => {
      const post = BlogPost.create(
        { title: 'TypeScript Tips & Tricks', content: 'Some content here', authorId: userId },
        userId
      );

      expect(post.id).toBeDefined();
      expect(post.slug).toBe('typescript-tips-tricks');
      expect(post.status).toBe('DRAFT');
      expect(post.featured).toBe(false);
      expect(post.language).toBe('EN');
      expect(post.publishedAt).toBeNull();
      expect(post.isDeleted).toBe(false);
    });

    it('should calculate readTimeMinutes from content', () => {
      const words = Array(400).fill('word').join(' ');
      const post = BlogPost.create({ title: 'Long Post', content: words, authorId: userId }, userId);

      expect(post.readTimeMinutes).toBe(2);
    });

    it('should apply optional fields when provided', () => {
      const post = BlogPost.create(
        {
          title: 'Test',
          content: 'Content',
          authorId: userId,
          language: 'VI',
          excerpt: 'Excerpt text',
          featured: true,
          metaTitle: 'SEO Title',
          metaDescription: 'SEO Desc',
          featuredImageId: '550e8400-e29b-41d4-a716-446655440099',
        },
        userId
      );

      expect(post.language).toBe('VI');
      expect(post.excerpt).toBe('Excerpt text');
      expect(post.featured).toBe(true);
      expect(post.metaTitle).toBe('SEO Title');
      expect(post.metaDescription).toBe('SEO Desc');
      expect(post.featuredImageId).toBe('550e8400-e29b-41d4-a716-446655440099');
    });
  });

  describe('calculateReadTime()', () => {
    it('should return 0 for empty content', () => {
      expect(BlogPost.calculateReadTime('')).toBe(0);
      expect(BlogPost.calculateReadTime('   ')).toBe(0);
    });

    it('should round up to 1 for short content', () => {
      expect(BlogPost.calculateReadTime('Hello world')).toBe(1);
    });

    it('should calculate correctly for 200 words', () => {
      const words = Array(200).fill('word').join(' ');
      expect(BlogPost.calculateReadTime(words)).toBe(1);
    });

    it('should calculate correctly for 201 words', () => {
      const words = Array(201).fill('word').join(' ');
      expect(BlogPost.calculateReadTime(words)).toBe(2);
    });

    it('should calculate correctly for 1000 words', () => {
      const words = Array(1000).fill('word').join(' ');
      expect(BlogPost.calculateReadTime(words)).toBe(5);
    });
  });

  describe('update()', () => {
    it('should regenerate slug when title changes', () => {
      const post = BlogPost.load(validProps);

      const updated = post.update({ title: 'New Title Here' }, userId);

      expect(updated.slug).toBe('new-title-here');
      expect(updated.title).toBe('New Title Here');
    });

    it('should recalculate readTimeMinutes when content changes', () => {
      const post = BlogPost.load(validProps);
      const newContent = Array(600).fill('word').join(' ');

      const updated = post.update({ content: newContent }, userId);

      expect(updated.readTimeMinutes).toBe(3);
    });

    it('should preserve unchanged fields', () => {
      const post = BlogPost.load(validProps);

      const updated = post.update({ featured: true }, userId);

      expect(updated.title).toBe(validProps.title);
      expect(updated.slug).toBe(validProps.slug);
      expect(updated.content).toBe(validProps.content);
      expect(updated.readTimeMinutes).toBe(validProps.readTimeMinutes);
      expect(updated.featured).toBe(true);
    });

    it('should clear nullable fields when set to null', () => {
      const post = BlogPost.load({ ...validProps, excerpt: 'Has excerpt', metaTitle: 'Has meta' });

      const updated = post.update({ excerpt: null, metaTitle: null }, userId);

      expect(updated.excerpt).toBeNull();
      expect(updated.metaTitle).toBeNull();
    });

    it('should throw CONTENT_REQUIRED when transitioning to PUBLISHED without content', () => {
      const post = BlogPost.load({ ...validProps, content: '' });

      expect(() => post.update({ status: 'PUBLISHED' }, userId)).toThrow();
    });

    it('should throw CONTENT_REQUIRED when transitioning to UNLISTED without title', () => {
      const post = BlogPost.load({ ...validProps, title: '' });

      expect(() => post.update({ status: 'UNLISTED' }, userId)).toThrow();
    });

    it('should auto-set publishedAt on first transition to PUBLISHED', () => {
      const post = BlogPost.load(validProps);

      const updated = post.update({ status: 'PUBLISHED' }, userId);

      expect(updated.publishedAt).toBeInstanceOf(Date);
    });

    it('should preserve existing publishedAt on subsequent status changes', () => {
      const existingDate = new Date('2026-03-01');
      const post = BlogPost.load({ ...validProps, status: 'PUBLISHED', publishedAt: existingDate });

      const updated = post.update({ status: 'DRAFT' }, userId);
      const republished = updated.update({ status: 'PUBLISHED' }, userId);

      expect(republished.publishedAt).toBe(existingDate);
    });

    it('should allow manual publishedAt override', () => {
      const manualDate = new Date('2025-12-25');
      const post = BlogPost.load(validProps);

      const updated = post.update({ status: 'PUBLISHED', publishedAt: manualDate }, userId);

      expect(updated.publishedAt).toBe(manualDate);
    });
  });

  describe('publish()', () => {
    it('should set status to PUBLISHED and auto-set publishedAt on first publish', () => {
      const post = BlogPost.load(validProps);

      const published = post.publish(userId);

      expect(published.status).toBe('PUBLISHED');
      expect(published.publishedAt).toBeInstanceOf(Date);
    });

    it('should preserve existing publishedAt on subsequent publish', () => {
      const existingDate = new Date('2026-02-15');
      const post = BlogPost.load({ ...validProps, publishedAt: existingDate });

      const published = post.publish(userId);

      expect(published.publishedAt).toBe(existingDate);
    });

    it('should throw CONTENT_REQUIRED if title is empty', () => {
      const post = BlogPost.load({ ...validProps, title: '' });

      expect(() => post.publish(userId)).toThrow('Title and content are required before publishing');
    });

    it('should throw CONTENT_REQUIRED if content is empty', () => {
      const post = BlogPost.load({ ...validProps, content: '' });

      expect(() => post.publish(userId)).toThrow('Title and content are required before publishing');
    });
  });

  describe('softDelete() / restore()', () => {
    it('should soft delete and preserve immutability', () => {
      const post = BlogPost.load(validProps);

      const deleted = post.softDelete(userId);

      expect(deleted.isDeleted).toBe(true);
      expect(deleted.deletedById).toBe(userId);
      expect(post.isDeleted).toBe(false);
    });

    it('should restore a deleted post', () => {
      const post = BlogPost.load({ ...validProps, deletedAt: new Date(), deletedById: userId });

      const restored = post.restore(userId);

      expect(restored.isDeleted).toBe(false);
      expect(restored.deletedAt).toBeNull();
      expect(restored.deletedById).toBeNull();
    });
  });

  describe('toProps()', () => {
    it('should return a copy of props', () => {
      const post = BlogPost.load(validProps);

      const props = post.toProps();

      expect(props).toEqual(validProps);
      expect(props).not.toBe(validProps);
    });
  });
});
