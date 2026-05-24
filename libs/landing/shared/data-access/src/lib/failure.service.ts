import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import type { AboutFailuresResponse, PublicAboutFailure } from './failure.types';

@Injectable({ providedIn: 'root' })
export class FailureService {
  private http = inject(HttpClient);

  /** Cached for the lifetime of the singleton service. SSR consumes via the
   *  global HTTP transfer cache (`provideHttpTransferCache`) so the request
   *  fires once during render and replays on the client without a second
   *  network hop. */
  private failures$?: Observable<readonly PublicAboutFailure[]>;

  getPublicFailures(): Observable<readonly PublicAboutFailure[]> {
    this.failures$ ??= this.http.get<AboutFailuresResponse>('/api/about/failures').pipe(
      map((res) => res.items ?? []),
      catchError(() => of<readonly PublicAboutFailure[]>([])),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.failures$;
  }
}
