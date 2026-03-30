import { ContactMessage } from '../domain/entities/contact-message.entity';

import { ContactMessageListItemDto, ContactMessageResponseDto, UnreadCountDto } from './contact-message.dto';

export class ContactMessagePresenter {
  static toResponse(entity: ContactMessage): ContactMessageResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      purpose: entity.purpose,
      subject: entity.subject,
      message: entity.message,
      status: entity.status,
      isSpam: entity.isSpam,
      locale: entity.locale,
      createdAt: entity.createdAt,
      readAt: entity.readAt,
      repliedAt: entity.repliedAt,
      archivedAt: entity.archivedAt,
      expiresAt: entity.expiresAt,
      deletedAt: entity.deletedAt,
    };
  }

  static toListItem(entity: ContactMessage): ContactMessageListItemDto {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      purpose: entity.purpose,
      subject: entity.subject ? truncate(entity.subject, 100) : null,
      status: entity.status,
      isSpam: entity.isSpam,
      createdAt: entity.createdAt,
    };
  }

  static toUnreadCount(count: number): UnreadCountDto {
    return { unreadCount: count };
  }
}

function truncate(str: string, maxLength: number): string {
  return str.length > maxLength ? str.slice(0, maxLength) + '…' : str;
}
