import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import type {
  BlogListQuery,
  BlogPostCategory,
  BlogPostDetail,
  BlogPostListItem,
  BlogPostListResponse,
} from './blog.types';

const EMPTY_LIST: BlogPostListResponse = { data: [], total: 0, page: 1, limit: 10 };

@Injectable({ providedIn: 'root' })
export class BlogDataService {
  private http = inject(HttpClient);

  // Cached hot observables for facets that don't change with the toolbar.
  // Same `shareReplay({ refCount: false })` pattern used by Profile / Skill /
  // Experience / Project services — survive cold re-subscription on
  // client-side nav back into /blog without re-firing the HTTP request.
  private featured$: Observable<readonly BlogPostListItem[]> | null = null;
  private categories$: Observable<readonly BlogPostCategory[]> | null = null;

  list(query: BlogListQuery = {}): Observable<BlogPostListResponse> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', String(query.page));
    if (query.limit) params = params.set('limit', String(query.limit));
    if (query.categorySlug) params = params.set('categorySlug', query.categorySlug);
    if (query.tagSlug) params = params.set('tagSlug', query.tagSlug);
    const trimmedSearch = query.search?.trim();
    if (trimmedSearch) params = params.set('search', trimmedSearch);
    // 'newest' is the default — don't serialize it to the URL.
    if (query.sort && query.sort !== 'newest') params = params.set('sort', query.sort);

    return this.http.get<BlogPostListResponse>(`/api/blog`, { params }).pipe(catchError(() => of(EMPTY_LIST)));
  }

  featured(): Observable<readonly BlogPostListItem[]> {
    if (!this.featured$) {
      this.featured$ = this.http.get<BlogPostListItem[]>(`/api/blog/featured`).pipe(
        catchError(() => of<BlogPostListItem[]>([])),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.featured$;
  }

  /**
   * Categories that have at least one PUBLISHED post. Derived from a single
   * unfiltered `/api/blog?limit=200` fetch — enough to cover the 4 seeded
   * categories without a dedicated facets endpoint. Cached so filter chips
   * never re-fetch.
   */
  categories(): Observable<readonly BlogPostCategory[]> {
    if (!this.categories$) {
      this.categories$ = this.http
        .get<BlogPostListResponse>(`/api/blog`, { params: new HttpParams().set('limit', '200') })
        .pipe(
          catchError(() => of(EMPTY_LIST)),
          map((res) => {
            const seen = new Map<string, BlogPostCategory>();
            for (const p of res.data) {
              for (const c of p.categories) {
                if (!seen.has(c.slug)) seen.set(c.slug, c);
              }
            }
            return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
          }),
          shareReplay({ bufferSize: 1, refCount: false })
        );
    }
    return this.categories$;
  }

  getBySlug(slug: string): Observable<BlogPostDetail | null> {
    return this.http.get<BlogPostDetail>(`/api/blog/${slug}`).pipe(catchError(() => of(null)));
  }
}
