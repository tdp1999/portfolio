import { Injectable, inject } from '@angular/core';
import { ApiService } from '@portfolio/console/shared/data-access';
import { ContactMessageDetail, ListMessagesParams, MessagesListResponse, UnreadCountResponse } from './message.types';

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
