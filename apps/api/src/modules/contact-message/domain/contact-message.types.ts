import { ContactMessageStatus, ContactPurpose } from '@prisma/client';

export interface IContactMessageProps {
  id: string;
  name: string;
  email: string;
  purpose: ContactPurpose;
  subject: string | null;
  message: string;
  status: ContactMessageStatus;
  isSpam: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  locale: string;
  consentGivenAt: Date;
  createdAt: Date;
  readAt: Date | null;
  repliedAt: Date | null;
  archivedAt: Date | null;
  expiresAt: Date;
  deletedAt: Date | null;
}

export interface ICreateContactMessagePayload {
  name: string;
  email: string;
  purpose?: ContactPurpose;
  subject?: string;
  message: string;
  locale?: string;
  ipAddress?: string;
  userAgent?: string;
  consentGivenAt: Date;
}
