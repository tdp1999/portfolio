import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, shareReplay } from 'rxjs';
import type { PublicProfileResponse, ProfileJsonLd } from './profile.types';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);

  /**
   * Cached observable, lifetime = singleton service (= app lifetime).
   * `refCount: false` keeps the response retained when subscriber count
   * drops to 0 (e.g. nav away from home), so re-subscribing on back-nav
   * replays the cached value synchronously — no second HTTP request, no
   * flash from `initialValue: null` → fetched data.
   *
   * SSR: HTTP transfer cache feeds the first subscription; this shareReplay
   * then retains it across all client-side re-subscriptions.
   */
  private profile$?: Observable<PublicProfileResponse | null>;

  getPublicProfile(): Observable<PublicProfileResponse | null> {
    this.profile$ ??= this.http.get<PublicProfileResponse>(`/api/profile`).pipe(
      catchError(() => of(null)),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.profile$;
  }

  getJsonLd(locale: string): Observable<ProfileJsonLd> {
    return this.http.get<ProfileJsonLd>(`/api/profile/json-ld?locale=${locale}`);
  }
}
