import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api';

interface UnreadCountResponse {
  unreadCount: number;
}

@Injectable({ providedIn: 'root' })
export class UnreadBadgeService {
  private readonly api = inject(ApiService);
  private readonly _count = signal(0);

  readonly count = this._count.asReadonly();

  refresh(): void {
    this.api.get<UnreadCountResponse>('/contact-messages/unread-count').subscribe({
      next: (res) => this._count.set(res.unreadCount),
      error: () => {
        // Silently fail — badge is non-critical
      },
    });
  }
}
