import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import type { VersionInfo } from './version.types';

@Injectable({ providedIn: 'root' })
export class VersionService {
  private http = inject(HttpClient);

  getVersion(): Observable<VersionInfo | null> {
    return this.http.get<VersionInfo>(`/api/version`).pipe(catchError(() => of(null)));
  }
}
