import { inject, Injectable } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ApiService } from '../api';
import type { VersionInfo } from './version.types';

@Injectable({ providedIn: 'root' })
export class VersionService {
  private readonly api = inject(ApiService);

  getVersion() {
    return this.api.get<VersionInfo>('/version').pipe(catchError(() => of(null)));
  }
}
