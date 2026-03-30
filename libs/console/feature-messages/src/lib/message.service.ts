import { Injectable, inject } from '@angular/core';
import { ApiService } from '@portfolio/console/shared/data-access';

export interface ContactMessageListItem {
  id: string;
  name: string;
  email: string;
  purpose: string;
  subject: string | null;
  status: string;
  isSpam: boolean;
  createdAt: string;
}

export interface ContactMessageDetail {
  id: string;
  name: string;
  email: string;
  purpose: string;
  subject: string | null;
  message: string;
  status: string;
  isSpam: boolean;
  locale: string;
  createdAt: string;
  readAt: string | null;
  repliedAt: string | null;
  archivedAt: string | null;
  expiresAt: string;
  deletedAt: string | null;
}

export interface MessagesListResponse {
  data: ContactMessageListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface ListMessagesParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  purpose?: string;
  includeSpam?: boolean;
}

@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly api = inject(ApiService);

  list(params: ListMessagesParams) {
    const queryParams: Record<string, string> = {
      page: String(params.page),
      limit: String(params.limit),
    };
    if (params.search) queryParams['search'] = params.search;
    if (params.status) queryParams['status'] = params.status;
    if (params.purpose) queryParams['purpose'] = params.purpose;
    if (params.includeSpam) queryParams['includeSpam'] = 'true';
    return this.api.get<MessagesListResponse>('/contact-messages', { params: queryParams });
  }

  getById(id: string) {
    return this.api.get<ContactMessageDetail>(`/contact-messages/${id}`);
  }

  getUnreadCount() {
    return this.api.get<UnreadCountResponse>('/contact-messages/unread-count');
  }

  markAsRead(id: string) {
    return this.api.patch<{ success: boolean }>(`/contact-messages/${id}/read`, {});
  }

  markAsUnread(id: string) {
    return this.api.patch<{ success: boolean }>(`/contact-messages/${id}/unread`, {});
  }

  setReplied(id: string) {
    return this.api.patch<{ success: boolean }>(`/contact-messages/${id}/replied`, {});
  }

  archive(id: string) {
    return this.api.patch<{ success: boolean }>(`/contact-messages/${id}/archive`, {});
  }

  restore(id: string) {
    return this.api.patch<{ success: boolean }>(`/contact-messages/${id}/restore`, {});
  }

  softDelete(id: string) {
    return this.api.delete<{ success: boolean }>(`/contact-messages/${id}`);
  }
}
