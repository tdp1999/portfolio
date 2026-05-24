import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import type { AboutPrinciplesResponse, PublicAboutPrinciple } from './principle.types';

@Injectable({ providedIn: 'root' })
export class PrincipleService {
  private http = inject(HttpClient);

  /** Cached for the lifetime of the singleton service. SSR consumes via the
   *  global HTTP transfer cache (`provideHttpTransferCache`) so the request
   *  fires once during render and replays on the client without a second
   *  network hop. */
  private principles$?: Observable<readonly PublicAboutPrinciple[]>;

  getPublicPrinciples(): Observable<readonly PublicAboutPrinciple[]> {
    this.principles$ ??= this.http.get<AboutPrinciplesResponse>('/api/about/principles').pipe(
      map((res) => res.items ?? []),
      catchError(() => of<readonly PublicAboutPrinciple[]>([])),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.principles$;
  }
}
