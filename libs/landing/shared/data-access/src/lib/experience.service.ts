import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import type { PublicExperience } from './experience.types';

@Injectable({ providedIn: 'root' })
export class ExperienceService {
  private http = inject(HttpClient);

  getPublicExperiences(): Observable<PublicExperience[]> {
    return this.http.get<PublicExperience[]>(`/api/experiences`).pipe(catchError(() => of([])));
  }
}
