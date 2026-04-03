import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { API_BASE_URL } from './api-base-url.token';
import type { PublicProfileResponse, ProfileJsonLd } from './profile.types';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);

  getPublicProfile(): Observable<PublicProfileResponse | null> {
    return this.http.get<PublicProfileResponse>(`${this.baseUrl}/api/profile`).pipe(catchError(() => of(null)));
  }

  getJsonLd(locale: string): Observable<ProfileJsonLd> {
    return this.http.get<ProfileJsonLd>(`${this.baseUrl}/api/profile/json-ld?locale=${locale}`);
  }
}
