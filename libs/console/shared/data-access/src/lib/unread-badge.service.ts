import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api';
import type { UnreadCountResponse } from './unread-badge.types';

@Injectable({ providedIn: 'root' })
export class UnreadBadgeService {
  private readonly api = inject(ApiService);
  private readonly countSignal = signal(0);

  readonly count = this.countSignal.asReadonly();

  refresh(): void {
    this.api.get<UnreadCountResponse>('/contact-messages/unread-count').subscribe({
      next: (res) => this.countSignal.set(res.unreadCount),
      error: () => {
        // Silently fail — badge is non-critical
      },
    });
  }
}
