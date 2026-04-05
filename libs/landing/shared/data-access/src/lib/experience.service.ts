import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { API_BASE_URL } from './api-base-url.token';
import type { PublicExperience } from './experience.types';

@Injectable({ providedIn: 'root' })
export class ExperienceService {
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);

  getPublicExperiences(): Observable<PublicExperience[]> {
    return this.http.get<PublicExperience[]>(`${this.baseUrl}/api/experiences`).pipe(catchError(() => of([])));
  }
}
