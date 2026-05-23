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
