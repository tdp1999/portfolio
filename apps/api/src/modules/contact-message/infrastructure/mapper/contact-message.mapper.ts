import { ContactMessage as PrismaContactMessage } from '@prisma/client';

import { ContactMessage } from '../../domain/entities/contact-message.entity';
import { IContactMessageProps } from '../../domain/contact-message.types';

export class ContactMessageMapper {
  static toDomain(raw: PrismaContactMessage): ContactMessage {
    const props: IContactMessageProps = {
      id: raw.id,
      name: raw.name,
      email: raw.email,
      purpose: raw.purpose,
      subject: raw.subject,
      message: raw.message,
      status: raw.status,
      isSpam: raw.isSpam,
      ipAddress: raw.ipAddress,
      userAgent: raw.userAgent,
      locale: raw.locale,
      consentGivenAt: raw.consentGivenAt,
      createdAt: raw.createdAt,
      readAt: raw.readAt,
      repliedAt: raw.repliedAt,
      archivedAt: raw.archivedAt,
      expiresAt: raw.expiresAt,
      deletedAt: raw.deletedAt,
    };
    return ContactMessage.load(props);
  }

  static toPrisma(entity: ContactMessage): Omit<PrismaContactMessage, 'createdAt'> {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      purpose: entity.purpose,
      subject: entity.subject,
      message: entity.message,
      status: entity.status,
      isSpam: entity.isSpam,
      ipAddress: entity.ipAddress,
      userAgent: entity.userAgent,
      locale: entity.locale,
      consentGivenAt: entity.consentGivenAt,
      readAt: entity.readAt,
      repliedAt: entity.repliedAt,
      archivedAt: entity.archivedAt,
      expiresAt: entity.expiresAt,
      deletedAt: entity.deletedAt,
    };
  }
}
