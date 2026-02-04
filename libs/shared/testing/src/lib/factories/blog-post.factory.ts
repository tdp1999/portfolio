import { BlogPost } from '@portfolio/shared/types';

/**
 * Creates a mock BlogPost entity for testing
 * @param overrides - Partial BlogPost properties to override defaults
 */
export function createMockBlogPost(overrides?: Partial<BlogPost>): BlogPost {
  const now = new Date();
  return {
    id: '1',
    title: 'Mock Blog Post',
    slug: 'mock-blog-post',
    content: 'This is the full content of the mock blog post.',
    excerpt: 'This is a brief excerpt of the blog post.',
    publishedAt: now,
    tags: ['testing', 'typescript'],
    published: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates multiple mock BlogPost entities
 * @param count - Number of blog posts to create
 * @param overrides - Partial BlogPost properties to apply to all
 */
export function createMockBlogPosts(count: number, overrides?: Partial<BlogPost>): BlogPost[] {
  return Array.from({ length: count }, (_, i) =>
    createMockBlogPost({
      id: String(i + 1),
      title: `Blog Post ${i + 1}`,
      slug: `blog-post-${i + 1}`,
      ...overrides,
    })
  );
}
