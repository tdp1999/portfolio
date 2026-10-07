import { Injectable, inject } from '@angular/core';
import { ApiService } from '@portfolio/console/shared/data-access';

import type { AiCall, AiStatus, AiTestResult, AiUsage, AiUsageRange } from './ai.types';

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly api = inject(ApiService);

  getStatus() {
    return this.api.get<AiStatus>('/ai/status');
  }

  getUsage(range: AiUsageRange) {
    return this.api.get<AiUsage>('/ai/usage', { params: { range } });
  }

  listCalls(limit = 50) {
    return this.api.get<AiCall[]>('/ai/calls', { params: { limit: String(limit) } });
  }

  /** A failed test is a normal answer (`ok: false`), not an HTTP error. */
  testConnection() {
    return this.api.post<AiTestResult>('/ai/test', {});
  }
}
