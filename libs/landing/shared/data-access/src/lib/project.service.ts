import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { API_BASE_URL } from './api-base-url.token';
import type { ProjectListItem, ProjectDetail } from './project.types';

@Injectable({ providedIn: 'root' })
export class ProjectDataService {
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);

  getPublicProjects(): Observable<ProjectListItem[]> {
    return this.http.get<ProjectListItem[]>(`${this.baseUrl}/api/projects`).pipe(catchError(() => of([])));
  }

  getBySlug(slug: string): Observable<ProjectDetail | null> {
    return this.http.get<ProjectDetail>(`${this.baseUrl}/api/projects/${slug}`).pipe(catchError(() => of(null)));
  }
}
