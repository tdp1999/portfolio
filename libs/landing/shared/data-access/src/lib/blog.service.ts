import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import type { BlogListQuery, BlogPostDetail, BlogPostListResponse } from './blog.types';

const EMPTY_LIST: BlogPostListResponse = { data: [], total: 0, page: 1, limit: 10 };

@Injectable({ providedIn: 'root' })
export class BlogDataService {
  private http = inject(HttpClient);

  list(query: BlogListQuery = {}): Observable<BlogPostListResponse> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', String(query.page));
    if (query.limit) params = params.set('limit', String(query.limit));
    if (query.categorySlug) params = params.set('categorySlug', query.categorySlug);
    if (query.tagSlug) params = params.set('tagSlug', query.tagSlug);

    return this.http.get<BlogPostListResponse>(`/api/blog`, { params }).pipe(catchError(() => of(EMPTY_LIST)));
  }

  getBySlug(slug: string): Observable<BlogPostDetail | null> {
    return this.http.get<BlogPostDetail>(`/api/blog/${slug}`).pipe(catchError(() => of(null)));
  }
}
