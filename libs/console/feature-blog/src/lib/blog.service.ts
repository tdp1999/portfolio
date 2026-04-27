import { Injectable, inject } from '@angular/core';
import { ApiService } from '@portfolio/console/shared/data-access';
import {
  AdminBlogPostDetail,
  BlogPostListResponse,
  BlogStatus,
  BlogLanguage,
  CreateBlogPostPayload,
  UpdateBlogPostPayload,
  ImportMarkdownPayload,
  BlogCategoryRef,
  BlogTagRef,
} from './blog.types';

export interface ListBlogPostsParams {
  page: number;
  limit: number;
  status?: BlogStatus;
  language?: BlogLanguage;
  includeDeleted?: boolean;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly api = inject(ApiService);

  list(params: ListBlogPostsParams) {
    const queryParams: Record<string, string> = {
      page: String(params.page),
      limit: String(params.limit),
    };
    if (params.status) queryParams['status'] = params.status;
    if (params.language) queryParams['language'] = params.language;
    if (params.includeDeleted) queryParams['includeDeleted'] = 'true';
    if (params.search) queryParams['search'] = params.search;
    if (params.sortBy) queryParams['sortBy'] = params.sortBy;
    if (params.sortDir) queryParams['sortDir'] = params.sortDir;
    return this.api.get<BlogPostListResponse>('/admin/blog', { params: queryParams });
  }

  getById(id: string) {
    return this.api.get<AdminBlogPostDetail>(`/admin/blog/${id}`);
  }

  create(data: CreateBlogPostPayload) {
    return this.api.post<{ id: string }>('/admin/blog', data);
  }

  update(id: string, data: UpdateBlogPostPayload) {
    return this.api.put<{ success: boolean }>(`/admin/blog/${id}`, data);
  }

  delete(id: string) {
    return this.api.delete<{ success: boolean }>(`/admin/blog/${id}`);
  }

  restore(id: string) {
    return this.api.post<{ success: boolean }>(`/admin/blog/${id}/restore`, {});
  }

  importMarkdown(data: ImportMarkdownPayload) {
    return this.api.post<{ id: string }>('/admin/blog/import-markdown', data);
  }

  listAllCategories() {
    return this.api.get<{ data: BlogCategoryRef[] }>('/categories', {
      params: { page: '1', limit: '200' },
    });
  }

  listAllTags() {
    return this.api.get<{ data: BlogTagRef[] }>('/tags', {
      params: { page: '1', limit: '500' },
    });
  }
}
