import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api';
import type { DashboardStats } from './dashboard.types';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  getStats() {
    return this.api.get<DashboardStats>('/dashboard/stats');
  }
}
