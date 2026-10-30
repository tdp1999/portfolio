import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { MedicineLookupItem } from '@portfolio/shared/types';
import type { Observable } from 'rxjs';

/** The medicine cabinet API. Requests under it carry the Owner's access token. */
const MEDICINE_CABINET_API_PREFIX = '/api/medicine-cabinet';

/**
 * Read-only lookup for 'S6 Trang tra cứu', called with the Owner's token by the private group's
 * HttpClient. Client-only (private pages never render on the server), so no transfer cache.
 *
 * Provided by `MEDICINE_CABINET_ROUTES`, never in root: the token-carrying HttpClient lives in the
 * private route group's injector, and a root service would get the app's plain HttpClient (every call 401).
 */
@Injectable()
export class MedicineCabinetService {
  private readonly http = inject(HttpClient);

  /** Every item of every person, each with its person's name. Filtering happens on the page. */
  lookup(): Observable<MedicineLookupItem[]> {
    return this.http.get<MedicineLookupItem[]>(`${MEDICINE_CABINET_API_PREFIX}/lookup`);
  }
}
