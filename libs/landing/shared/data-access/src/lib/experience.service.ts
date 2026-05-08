import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, shareReplay } from 'rxjs';
import type { PublicExperience } from './experience.types';

@Injectable({ providedIn: 'root' })
export class ExperienceService {
  private http = inject(HttpClient);

  /** Cached for the lifetime of the singleton service. See ProfileService for rationale. */
  private experiences$?: Observable<PublicExperience[]>;

  getPublicExperiences(): Observable<PublicExperience[]> {
    this.experiences$ ??= this.http.get<PublicExperience[]>(`/api/experiences`).pipe(
      catchError(() => of([])),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.experiences$;
  }
}
