import type { BlogPostListResponse } from './blog.types';

export const EMPTY_LIST: BlogPostListResponse = { data: [], total: 0, page: 1, limit: 10 };
