import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import type {
  ChecklistDocDetail,
  ChecklistDocKind,
  ChecklistDocSummary,
  ChecklistRunBody,
  ChecklistRunDetail,
  ChecklistRunSummary,
} from '@portfolio/shared/types';

import { CHECKLIST_API_PREFIX } from './checklist.constants';
import type { CreateChecklistRunInput, UpdateChecklistRunInput } from './checklist.types';

/**
 * The checklist API, called with the Owner's token by the private group's HttpClient. Client-only
 * (private pages never render on the server), so no transfer cache.
 *
 * Provided by `CHECKLIST_ROUTES`, never in root: the token-carrying HttpClient lives in the private
 * route group's injector, and a root service would get the app's plain HttpClient (every call 401).
 */
@Injectable()
export class ChecklistService {
  private readonly http = inject(HttpClient);

  /** Live docs only: an archived template cannot start a run (CHK-002). */
  listDocs(kind: ChecklistDocKind): Observable<ChecklistDocSummary[]> {
    return this.http.get<ChecklistDocSummary[]>(`${CHECKLIST_API_PREFIX}/docs`, { params: { kind } });
  }

  /** Archived docs too, so an older run still opens its references. */
  getDoc(kind: ChecklistDocKind, slug: string): Observable<ChecklistDocDetail> {
    return this.http.get<ChecklistDocDetail>(`${CHECKLIST_API_PREFIX}/docs/${kind.toLowerCase()}/${slug}`);
  }

  /** Most recently updated first. */
  listRuns(): Observable<ChecklistRunSummary[]> {
    return this.http.get<ChecklistRunSummary[]>(`${CHECKLIST_API_PREFIX}/runs`);
  }

  getRun(id: string): Observable<ChecklistRunDetail> {
    return this.http.get<ChecklistRunDetail>(`${CHECKLIST_API_PREFIX}/runs/${id}`);
  }

  createRun(input: CreateChecklistRunInput): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${CHECKLIST_API_PREFIX}/runs`, input);
  }

  updateRun(id: string, input: UpdateChecklistRunInput): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${CHECKLIST_API_PREFIX}/runs/${id}`, input);
  }

  deleteRun(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${CHECKLIST_API_PREFIX}/runs/${id}`);
  }

  /** Whole-body autosave. `version` is the one the page holds; a 409 means another tab saved first. */
  saveBody(id: string, version: number, body: ChecklistRunBody): Observable<{ version: number }> {
    return this.http.put<{ version: number }>(`${CHECKLIST_API_PREFIX}/runs/${id}`, { version, body });
  }
}
