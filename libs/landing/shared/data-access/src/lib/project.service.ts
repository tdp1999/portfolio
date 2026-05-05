import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import type { ProjectListItem, ProjectDetail } from './project.types';

@Injectable({ providedIn: 'root' })
export class ProjectDataService {
  private http = inject(HttpClient);

  getPublicProjects(): Observable<ProjectListItem[]> {
    return this.http.get<ProjectListItem[]>(`/api/projects`).pipe(catchError(() => of([])));
  }

  getFeatured(): Observable<ProjectDetail[]> {
    return this.http.get<ProjectDetail[]>(`/api/projects/featured`).pipe(catchError(() => of([])));
  }

  getBySlug(slug: string): Observable<ProjectDetail | null> {
    return this.http.get<ProjectDetail>(`/api/projects/${slug}`).pipe(catchError(() => of(null)));
  }
}
