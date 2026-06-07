import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, shareReplay } from 'rxjs';
import type { ProjectListItem, ProjectDetailData } from './project.types';

@Injectable({ providedIn: 'root' })
export class ProjectDataService {
  private http = inject(HttpClient);

  /** Per-collection caches. See ProfileService for rationale. */
  private projects$?: Observable<ProjectListItem[]>;
  private featured$?: Observable<ProjectDetailData[]>;
  /** Per-slug detail cache — keyed by slug since each detail is a distinct request. */
  private readonly bySlug = new Map<string, Observable<ProjectDetailData | null>>();

  getPublicProjects(): Observable<ProjectListItem[]> {
    this.projects$ ??= this.http.get<ProjectListItem[]>(`/api/projects`).pipe(
      catchError(() => of([])),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.projects$;
  }

  getFeatured(): Observable<ProjectDetailData[]> {
    this.featured$ ??= this.http.get<ProjectDetailData[]>(`/api/projects/featured`).pipe(
      catchError(() => of([])),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.featured$;
  }

  getBySlug(slug: string): Observable<ProjectDetailData | null> {
    let cached = this.bySlug.get(slug);
    if (!cached) {
      cached = this.http.get<ProjectDetailData>(`/api/projects/${slug}`).pipe(
        catchError(() => of(null)),
        shareReplay({ bufferSize: 1, refCount: false })
      );
      this.bySlug.set(slug, cached);
    }
    return cached;
  }
}
