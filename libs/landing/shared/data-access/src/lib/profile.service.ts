import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import type { PublicProfileResponse, ProfileJsonLd } from './profile.types';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);

  getPublicProfile(): Observable<PublicProfileResponse | null> {
    return this.http.get<PublicProfileResponse>(`/api/profile`).pipe(catchError(() => of(null)));
  }

  getJsonLd(locale: string): Observable<ProfileJsonLd> {
    return this.http.get<ProfileJsonLd>(`/api/profile/json-ld?locale=${locale}`);
  }
}
